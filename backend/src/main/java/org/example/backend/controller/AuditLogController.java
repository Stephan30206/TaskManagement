package org.example.backend.controller;

import org.example.backend.model.AuditLog;
import org.example.backend.service.AuditService;
import org.example.backend.service.PermissionService;
import org.example.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/audit-logs")
@CrossOrigin(origins = "http://localhost:3000")
public class AuditLogController {

    @Autowired
    private AuditService auditService;

    @Autowired
    private PermissionService permissionService;

    @Autowired
    private UserService userService;

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userService.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }

    @GetMapping("/projects/{projectId}")
    public ResponseEntity<?> getProjectAudits(
            @PathVariable String projectId,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int limit) {
        try {
            String userId = getCurrentUserId();

            if (!permissionService.canViewAudit(projectId, userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You don't have permission to view audit logs"));
            }

            List<AuditLog> audits = auditService.getAuditsByProject(projectId);

            int start = page * limit;
            int end = Math.min(start + limit, audits.size());
            List<AuditLog> paginated = audits.subList(start, end);

            return ResponseEntity.ok(Map.of(
                    "data", paginated,
                    "total", audits.size(),
                    "page", page,
                    "limit", limit
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/entities/{entityId}")
    public ResponseEntity<?> getEntityAudits(
            @PathVariable String entityId) {
        try {
            List<AuditLog> audits = auditService.getAuditsByEntity(entityId);
            return ResponseEntity.ok(audits);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<?> getUserAudits(
            @PathVariable String userId,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int limit) {
        try {
            String currentUserId = getCurrentUserId();

            if (!userId.equals(currentUserId) && !permissionService.hasPermission("any-project", currentUserId, "audit.view")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You can only view your own audit logs"));
            }

            List<AuditLog> audits = auditService.getAuditsByUser(userId);

            int start = page * limit;
            int end = Math.min(start + limit, audits.size());
            List<AuditLog> paginated = audits.subList(start, end);

            return ResponseEntity.ok(Map.of(
                    "data", paginated,
                    "total", audits.size(),
                    "page", page,
                    "limit", limit
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/actions/{action}")
    public ResponseEntity<?> getAuditsByAction(
            @PathVariable String action) {
        try {
            List<AuditLog> audits = auditService.getAuditsByAction(action);
            return ResponseEntity.ok(audits);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/projects/{projectId}/date-range")
    public ResponseEntity<?> getAuditsByDateRange(
            @PathVariable String projectId,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") Date endDate) {
        try {
            String userId = getCurrentUserId();

            if (!permissionService.canViewAudit(projectId, userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You don't have permission to view audit logs"));
            }

            List<AuditLog> audits = auditService.getAuditsByDateRange(projectId, startDate, endDate);
            return ResponseEntity.ok(audits);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/projects/{projectId}/export")
    public ResponseEntity<?> exportAudits(
            @PathVariable String projectId,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        try {
            String userId = getCurrentUserId();

            if (!permissionService.hasPermission(projectId, userId, "audit.export")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You don't have permission to export audit logs"));
            }

            if (startDate == null || endDate == null) {
                endDate = new Date();
                Date oneMonthAgo = new Date(endDate.getTime() - (30L * 24 * 60 * 60 * 1000));
                startDate = oneMonthAgo;
            }

            List<AuditLog> audits = auditService.exportAudits(projectId, startDate, endDate);
            return ResponseEntity.ok(Map.of(
                    "data", audits,
                    "count", audits.size(),
                    "startDate", startDate,
                    "endDate", endDate
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{auditLogId}")
    public ResponseEntity<?> deleteAuditEntry(
            @PathVariable String auditLogId,
            @RequestParam String reason) {
        try {
            String userId = getCurrentUserId();

            AuditLog deleted = auditService.deleteAuditEntry(auditLogId, userId, reason);

            return ResponseEntity.ok(Map.of(
                    "message", "Audit log entry marked as deleted",
                    "auditLogId", auditLogId,
                    "deletedAt", deleted.getDeletedAt()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/projects/{projectId}/stats")
    public ResponseEntity<?> getProjectAuditStats(@PathVariable String projectId) {
        try {
            String userId = getCurrentUserId();

            if (!permissionService.canViewAudit(projectId, userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You don't have permission to view audit logs"));
            }

            long count = auditService.countByProject(projectId);

            return ResponseEntity.ok(Map.of(
                    "projectId", projectId,
                    "totalAuditLogs", count
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}

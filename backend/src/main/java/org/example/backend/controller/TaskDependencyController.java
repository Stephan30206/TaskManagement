package org.example.backend.controller;

import org.example.backend.model.TaskDependency;
import org.example.backend.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/dependencies")
@CrossOrigin(origins = "http://localhost:3000")
public class TaskDependencyController {

    @Autowired
    private TaskDependencyService dependencyService;

    @Autowired
    private PermissionService permissionService;

    @Autowired
    private AuditService auditService;

    @Autowired
    private UserService userService;

    /**
     * Get current user ID from JWT
     */
    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userService.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }

    /**
     * Create a dependency between two tickets
     */
    @PostMapping
    public ResponseEntity<?> createDependency(@RequestBody Map<String, String> request) {
        try {
            String userId = getCurrentUserId();
            String dependentTicketId = request.get("dependentTicketId");
            String dependsOnTicketId = request.get("dependsOnTicketId");
            String projectId = request.get("projectId");
            String relationshipType = request.getOrDefault("relationshipType", "BLOCKING");

            if (dependentTicketId == null || dependsOnTicketId == null || projectId == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Required fields missing"));
            }

            // Check permission
            if (!permissionService.hasPermission(projectId, userId, "ticket.edit")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You don't have permission to create dependencies"));
            }

            // Check for circular dependency
            if (dependencyService.hasCircularDependency(dependentTicketId, dependsOnTicketId)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Circular dependency detected"));
            }

            TaskDependency dependency = dependencyService.createDependency(dependentTicketId, dependsOnTicketId, projectId, relationshipType, userId);

            // Log action
            auditService.log("DEPENDENCY_CREATED", "TASK_DEPENDENCY", dependency.getId(), projectId, userId,
                    "Created dependency: " + dependentTicketId + " depends on " + dependsOnTicketId,
                    Map.of("dependentTicketId", dependentTicketId, "dependsOnTicketId", dependsOnTicketId));

            return ResponseEntity.status(HttpStatus.CREATED).body(dependency);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get dependency by ID
     */
    @GetMapping("/{dependencyId}")
    public ResponseEntity<?> getDependency(@PathVariable String dependencyId) {
        try {
            return dependencyService.getDependencyById(dependencyId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get dependencies for a ticket (what blocks this ticket)
     */
    @GetMapping("/tickets/{ticketId}/depends-on")
    public ResponseEntity<?> getTicketDependencies(@PathVariable String ticketId) {
        try {
            List<TaskDependency> dependencies = dependencyService.getDependsOn(ticketId);
            return ResponseEntity.ok(Map.of(
                    "data", dependencies,
                    "count", dependencies.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get tickets blocked by this ticket
     */
    @GetMapping("/tickets/{ticketId}/blocked-by")
    public ResponseEntity<?> getBlockedTickets(@PathVariable String ticketId) {
        try {
            List<TaskDependency> blockedTickets = dependencyService.getBlockedBy(ticketId);
            return ResponseEntity.ok(Map.of(
                    "data", blockedTickets,
                    "count", blockedTickets.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all dependencies for a project
     */
    @GetMapping("/projects/{projectId}")
    public ResponseEntity<?> getProjectDependencies(@PathVariable String projectId) {
        try {
            List<TaskDependency> dependencies = dependencyService.getProjectDependencies(projectId);
            return ResponseEntity.ok(Map.of(
                    "data", dependencies,
                    "count", dependencies.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update dependency
     */
    @PutMapping("/{dependencyId}")
    public ResponseEntity<?> updateDependency(
            @PathVariable String dependencyId,
            @RequestBody Map<String, String> request) {
        try {
            String relationshipType = request.get("relationshipType");
            String description = request.get("description");

            TaskDependency updated = dependencyService.updateDependency(dependencyId, relationshipType, description);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete dependency
     */
    @DeleteMapping("/{dependencyId}")
    public ResponseEntity<?> deleteDependency(@PathVariable String dependencyId) {
        try {
            String userId = getCurrentUserId();

            var dependency = dependencyService.getDependencyById(dependencyId)
                    .orElse(null);

            if (dependency == null) {
                return ResponseEntity.notFound().build();
            }

            dependencyService.deleteDependency(dependencyId);

            // Log action
            auditService.log("DELETE", "TASK_DEPENDENCY", dependencyId, dependency.getProjectId(), userId,
                    "Deleted dependency", null);

            return ResponseEntity.ok(Map.of("message", "Dependency deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Check if ticket can be completed (no blocking dependencies)
     */
    @GetMapping("/tickets/{ticketId}/can-complete")
    public ResponseEntity<?> canBeCompleted(@PathVariable String ticketId) {
        try {
            boolean canComplete = dependencyService.canBeCompleted(ticketId);
            String blockingReason = dependencyService.getBlockingReason(ticketId);

            return ResponseEntity.ok(Map.of(
                    "ticketId", ticketId,
                    "canComplete", canComplete,
                    "blockingReason", blockingReason
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Check for circular dependency
     */
    @PostMapping("/check-circular")
    public ResponseEntity<?> checkCircularDependency(@RequestBody Map<String, String> request) {
        try {
            String ticketId1 = request.get("ticketId1");
            String ticketId2 = request.get("ticketId2");

            if (ticketId1 == null || ticketId2 == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Both ticket IDs required"));
            }

            boolean hasCircular = dependencyService.hasCircularDependency(ticketId1, ticketId2);

            return ResponseEntity.ok(Map.of(
                    "hasCircularDependency", hasCircular,
                    "ticketId1", ticketId1,
                    "ticketId2", ticketId2
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get dependency statistics for a ticket
     */
    @GetMapping("/tickets/{ticketId}/stats")
    public ResponseEntity<?> getTicketDependencyStats(@PathVariable String ticketId) {
        try {
            long dependencies = dependencyService.countDependencies(ticketId);
            long dependents = dependencyService.countDependents(ticketId);

            return ResponseEntity.ok(Map.of(
                    "ticketId", ticketId,
                    "dependenciesCount", dependencies,
                    "dependentsCount", dependents
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}

package org.example.backend.controller;

import jakarta.validation.Valid;
import org.example.backend.model.TicketLabel;
import org.example.backend.service.AuditService;
import org.example.backend.service.PermissionService;
import org.example.backend.service.TicketLabelService;
import org.example.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/labels")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class LabelController {

    @Autowired
    private TicketLabelService labelService;

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
     * Create a new label for a project
     */
    @PostMapping("/projects/{projectId}")
    public ResponseEntity<?> createLabel(
            @PathVariable String projectId,
            @Valid @RequestBody Map<String, String> request) {
        try {
            String userId = getCurrentUserId();

            // Check permission
            if (!permissionService.hasPermission(projectId, userId, "label.create")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You don't have permission to create labels"));
            }

            String name = request.get("name");
            String color = request.get("color");
            String description = request.getOrDefault("description", "");

            if (name == null || name.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Label name is required"));
            }

            // Check for duplicate name in project
            if (labelService.getLabelByName(projectId, name).isPresent()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Label with this name already exists in the project"));
            }

            TicketLabel label = labelService.createLabel(projectId, name, color, userId);

            // Log action
            auditService.log("CREATE", "LABEL", label.getId(), projectId, userId,
                    "Created label: " + name, Map.of("name", name, "color", color));

            return ResponseEntity.status(HttpStatus.CREATED).body(label);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all labels for a project
     */
    @GetMapping("/projects/{projectId}")
    public ResponseEntity<?> getProjectLabels(@PathVariable String projectId) {
        try {
            String userId = getCurrentUserId();

            // Check permission
            if (!permissionService.hasPermission(projectId, userId, "project.view")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            List<TicketLabel> labels = labelService.getProjectLabels(projectId);
            return ResponseEntity.ok(labels);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get label by ID
     */
    @GetMapping("/{labelId}")
    public ResponseEntity<?> getLabel(@PathVariable String labelId) {
        try {
            return labelService.getLabelById(labelId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update a label
     */
    @PutMapping("/{labelId}")
    public ResponseEntity<?> updateLabel(
            @PathVariable String labelId,
            @Valid @RequestBody Map<String, String> request) {
        try {
            String userId = getCurrentUserId();

            // Get label to find project
            var label = labelService.getLabelById(labelId)
                    .orElse(null);
            if (label == null) {
                return ResponseEntity.notFound().build();
            }

            // Check permission
            if (!permissionService.hasPermission(label.getProjectId(), userId, "label.edit")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You don't have permission to edit labels"));
            }

            String name = request.get("name");
            String color = request.get("color");
            String description = request.get("description");

            TicketLabel updated = labelService.updateLabel(labelId, name, color, description);

            // Log action
            auditService.log("UPDATE", "LABEL", labelId, label.getProjectId(), userId,
                    "Updated label", Map.of("name", name, "color", color));

            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete a label
     */
    @DeleteMapping("/{labelId}")
    public ResponseEntity<?> deleteLabel(@PathVariable String labelId) {
        try {
            String userId = getCurrentUserId();

            // Get label to find project
            var label = labelService.getLabelById(labelId)
                    .orElse(null);
            if (label == null) {
                return ResponseEntity.notFound().build();
            }

            // Check permission
            if (!permissionService.hasPermission(label.getProjectId(), userId, "label.delete")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You don't have permission to delete labels"));
            }

            labelService.deleteLabel(labelId);

            // Log action
            auditService.log("DELETE", "LABEL", labelId, label.getProjectId(), userId,
                    "Deleted label: " + label.getName(), null);

            return ResponseEntity.ok(Map.of("message", "Label deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Search labels in a project
     */
    @GetMapping("/projects/{projectId}/search")
    public ResponseEntity<?> searchLabels(
            @PathVariable String projectId,
            @RequestParam String query) {
        try {
            String userId = getCurrentUserId();

            // Check permission
            if (!permissionService.hasPermission(projectId, userId, "project.view")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            List<TicketLabel> labels = labelService.searchLabels(projectId, query);
            return ResponseEntity.ok(labels);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}

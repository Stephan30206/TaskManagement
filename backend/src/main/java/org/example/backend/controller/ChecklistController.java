package org.example.backend.controller;

import jakarta.validation.Valid;
import org.example.backend.model.Checklist;
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
@RequestMapping("/checklists")
@CrossOrigin(origins = "http://localhost:3000")
public class ChecklistController {

    @Autowired
    private ChecklistService checklistService;

    @Autowired
    private PermissionService permissionService;

    @Autowired
    private AuditService auditService;

    @Autowired
    private TicketActivityService ticketActivityService;

    @Autowired
    private UserService userService;

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userService.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }

    @PostMapping("/tickets/{ticketId}")
    public ResponseEntity<?> createChecklist(
            @PathVariable String ticketId,
            @Valid @RequestBody Map<String, String> request) {
        try {
            String userId = getCurrentUserId();
            String title = request.get("title");
            String description = request.getOrDefault("description", "");

            if (title == null || title.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Checklist title is required"));
            }

            Checklist checklist = checklistService.createChecklist(ticketId, title, description, userId);

            ticketActivityService.logChecklistCreated(ticketId, null, checklist.getId(), title, userId, null, null);

            return ResponseEntity.status(HttpStatus.CREATED).body(checklist);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/tickets/{ticketId}")
    public ResponseEntity<?> getTicketChecklists(@PathVariable String ticketId) {
        try {
            List<Checklist> checklists = checklistService.getTicketChecklists(ticketId);
            return ResponseEntity.ok(checklists);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{checklistId}")
    public ResponseEntity<?> getChecklist(@PathVariable String checklistId) {
        try {
            return checklistService.getChecklistById(checklistId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{checklistId}")
    public ResponseEntity<?> updateChecklist(
            @PathVariable String checklistId,
            @Valid @RequestBody Map<String, String> request) {
        try {
            String title = request.get("title");
            String description = request.get("description");

            Checklist updated = checklistService.updateChecklist(checklistId, title, description);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{checklistId}")
    public ResponseEntity<?> deleteChecklist(@PathVariable String checklistId) {
        try {
            checklistService.deleteChecklist(checklistId);
            return ResponseEntity.ok(Map.of("message", "Checklist deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{checklistId}/items")
    public ResponseEntity<?> addItem(
            @PathVariable String checklistId,
            @Valid @RequestBody Map<String, String> request) {
        try {
            String userId = getCurrentUserId();
            String itemTitle = request.get("title");
            String description = request.getOrDefault("description", "");

            if (itemTitle == null || itemTitle.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Item title is required"));
            }

            Checklist updated = checklistService.addItem(checklistId, itemTitle, description);
            return ResponseEntity.status(HttpStatus.CREATED).body(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{checklistId}/items/{itemId}/complete")
    public ResponseEntity<?> completeItem(
            @PathVariable String checklistId,
            @PathVariable String itemId) {
        try {
            String userId = getCurrentUserId();

            Checklist updated = checklistService.completeItem(checklistId, itemId, userId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{checklistId}/items/{itemId}/uncomplete")
    public ResponseEntity<?> uncompleteItem(
            @PathVariable String checklistId,
            @PathVariable String itemId) {
        try {
            Checklist updated = checklistService.uncompleteItem(checklistId, itemId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{checklistId}/items/{itemId}")
    public ResponseEntity<?> updateItem(
            @PathVariable String checklistId,
            @PathVariable String itemId,
            @Valid @RequestBody Map<String, String> request) {
        try {
            String title = request.get("title");
            String description = request.get("description");

            Checklist updated = checklistService.updateItem(checklistId, itemId, title, description);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{checklistId}/items/{itemId}")
    public ResponseEntity<?> deleteItem(
            @PathVariable String checklistId,
            @PathVariable String itemId) {
        try {
            Checklist updated = checklistService.deleteItem(checklistId, itemId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{checklistId}/progress")
    public ResponseEntity<?> getProgress(@PathVariable String checklistId) {
        try {
            double progress = checklistService.getProgress(checklistId);
            return ResponseEntity.ok(Map.of("progress", progress));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{checklistId}/items/{itemId}/assign/{userId}")
    public ResponseEntity<?> assignItem(
            @PathVariable String checklistId,
            @PathVariable String itemId,
            @PathVariable String userId) {
        try {
            Checklist updated = checklistService.assignItem(checklistId, itemId, userId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}

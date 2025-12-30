package org.example.backend.controller;

import org.example.backend.model.Attachment;
import org.example.backend.service.AttachmentService;
import org.example.backend.service.AuditService;
import org.example.backend.service.PermissionService;
import org.example.backend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/attachments")
@CrossOrigin(origins = "http://localhost:3000")
public class AttachmentController {

    private final AttachmentService attachmentService;
    private final PermissionService permissionService;
    private final AuditService auditService;
    private final UserService userService;

    public AttachmentController(AttachmentService attachmentService,
                                PermissionService permissionService,
                                AuditService auditService,
                                UserService userService) {
        this.attachmentService = attachmentService;
        this.permissionService = permissionService;
        this.auditService = auditService;
        this.userService = userService;
    }

    // --- Helper pour récupérer l'utilisateur courant ---
    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userService.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }

    // --- Upload ---
    @PostMapping("/upload")
    public ResponseEntity<?> uploadAttachment(
            @RequestParam MultipartFile file,
            @RequestParam String ticketId,
            @RequestParam(required = false) String commentId,
            @RequestParam(required = false) String description) {

        try {
            String userId = getCurrentUserId();

            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }

            String fileName = file.getOriginalFilename();
            long fileSize = file.getSize();
            String mimeType = file.getContentType();

            // Simulate upload, in production upload to S3/GCS
            String fileUrl = "/uploads/" + UUID.randomUUID() + "/" + fileName;

            Attachment attachment = (commentId != null && !commentId.isBlank())
                    ? attachmentService.createAttachment(fileName, fileSize, mimeType, fileUrl, ticketId, commentId, userId)
                    : attachmentService.createAttachment(fileName, fileSize, mimeType, fileUrl, ticketId, userId);

            if (description != null) {
                attachment.setDescription(description);
            }

            auditService.log("ATTACHMENT_UPLOADED", "ATTACHMENT", attachment.getId(), null, userId,
                    "Uploaded attachment: " + fileName,
                    Map.of("ticketId", ticketId, "fileName", fileName));

            return ResponseEntity.status(HttpStatus.CREATED).body(attachment);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // --- Get by ID ---
    @GetMapping("/{attachmentId}")
    public ResponseEntity<?> getAttachment(@PathVariable String attachmentId) {
        try {
            Attachment attachment = attachmentService.getAttachmentById(attachmentId);
            if (attachment.isDeleted()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Attachment deleted"));
            }
            return ResponseEntity.ok(attachment);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // --- Get all for ticket ---
    @GetMapping("/tickets/{ticketId}")
    public ResponseEntity<?> getTicketAttachments(@PathVariable String ticketId) {
        try {
            List<Attachment> attachments = attachmentService.getTicketAttachments(ticketId);
            return ResponseEntity.ok(attachments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // --- Get all for comment ---
    @GetMapping("/comments/{commentId}")
    public ResponseEntity<?> getCommentAttachments(@PathVariable String commentId) {
        try {
            List<Attachment> attachments = attachmentService.getCommentAttachments(commentId);
            return ResponseEntity.ok(attachments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // --- Update metadata ---
    @PutMapping("/{attachmentId}")
    public ResponseEntity<?> updateAttachment(
            @PathVariable String attachmentId,
            @RequestBody Map<String, String> request) {
        try {
            String description = request.get("description");
            String thumbnailUrl = request.get("thumbnailUrl");

            Attachment updated = attachmentService.updateAttachment(attachmentId, description, thumbnailUrl);
            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // --- Soft delete ---
    @DeleteMapping("/{attachmentId}")
    public ResponseEntity<?> deleteAttachment(@PathVariable String attachmentId) {
        try {
            String userId = getCurrentUserId();
            Attachment deleted = attachmentService.softDeleteAttachment(attachmentId, userId);

            auditService.log("DELETE", "ATTACHMENT", attachmentId, null, userId,
                    "Deleted attachment: " + deleted.getFileName(), null);

            return ResponseEntity.ok(Map.of("message", "Attachment deleted successfully"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // --- Restore deleted attachment ---
    @PutMapping("/{attachmentId}/restore")
    public ResponseEntity<?> restoreAttachment(@PathVariable String attachmentId) {
        try {
            Attachment restored = attachmentService.restoreAttachment(attachmentId);
            return ResponseEntity.ok(restored);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // --- Set image dimensions ---
    @PutMapping("/{attachmentId}/dimensions")
    public ResponseEntity<?> setImageDimensions(
            @PathVariable String attachmentId,
            @RequestBody Map<String, Integer> request) {
        try {
            Integer width = request.get("width");
            Integer height = request.get("height");

            Attachment updated = attachmentService.setImageDimensions(attachmentId, width, height);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // --- Download ---
    @GetMapping("/{attachmentId}/download")
    public ResponseEntity<?> downloadAttachment(@PathVariable String attachmentId) {
        try {
            Attachment attachment = attachmentService.getAttachmentById(attachmentId);
            if (attachment.isDeleted()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Attachment deleted"));
            }

            Map<String, String> response = new HashMap<>();
            response.put("fileUrl", attachment.getFileUrl());
            response.put("fileName", attachment.getFileName());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // --- Ticket attachment stats ---
    @GetMapping("/tickets/{ticketId}/stats")
    public ResponseEntity<?> getTicketAttachmentStats(@PathVariable String ticketId) {
        try {
            long count = attachmentService.countTicketAttachments(ticketId);
            long totalSize = attachmentService.getTicketAttachmentsSize(ticketId);

            Map<String, Object> stats = new HashMap<>();
            stats.put("count", count);
            stats.put("totalSize", totalSize);
            stats.put("totalSizeMB", totalSize / (1024 * 1024));

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}

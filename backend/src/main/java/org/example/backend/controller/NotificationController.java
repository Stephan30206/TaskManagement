package org.example.backend.controller;

import org.example.backend.model.Notification;
import org.example.backend.service.NotificationService;
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
@RequestMapping("/notifications")
@CrossOrigin(origins = "http://localhost:3000")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

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
     * Get all notifications for current user
     */
    @GetMapping
    public ResponseEntity<?> getUserNotifications(
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int limit) {
        try {
            String userId = getCurrentUserId();

            List<Notification> notifications = notificationService.getUserNotifications(userId);

            // Pagination
            int start = page * limit;
            int end = Math.min(start + limit, notifications.size());
            List<Notification> paginated = notifications.subList(start, end);

            return ResponseEntity.ok(Map.of(
                    "data", paginated,
                    "total", notifications.size(),
                    "unreadCount", notificationService.countUnreadNotifications(userId),
                    "page", page,
                    "limit", limit
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get unread notifications
     */
    @GetMapping("/unread")
    public ResponseEntity<?> getUnreadNotifications() {
        try {
            String userId = getCurrentUserId();

            List<Notification> unreadNotifications = notificationService.getUnreadNotifications(userId);
            return ResponseEntity.ok(Map.of(
                    "data", unreadNotifications,
                    "count", unreadNotifications.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get active (not dismissed) notifications
     */
    @GetMapping("/active")
    public ResponseEntity<?> getActiveNotifications() {
        try {
            String userId = getCurrentUserId();

            List<Notification> activeNotifications = notificationService.getActiveNotifications(userId);
            return ResponseEntity.ok(Map.of(
                    "data", activeNotifications,
                    "count", activeNotifications.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get notification by ID
     */
    @GetMapping("/{notificationId}")
    public ResponseEntity<?> getNotification(@PathVariable String notificationId) {
        try {
            return notificationService.getNotificationById(notificationId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Mark notification as read
     */
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String notificationId) {
        try {
            Notification updated = notificationService.markAsRead(notificationId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Mark all notifications as read for current user
     */
    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        try {
            String userId = getCurrentUserId();

            notificationService.markAllAsRead(userId);
            return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Dismiss a notification
     */
    @PutMapping("/{notificationId}/dismiss")
    public ResponseEntity<?> dismissNotification(@PathVariable String notificationId) {
        try {
            Notification updated = notificationService.dismissNotification(notificationId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete a notification
     */
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<?> deleteNotification(@PathVariable String notificationId) {
        try {
            notificationService.deleteNotification(notificationId);
            return ResponseEntity.ok(Map.of("message", "Notification deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get count of unread notifications
     */
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount() {
        try {
            String userId = getCurrentUserId();

            long unreadCount = notificationService.countUnreadNotifications(userId);
            return ResponseEntity.ok(Map.of("unreadCount", unreadCount));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get notifications for a project
     */
    @GetMapping("/projects/{projectId}")
    public ResponseEntity<?> getProjectNotifications(
            @PathVariable String projectId,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int limit) {
        try {
            String userId = getCurrentUserId();

            List<Notification> notifications = notificationService.getProjectNotifications(userId, projectId);

            // Pagination
            int start = page * limit;
            int end = Math.min(start + limit, notifications.size());
            List<Notification> paginated = notifications.subList(start, end);

            return ResponseEntity.ok(Map.of(
                    "data", paginated,
                    "total", notifications.size(),
                    "page", page,
                    "limit", limit
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get notifications related to an entity
     */
    @GetMapping("/entities/{entityId}")
    public ResponseEntity<?> getEntityNotifications(
            @PathVariable String entityId,
            @RequestParam String entityType) {
        try {
            List<Notification> notifications = notificationService.getEntityNotifications(entityId, entityType);
            return ResponseEntity.ok(Map.of(
                    "data", notifications,
                    "count", notifications.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}

package org.example.backend.service;

import org.example.backend.model.Notification;
import org.example.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    /**
     * Create and send a notification to a user
     */
    public Notification createNotification(String recipientId, String senderId, String senderName, String senderEmail,
                                          String type, String title, String message, String entityType, String entityId, String projectId) {
        Notification notification = new Notification(recipientId, senderId, senderName, senderEmail, type, title, message, entityType, entityId, projectId);
        return notificationRepository.save(notification);
    }

    /**
     * Create notification with action URL
     */
    public Notification createNotification(String recipientId, String senderId, String senderName, String senderEmail,
                                          String type, String title, String message, String entityType, String entityId, String projectId, String actionUrl) {
        Notification notification = createNotification(recipientId, senderId, senderName, senderEmail, type, title, message, entityType, entityId, projectId);
        notification.setActionUrl(actionUrl);
        return notificationRepository.save(notification);
    }

    /**
     * Get notification by ID
     */
    public Optional<Notification> getNotificationById(String notificationId) {
        return notificationRepository.findById(notificationId);
    }

    /**
     * Get all notifications for a user (most recent first)
     */
    public List<Notification> getUserNotifications(String userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Get unread notifications for a user
     */
    public List<Notification> getUnreadNotifications(String userId) {
        return notificationRepository.findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    /**
     * Get active (not dismissed) notifications for a user
     */
    public List<Notification> getActiveNotifications(String userId) {
        return notificationRepository.findByRecipientIdAndDismissedFalse(userId);
    }

    /**
     * Get notifications for a project
     */
    public List<Notification> getProjectNotifications(String userId, String projectId) {
        return notificationRepository.findByRecipientIdAndProjectId(userId, projectId);
    }

    /**
     * Get notifications related to an entity
     */
    public List<Notification> getEntityNotifications(String entityId, String entityType) {
        return notificationRepository.findByEntityIdAndEntityType(entityId, entityType);
    }

    /**
     * Mark notification as read
     */
    public Notification markAsRead(String notificationId) {
        Optional<Notification> notification = notificationRepository.findById(notificationId);

        if (notification.isEmpty()) {
            throw new RuntimeException("Notification not found");
        }

        Notification existing = notification.get();
        existing.setRead(true);
        existing.setReadAt(new Date());

        return notificationRepository.save(existing);
    }

    /**
     * Mark all notifications as read for a user
     */
    public void markAllAsRead(String userId) {
        List<Notification> unread = getUnreadNotifications(userId);
        unread.forEach(n -> {
            n.setRead(true);
            n.setReadAt(new Date());
            notificationRepository.save(n);
        });
    }

    /**
     * Mark notification as dismissed
     */
    public Notification dismissNotification(String notificationId) {
        Optional<Notification> notification = notificationRepository.findById(notificationId);

        if (notification.isEmpty()) {
            throw new RuntimeException("Notification not found");
        }

        Notification existing = notification.get();
        existing.setDismissed(true);
        existing.setDismissedAt(new Date());

        return notificationRepository.save(existing);
    }

    /**
     * Count unread notifications for a user
     */
    public long countUnreadNotifications(String userId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    /**
     * Delete old notifications (older than a certain date)
     */
    public void deleteOldNotifications(String userId, Date before) {
        notificationRepository.deleteByRecipientIdAndCreatedAtBefore(userId, before);
    }

    /**
     * Delete a notification
     */
    public void deleteNotification(String notificationId) {
        notificationRepository.deleteById(notificationId);
    }

    // Convenience methods for common notification types

    public Notification notifyTicketAssigned(String ticketId, String ticketTitle, String recipientId, String assignedBy,
                                            String assignedByName, String assignedByEmail, String projectId) {
        return createNotification(recipientId, assignedBy, assignedByName, assignedByEmail,
                "TICKET_ASSIGNED", "Ticket Assigned",
                "You have been assigned to ticket: " + ticketTitle,
                "TICKET", ticketId, projectId,
                "/projects/" + projectId + "/tickets/" + ticketId);
    }

    public Notification notifyTicketCommented(String ticketId, String ticketTitle, String recipientId, String commenter,
                                             String commenterName, String commenterEmail, String projectId) {
        return createNotification(recipientId, commenter, commenterName, commenterEmail,
                "TICKET_COMMENTED", "New Comment",
                "A comment was added to ticket: " + ticketTitle,
                "TICKET", ticketId, projectId,
                "/projects/" + projectId + "/tickets/" + ticketId);
    }

    public Notification notifyTicketStatusChanged(String ticketId, String ticketTitle, String recipientId, String changedBy,
                                                 String changedByName, String changedByEmail, String newStatus, String projectId) {
        return createNotification(recipientId, changedBy, changedByName, changedByEmail,
                "STATUS_CHANGED", "Ticket Status Changed",
                "Ticket '" + ticketTitle + "' status changed to " + newStatus,
                "TICKET", ticketId, projectId,
                "/projects/" + projectId + "/tickets/" + ticketId);
    }

    public Notification notifyMemberAdded(String projectId, String projectName, String recipientId, String addedBy,
                                         String addedByName, String addedByEmail, String role) {
        return createNotification(recipientId, addedBy, addedByName, addedByEmail,
                "MEMBER_ADDED", "Added to Project",
                "You have been added to project '" + projectName + "' with role: " + role,
                "PROJECT", projectId, projectId,
                "/projects/" + projectId);
    }

    public Notification notifyChecklistCompleted(String ticketId, String ticketTitle, String recipientId, String completedBy,
                                                 String completedByName, String completedByEmail, String projectId) {
        return createNotification(recipientId, completedBy, completedByName, completedByEmail,
                "CHECKLIST_COMPLETED", "Checklist Item Completed",
                "Checklist item completed in ticket: " + ticketTitle,
                "TICKET", ticketId, projectId,
                "/projects/" + projectId + "/tickets/" + ticketId);
    }

    public Notification notifyMentionInComment(String ticketId, String ticketTitle, String recipientId, String mentionedBy,
                                              String mentionedByName, String mentionedByEmail, String projectId) {
        return createNotification(recipientId, mentionedBy, mentionedByName, mentionedByEmail,
                "MENTION_IN_COMMENT", "You were mentioned",
                "You were mentioned in a comment on ticket: " + ticketTitle,
                "TICKET", ticketId, projectId,
                "/projects/" + projectId + "/tickets/" + ticketId);
    }
}

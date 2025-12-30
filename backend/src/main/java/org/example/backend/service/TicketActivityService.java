package org.example.backend.service;

import org.example.backend.model.TicketActivity;
import org.example.backend.repository.TicketActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
public class TicketActivityService {

    @Autowired
    private TicketActivityRepository ticketActivityRepository;

    /**
     * Log an activity for a ticket
     */
    public TicketActivity logActivity(String ticketId, String projectId, String action, String actionBy,
                                     String actionByName, String actionByEmail, String description) {
        return logActivity(ticketId, projectId, action, actionBy, actionByName, actionByEmail, description, null, null, null);
    }

    /**
     * Log an activity with changes
     */
    public TicketActivity logActivity(String ticketId, String projectId, String action, String actionBy,
                                     String actionByName, String actionByEmail, String description,
                                     Map<String, Object> changes, String relatedEntityId, String relatedEntityType) {
        TicketActivity activity = new TicketActivity(ticketId, projectId, action, actionBy, actionByName, actionByEmail, description);
        if (changes != null) {
            activity.setChanges(changes);
        }
        activity.setRelatedEntityId(relatedEntityId);
        activity.setRelatedEntityType(relatedEntityType);

        return ticketActivityRepository.save(activity);
    }

    /**
     * Get all activities for a ticket
     */
    public List<TicketActivity> getTicketActivities(String ticketId) {
        return ticketActivityRepository.findByTicketIdOrderByCreatedAtDesc(ticketId);
    }

    /**
     * Get activities for a project
     */
    public List<TicketActivity> getProjectActivities(String projectId) {
        return ticketActivityRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
    }

    /**
     * Get activities by a specific user
     */
    public List<TicketActivity> getUserActivities(String userId) {
        return ticketActivityRepository.findByActionBy(userId);
    }

    /**
     * Get activities of a specific type
     */
    public List<TicketActivity> getActivitiesByAction(String action) {
        return ticketActivityRepository.findByAction(action);
    }

    /**
     * Get activities within a date range for a ticket
     */
    public List<TicketActivity> getActivitiesByDateRange(String ticketId, Date startDate, Date endDate) {
        return ticketActivityRepository.findByTicketIdAndDateRange(ticketId, startDate, endDate);
    }

    /**
     * Get recent activities for a project
     */
    public List<TicketActivity> getRecentActivities(String projectId, Date since) {
        return ticketActivityRepository.findRecentActivities(projectId, since);
    }

    /**
     * Delete all activities for a ticket (when ticket is deleted)
     */
    public void deleteTicketActivities(String ticketId) {
        ticketActivityRepository.deleteByTicketId(ticketId);
    }

    /**
     * Convenience method: Log ticket creation
     */
    public TicketActivity logTicketCreated(String ticketId, String projectId, String userId, String userName, String userEmail, String title) {
        return logActivity(ticketId, projectId, "CREATED", userId, userName, userEmail, "Created ticket: " + title);
    }

    /**
     * Convenience method: Log ticket edit
     */
    public TicketActivity logTicketEdited(String ticketId, String projectId, String userId, String userName, String userEmail, Map<String, Object> changes) {
        return logActivity(ticketId, projectId, "EDITED", userId, userName, userEmail, "Edited ticket details", changes, null, null);
    }

    /**
     * Convenience method: Log status change
     */
    public TicketActivity logStatusChanged(String ticketId, String projectId, String userId, String userName, String userEmail, String oldStatus, String newStatus) {
        Map<String, Object> changes = Map.of(
                "status", Map.of("oldValue", oldStatus, "newValue", newStatus)
        );
        return logActivity(ticketId, projectId, "STATUS_CHANGED", userId, userName, userEmail,
                "Changed status from " + oldStatus + " to " + newStatus, changes, null, null);
    }

    /**
     * Convenience method: Log assignment
     */
    public TicketActivity logAssigned(String ticketId, String projectId, String userId, String userName, String userEmail, String assignedUserId, String assignedUserName) {
        Map<String, Object> changes = Map.of(
                "assignee", assignedUserName
        );
        return logActivity(ticketId, projectId, "ASSIGNED", userId, userName, userEmail,
                "Assigned to " + assignedUserName, changes, assignedUserId, "USER");
    }

    /**
     * Convenience method: Log comment added
     */
    public TicketActivity logCommentAdded(String ticketId, String projectId, String commentId, String userId, String userName, String userEmail) {
        return logActivity(ticketId, projectId, "COMMENTED", userId, userName, userEmail,
                "Added a comment", null, commentId, "COMMENT");
    }

    /**
     * Convenience method: Log label added
     */
    public TicketActivity logLabelAdded(String ticketId, String projectId, String labelId, String labelName, String userId, String userName, String userEmail) {
        Map<String, Object> changes = Map.of("label", labelName);
        return logActivity(ticketId, projectId, "LABEL_ADDED", userId, userName, userEmail,
                "Added label: " + labelName, changes, labelId, "LABEL");
    }

    /**
     * Convenience method: Log label removed
     */
    public TicketActivity logLabelRemoved(String ticketId, String projectId, String labelId, String labelName, String userId, String userName, String userEmail) {
        Map<String, Object> changes = Map.of("label", labelName);
        return logActivity(ticketId, projectId, "LABEL_REMOVED", userId, userName, userEmail,
                "Removed label: " + labelName, changes, labelId, "LABEL");
    }

    /**
     * Convenience method: Log checklist created
     */
    public TicketActivity logChecklistCreated(String ticketId, String projectId, String checklistId, String checklistTitle, String userId, String userName, String userEmail) {
        Map<String, Object> changes = Map.of("checklist", checklistTitle);
        return logActivity(ticketId, projectId, "CHECKLIST_CREATED", userId, userName, userEmail,
                "Created checklist: " + checklistTitle, changes, checklistId, "CHECKLIST");
    }

    /**
     * Convenience method: Log checklist item completed
     */
    public TicketActivity logChecklistItemCompleted(String ticketId, String projectId, String checklistId, String itemTitle, String userId, String userName, String userEmail) {
        Map<String, Object> changes = Map.of("item", itemTitle, "completed", true);
        return logActivity(ticketId, projectId, "CHECKLIST_ITEM_COMPLETED", userId, userName, userEmail,
                "Completed checklist item: " + itemTitle, changes, checklistId, "CHECKLIST_ITEM");
    }

    /**
     * Convenience method: Log attachment added
     */
    public TicketActivity logAttachmentAdded(String ticketId, String projectId, String attachmentId, String fileName, String userId, String userName, String userEmail) {
        Map<String, Object> changes = Map.of("attachment", fileName);
        return logActivity(ticketId, projectId, "ATTACHMENT_ADDED", userId, userName, userEmail,
                "Uploaded attachment: " + fileName, changes, attachmentId, "ATTACHMENT");
    }
}

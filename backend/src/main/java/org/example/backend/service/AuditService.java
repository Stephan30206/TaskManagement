package org.example.backend.service;

import org.example.backend.model.AuditLog;
import org.example.backend.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserService userService;

    /**
     * Get client IP address from request context
     */
    private String getClientIp() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                String ip = attrs.getRequest().getHeader("X-Forwarded-For");
                if (ip == null || ip.isEmpty()) {
                    ip = attrs.getRequest().getRemoteAddr();
                }
                return ip;
            }
        } catch (Exception e) {
            // Ignore - running outside HTTP context
        }
        return "SYSTEM";
    }

    /**
     * Log a user action - PRIMARY method for audit logging
     */
    public AuditLog log(String action, String entityType, String entityId, String projectId,
                       String userId, String description, Map<String, Object> changes) {
        return log(action, entityType, entityId, projectId, userId, description, changes, null);
    }

    /**
     * Log a user action with details
     */
    public AuditLog log(String action, String entityType, String entityId, String projectId,
                       String userId, String description, Map<String, Object> changes, Map<String, Object> details) {
        AuditLog auditLog = new AuditLog();
        auditLog.setAction(action);
        auditLog.setEntityType(entityType);
        auditLog.setEntityId(entityId);
        auditLog.setProjectId(projectId);
        auditLog.setUserId(userId);
        auditLog.setDescription(description);
        auditLog.setChanges(changes);
        auditLog.setDetails(details);
        auditLog.setIpAddress(getClientIp());
        auditLog.setCreatedAt(new Date());
        auditLog.setDeletedByAdmin(false);

        // Cache user info for readability
        try {
            var user = userService.getUserById(userId);
            if (user.isPresent()) {
                auditLog.setUserName(user.get().getFirstName() + " " + user.get().getLastName());
                auditLog.setUserEmail(user.get().getEmail());
            }
        } catch (Exception e) {
            // Ignore if user not found
        }

        return auditLogRepository.save(auditLog);
    }

    /**
     * Retrieve audit logs for a project
     */
    public List<AuditLog> getAuditsByProject(String projectId) {
        return auditLogRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
    }

    /**
     * Retrieve audit logs for a specific entity
     */
    public List<AuditLog> getAuditsByEntity(String entityId) {
        return auditLogRepository.findByEntityIdOrderByCreatedAtDesc(entityId);
    }

    /**
     * Retrieve audit logs for a user
     */
    public List<AuditLog> getAuditsByUser(String userId) {
        return auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Retrieve audit logs by action
     */
    public List<AuditLog> getAuditsByAction(String action) {
        return auditLogRepository.findByAction(action);
    }

    /**
     * Retrieve audit logs by date range
     */
    public List<AuditLog> getAuditsByDateRange(String projectId, Date startDate, Date endDate) {
        return auditLogRepository.findByProjectIdAndDateRange(projectId, startDate, endDate);
    }

    /**
     * Delete (mark as deleted by admin) an audit log entry
     * Only ADMINs can do this, and it's a logical delete (marked, not physical)
     */
    public AuditLog deleteAuditEntry(String auditLogId, String adminId, String reason) {
        Optional<AuditLog> log = auditLogRepository.findById(auditLogId);

        if (log.isEmpty()) {
            throw new RuntimeException("Audit log entry not found");
        }

        AuditLog auditLog = log.get();
        auditLog.setDeletedByAdmin(true);
        auditLog.setDeletedById(adminId);
        auditLog.setDeleteReason(reason);
        auditLog.setDeletedAt(new Date());

        return auditLogRepository.save(auditLog);
    }

    /**
     * Get count of audits for a project
     */
    public long countByProject(String projectId) {
        return auditLogRepository.countByProjectId(projectId);
    }

    /**
     * Get count of audits for a user
     */
    public long countByUser(String userId) {
        return auditLogRepository.countByUserId(userId);
    }

    /**
     * Export audit logs (for compliance and reporting)
     */
    public List<AuditLog> exportAudits(String projectId, Date startDate, Date endDate) {
        return auditLogRepository.findByProjectIdAndDateRange(projectId, startDate, endDate);
    }

    /**
     * Get all active audit logs (not deleted by admin)
     */
    public List<AuditLog> getAllActiveAudits() {
        return auditLogRepository.findAllActive();
    }

    // Convenience methods for common audit log scenarios

    public AuditLog logTicketCreated(String ticketId, String projectId, String userId, String title) {
        return log("CREATE", "TICKET", ticketId, projectId, userId,
                "Created ticket: " + title, null);
    }

    public AuditLog logTicketUpdated(String ticketId, String projectId, String userId, String title, Map<String, Object> changes) {
        return log("UPDATE", "TICKET", ticketId, projectId, userId,
                "Updated ticket: " + title, changes);
    }

    public AuditLog logTicketStatusChanged(String ticketId, String projectId, String userId, String oldStatus, String newStatus) {
        Map<String, Object> changes = Map.of(
                "status", Map.of("oldValue", oldStatus, "newValue", newStatus)
        );
        return log("STATUS_CHANGE", "TICKET", ticketId, projectId, userId,
                "Changed ticket status from " + oldStatus + " to " + newStatus, changes);
    }

    public AuditLog logTicketAssigned(String ticketId, String projectId, String userId, String assignedTo) {
        return log("ASSIGN", "TICKET", ticketId, projectId, userId,
                "Assigned ticket to: " + assignedTo, Map.of("assignedTo", assignedTo));
    }

    public AuditLog logTicketDeleted(String ticketId, String projectId, String userId, String title) {
        return log("DELETE", "TICKET", ticketId, projectId, userId,
                "Deleted ticket: " + title, null);
    }

    public AuditLog logProjectCreated(String projectId, String userId, String projectName) {
        return log("CREATE", "PROJECT", projectId, projectId, userId,
                "Created project: " + projectName, null);
    }

    public AuditLog logProjectUpdated(String projectId, String userId, String projectName, Map<String, Object> changes) {
        return log("UPDATE", "PROJECT", projectId, projectId, userId,
                "Updated project: " + projectName, changes);
    }

    public AuditLog logCommentCreated(String commentId, String ticketId, String projectId, String userId) {
        return log("CREATE", "COMMENT", commentId, projectId, userId,
                "Added comment to ticket: " + ticketId, null);
    }

    public AuditLog logCommentDeleted(String commentId, String ticketId, String projectId, String userId) {
        return log("DELETE", "COMMENT", commentId, projectId, userId,
                "Deleted comment from ticket: " + ticketId, null);
    }

    public AuditLog logLabelAdded(String ticketId, String labelId, String projectId, String userId, String labelName) {
        return log("LABEL_ADDED", "TICKET", ticketId, projectId, userId,
                "Added label '" + labelName + "' to ticket", Map.of("labelId", labelId));
    }

    public AuditLog logChecklistCreated(String checklistId, String ticketId, String projectId, String userId, String checklistTitle) {
        return log("CHECKLIST_CREATED", "TICKET", ticketId, projectId, userId,
                "Created checklist '" + checklistTitle + "'", Map.of("checklistId", checklistId));
    }

    public AuditLog logChecklistItemCompleted(String checklistId, String ticketId, String projectId, String userId, String itemTitle) {
        return log("CHECKLIST_ITEM_COMPLETED", "TICKET", ticketId, projectId, userId,
                "Completed checklist item: " + itemTitle, Map.of("checklistId", checklistId));
    }

    public AuditLog logAttachmentUploaded(String attachmentId, String ticketId, String projectId, String userId, String fileName) {
        return log("ATTACHMENT_UPLOADED", "TICKET", ticketId, projectId, userId,
                "Uploaded attachment: " + fileName, Map.of("attachmentId", attachmentId));
    }

    public AuditLog logMemberAdded(String projectId, String userId, String memberId, String memberName, String role) {
        return log("MEMBER_ADDED", "PROJECT", projectId, projectId, userId,
                "Added member '" + memberName + "' with role '" + role + "'",
                Map.of("memberId", memberId, "role", role));
    }

    public AuditLog logMemberRemoved(String projectId, String userId, String memberId, String memberName) {
        return log("MEMBER_REMOVED", "PROJECT", projectId, projectId, userId,
                "Removed member: " + memberName,
                Map.of("memberId", memberId));
    }

    public AuditLog logRoleChanged(String projectId, String userId, String memberId, String oldRole, String newRole) {
        return log("ROLE_CHANGED", "PROJECT", projectId, projectId, userId,
                "Changed role from " + oldRole + " to " + newRole,
                Map.of("memberId", memberId, "oldRole", oldRole, "newRole", newRole));
    }
}

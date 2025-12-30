package org.example.backend.service;

import org.example.backend.model.Project;
import org.example.backend.model.ProjectUserRole;
import org.example.backend.repository.ProjectUserRoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PermissionService {

    @Autowired
    private ProjectUserRoleRepository projectUserRoleRepository;

    @Autowired
    private ProjectService projectService;

    /**
     * Get user role for a project
     */
    public Optional<ProjectUserRole> getUserRoleInProject(String projectId, String userId) {
        return projectUserRoleRepository.findByProjectIdAndUserId(projectId, userId);
    }

    /**
     * Check if user is project owner or admin
     */
    private boolean isProjectOwnerOrAdmin(String projectId, String userId) {
        Optional<Project> project = projectService.getProjectById(projectId);
        if (project.isEmpty()) {
            return false;
        }

        Project p = project.get();
        return p.getOwnerId().equals(userId) ||
               (p.getAdminIds() != null && p.getAdminIds().contains(userId));
    }

    /**
     * Check if user has specific permission in a project
     * Checks both ProjectUserRole and project owner/admin status
     */
    public boolean hasPermission(String projectId, String userId, String permission) {
        // Project owner/admin has all permissions
        if (isProjectOwnerOrAdmin(projectId, userId)) {
            return true;
        }

        // Check through role
        Optional<ProjectUserRole> role = getUserRoleInProject(projectId, userId);
        return role.isPresent() && role.get().hasPermission(permission);
    }

    /**
     * Check if user can view a project
     */
    public boolean canViewProject(String projectId, String userId, Project project) {
        // Owner can always view
        if (project.getOwnerId().equals(userId)) {
            return true;
        }
        // Check through role
        return hasPermission(projectId, userId, "project.view");
    }

    /**
     * Check if user can edit a project
     */
    public boolean canEditProject(String projectId, String userId, Project project) {
        if (project.getOwnerId().equals(userId)) {
            return true;
        }
        return hasPermission(projectId, userId, "project.edit");
    }

    /**
     * Check if user can delete a project (ADMIN only)
     */
    public boolean canDeleteProject(String projectId, String userId, Project project) {
        if (project.getOwnerId().equals(userId)) {
            return true;
        }
        return hasPermission(projectId, userId, "project.delete");
    }

    /**
     * Check if user can manage project members
     */
    public boolean canManageMembers(String projectId, String userId, Project project) {
        if (project.getOwnerId().equals(userId)) {
            return true;
        }
        return hasPermission(projectId, userId, "project.manage_members");
    }

    /**
     * Check if user can create ticket
     */
    public boolean canCreateTicket(String projectId, String userId) {
        return hasPermission(projectId, userId, "ticket.create");
    }

    /**
     * Check if user can edit any ticket
     */
    public boolean canEditTicket(String projectId, String userId) {
        return hasPermission(projectId, userId, "ticket.edit");
    }

    /**
     * Check if user can edit only assigned tickets
     */
    public boolean canEditAssignedTicket(String projectId, String userId, String ticketCreatorId, List<String> assigneeIds) {
        // If user is editor, can edit any ticket
        if (hasPermission(projectId, userId, "ticket.edit")) {
            return true;
        }
        // If user is assigned to ticket, can edit only that ticket
        return hasPermission(projectId, userId, "ticket.edit_assigned") && assigneeIds.contains(userId);
    }

    /**
     * Check if user can delete ticket
     */
    public boolean canDeleteTicket(String projectId, String userId) {
        return hasPermission(projectId, userId, "ticket.delete");
    }

    /**
     * Check if user can assign tickets
     */
    public boolean canAssignTicket(String projectId, String userId) {
        return hasPermission(projectId, userId, "ticket.assign");
    }

    /**
     * Check if user can change ticket status
     */
    public boolean canChangeTicketStatus(String projectId, String userId, List<String> assigneeIds) {
        // If user has general permission
        if (hasPermission(projectId, userId, "ticket.change_status")) {
            return true;
        }
        // If user is assigned and has assigned-only permission
        return hasPermission(projectId, userId, "ticket.change_status_assigned") && assigneeIds.contains(userId);
    }

    /**
     * Check if user can create comment
     */
    public boolean canCreateComment(String projectId, String userId) {
        return hasPermission(projectId, userId, "comment.create");
    }

    /**
     * Check if user can edit comment (own only)
     */
    public boolean canEditComment(String projectId, String userId, String commentAuthorId) {
        if (hasPermission(projectId, userId, "comment.edit")) {
            return true;
        }
        return hasPermission(projectId, userId, "comment.edit_own") && commentAuthorId.equals(userId);
    }

    /**
     * Check if user can delete comment (own only)
     */
    public boolean canDeleteComment(String projectId, String userId, String commentAuthorId) {
        if (hasPermission(projectId, userId, "comment.delete")) {
            return true;
        }
        return hasPermission(projectId, userId, "comment.delete_own") && commentAuthorId.equals(userId);
    }

    /**
     * Check if user can view audit logs
     * Allows project owner/admin or users with audit.view permission
     */
    public boolean canViewAudit(String projectId, String userId) {
        return hasPermission(projectId, userId, "audit.view");
    }

    /**
     * Check if user can delete audit logs (ADMIN only)
     */
    public boolean canDeleteAudit(String projectId, String userId) {
        return hasPermission(projectId, userId, "audit.delete");
    }

    /**
     * Check if user can upload attachments
     */
    public boolean canUploadAttachment(String projectId, String userId) {
        return hasPermission(projectId, userId, "attachment.upload");
    }

    /**
     * Check if user can complete checklist items
     */
    public boolean canCompleteChecklist(String projectId, String userId) {
        return hasPermission(projectId, userId, "checklist.complete");
    }

    /**
     * Assign role to user in project
     */
    public ProjectUserRole assignRole(String projectId, String userId, String role, String invitedBy) {
        ProjectUserRole userRole = new ProjectUserRole();
        userRole.setProjectId(projectId);
        userRole.setUserId(userId);
        userRole.setRole(role);
        userRole.setPermissions(ProjectUserRole.getPermissionsForRole(role));
        userRole.setStatus("ACTIVE");
        userRole.setInvitedBy(invitedBy);

        return projectUserRoleRepository.save(userRole);
    }

    /**
     * Update user role in project
     */
    public ProjectUserRole updateRole(String projectId, String userId, String newRole) {
        Optional<ProjectUserRole> existing = getUserRoleInProject(projectId, userId);

        if (existing.isPresent()) {
            ProjectUserRole userRole = existing.get();
            userRole.setRole(newRole);
            userRole.setPermissions(ProjectUserRole.getPermissionsForRole(newRole));
            userRole.setUpdatedAt(new java.util.Date());
            return projectUserRoleRepository.save(userRole);
        }

        throw new RuntimeException("User role not found in project");
    }

    /**
     * Get all users and their roles in a project
     */
    public List<ProjectUserRole> getProjectMembers(String projectId) {
        return projectUserRoleRepository.findByProjectIdAndStatus(projectId, "ACTIVE");
    }

    /**
     * Remove user from project
     */
    public void removeUserFromProject(String projectId, String userId) {
        projectUserRoleRepository.deleteByProjectIdAndUserId(projectId, userId);
    }

    /**
     * Get user's role (simplified)
     */
    public String getUserRole(String projectId, String userId, Project project) {
        // Owner is always ADMIN
        if (project.getOwnerId().equals(userId)) {
            return "ADMIN";
        }

        Optional<ProjectUserRole> role = getUserRoleInProject(projectId, userId);
        return role.map(ProjectUserRole::getRole).orElse(null);
    }
}

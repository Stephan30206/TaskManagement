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

    public Optional<ProjectUserRole> getUserRoleInProject(String projectId, String userId) {
        return projectUserRoleRepository.findByProjectIdAndUserId(projectId, userId);
    }

    private boolean isProjectOwnerOrAdmin(String projectId, String userId) {
        Optional<Project> project = projectService.getProjectById(projectId);
        if (project.isEmpty()) {
            return false;
        }

        Project p = project.get();
        return p.getOwnerId().equals(userId) ||
               (p.getAdminIds() != null && p.getAdminIds().contains(userId));
    }

    public boolean hasPermission(String projectId, String userId, String permission) {
        if (isProjectOwnerOrAdmin(projectId, userId)) {
            return true;
        }

        Optional<ProjectUserRole> role = getUserRoleInProject(projectId, userId);
        return role.isPresent() && role.get().hasPermission(permission);
    }

    public boolean canViewProject(String projectId, String userId, Project project) {
        if (project.getOwnerId().equals(userId)) {
            return true;
        }
        return hasPermission(projectId, userId, "project.view");
    }

    public boolean canEditProject(String projectId, String userId, Project project) {
        if (project.getOwnerId().equals(userId)) {
            return true;
        }
        return hasPermission(projectId, userId, "project.edit");
    }

    public boolean canDeleteProject(String projectId, String userId, Project project) {
        if (project.getOwnerId().equals(userId)) {
            return true;
        }
        return hasPermission(projectId, userId, "project.delete");
    }

    public boolean canManageMembers(String projectId, String userId, Project project) {
        if (project.getOwnerId().equals(userId)) {
            return true;
        }
        return hasPermission(projectId, userId, "project.manage_members");
    }

    public boolean canCreateTicket(String projectId, String userId) {
        return hasPermission(projectId, userId, "ticket.create");
    }

    public boolean canEditTicket(String projectId, String userId) {
        return hasPermission(projectId, userId, "ticket.edit");
    }

    public boolean canEditAssignedTicket(String projectId, String userId, String ticketCreatorId, List<String> assigneeIds) {
        if (hasPermission(projectId, userId, "ticket.edit")) {
            return true;
        }
        return hasPermission(projectId, userId, "ticket.edit_assigned") && assigneeIds.contains(userId);
    }

    public boolean canDeleteTicket(String projectId, String userId) {
        return hasPermission(projectId, userId, "ticket.delete");
    }

    public boolean canAssignTicket(String projectId, String userId) {
        return hasPermission(projectId, userId, "ticket.assign");
    }

    public boolean canChangeTicketStatus(String projectId, String userId, List<String> assigneeIds) {
        if (hasPermission(projectId, userId, "ticket.change_status")) {
            return true;
        }
        return hasPermission(projectId, userId, "ticket.change_status_assigned") && assigneeIds.contains(userId);
    }

    public boolean canCreateComment(String projectId, String userId) {
        return hasPermission(projectId, userId, "comment.create");
    }

    public boolean canEditComment(String projectId, String userId, String commentAuthorId) {
        if (hasPermission(projectId, userId, "comment.edit")) {
            return true;
        }
        return hasPermission(projectId, userId, "comment.edit_own") && commentAuthorId.equals(userId);
    }

    public boolean canDeleteComment(String projectId, String userId, String commentAuthorId) {
        if (hasPermission(projectId, userId, "comment.delete")) {
            return true;
        }
        return hasPermission(projectId, userId, "comment.delete_own") && commentAuthorId.equals(userId);
    }

    public boolean canViewAudit(String projectId, String userId) {
        return hasPermission(projectId, userId, "audit.view");
    }

    public boolean canDeleteAudit(String projectId, String userId) {
        return hasPermission(projectId, userId, "audit.delete");
    }

    public boolean canUploadAttachment(String projectId, String userId) {
        return hasPermission(projectId, userId, "attachment.upload");
    }

    public boolean canCompleteChecklist(String projectId, String userId) {
        return hasPermission(projectId, userId, "checklist.complete");
    }

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

    public List<ProjectUserRole> getProjectMembers(String projectId) {
        return projectUserRoleRepository.findByProjectIdAndStatus(projectId, "ACTIVE");
    }

    public void removeUserFromProject(String projectId, String userId) {
        projectUserRoleRepository.deleteByProjectIdAndUserId(projectId, userId);
    }

    public String getUserRole(String projectId, String userId, Project project) {
        if (project.getOwnerId().equals(userId)) {
            return "ADMIN";
        }

        Optional<ProjectUserRole> role = getUserRoleInProject(projectId, userId);
        return role.map(ProjectUserRole::getRole).orElse(null);
    }
}

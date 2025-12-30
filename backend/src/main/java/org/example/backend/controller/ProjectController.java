package org.example.backend.controller;

import jakarta.validation.Valid;
import org.example.backend.model.Project;
import org.example.backend.model.User;
import org.example.backend.service.ProjectService;
import org.example.backend.service.PermissionService;
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
@RequestMapping("/projects")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private PermissionService permissionService;

    @Autowired
    private UserService userService;

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        return userService.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"))
                .getId();
    }

    @PostMapping
    public ResponseEntity<Project> createProject(@Valid @RequestBody Project project) {
        String userId = getCurrentUserId();

        Project createdProject = projectService.createProject(project, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdProject);
    }

    @GetMapping
    public ResponseEntity<List<Project>> getUserProjects() {
        String userId = getCurrentUserId();
        return ResponseEntity.ok(projectService.getProjectsForUser(userId));
    }

    @GetMapping("/owned")
    public ResponseEntity<List<Project>> getOwnedProjects() {
        String userId = getCurrentUserId();
        return ResponseEntity.ok(projectService.getProjectsByOwner(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getProjectById(@PathVariable String id) {
        String userId = getCurrentUserId();

        return projectService.getProjectById(id)
                .map(project -> {
                    if (!projectService.hasAccessToProject(project, userId)) {
                        return ResponseEntity
                                .status(HttpStatus.FORBIDDEN)
                                .<Project>build();
                    }
                    return ResponseEntity.ok(project);
                })
                .orElse(ResponseEntity.<Project>notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Project> updateProject(
            @PathVariable String id,
            @Valid @RequestBody Project projectDetails) {

        String userId = getCurrentUserId();
        Project updatedProject = projectService.updateProject(id, projectDetails, userId);
        return ResponseEntity.ok(updatedProject);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable String id) {

        String userId = getCurrentUserId();
        projectService.deleteProject(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{projectId}/admins/{adminId}")
    public ResponseEntity<Project> addAdmin(
            @PathVariable String projectId,
            @PathVariable String adminId) {

        String userId = getCurrentUserId();
        return ResponseEntity.ok(
                projectService.addAdminToProject(projectId, adminId, userId)
        );
    }

    @DeleteMapping("/{projectId}/admins/{adminId}")
    public ResponseEntity<Project> removeAdmin(
            @PathVariable String projectId,
            @PathVariable String adminId) {

        String userId = getCurrentUserId();
        return ResponseEntity.ok(
                projectService.removeAdminFromProject(projectId, adminId, userId)
        );
    }

    @PostMapping("/{projectId}/team/{memberId}")
    public ResponseEntity<Project> addTeamMember(
            @PathVariable String projectId,
            @PathVariable String memberId) {

        String userId = getCurrentUserId();
        Project project = projectService.addTeamMember(projectId, memberId, userId);

        permissionService.assignRole(projectId, memberId, "MEMBER", userId);

        return ResponseEntity.ok(project);
    }

    @DeleteMapping("/{projectId}/team/{memberId}")
    public ResponseEntity<Project> removeTeamMember(
            @PathVariable String projectId,
            @PathVariable String memberId) {

        String userId = getCurrentUserId();
        Project project = projectService.removeTeamMember(projectId, memberId, userId);

        permissionService.removeUserFromProject(projectId, memberId);

        return ResponseEntity.ok(project);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Project> updateProjectStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {

        String status = request.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        String userId = getCurrentUserId();
        return ResponseEntity.ok(
                projectService.changeProjectStatus(id, status, userId)
        );
    }

    @GetMapping("/{projectId}/members")
    public ResponseEntity<List<Map<String, Object>>> getProjectMembers(
            @PathVariable String projectId) {

        String userId = getCurrentUserId();
        return ResponseEntity.ok(
                projectService.getProjectMembersWithDetails(projectId, userId)
        );
    }

    @GetMapping("/search")
    public ResponseEntity<List<Project>> searchProjects(
            @RequestParam String keyword) {

        String userId = getCurrentUserId();
        return ResponseEntity.ok(
                projectService.searchProjects(keyword, userId)
        );
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getUserProjectStats() {

        String userId = getCurrentUserId();
        return ResponseEntity.ok(
                projectService.getUserProjectStats(userId)
        );
    }
}

package org.example.backend.service;

import org.example.backend.model.Project;
import org.example.backend.model.User;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.bson.types.ObjectId;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    public Project createProject(Project project, String ownerIdString) {
        ObjectId ownerId;
        try {
            ownerId = new ObjectId(ownerIdString);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("ID propriétaire invalide: " + ownerIdString);
        }

        User owner = userRepository.findById(ownerId.toHexString())
                .orElseThrow(() -> new RuntimeException("Propriétaire non trouvé"));

        project.setOwnerId(ownerId.toHexString());
        project.setCreatedAt(new Date());
        project.setUpdatedAt(new Date());
        project.setStatus("ACTIVE");

        if (project.getAdminIds() == null) {
            project.setAdminIds(new ArrayList<>());
        }
        if (project.getTeamIds() == null) {
            project.setTeamIds(new ArrayList<>());
        }

        String ownerIdStr = ownerId.toHexString();
        if (!project.getAdminIds().contains(ownerIdStr)) {
            project.getAdminIds().add(ownerIdStr);
        }

        return projectRepository.save(project);
    }

    public Optional<Project> getProjectById(String id) {
        return projectRepository.findById(id);
    }

    public List<Project> getProjectsByOwner(String ownerId) {
        return projectRepository.findByOwnerId(ownerId);
    }

    public List<Project> getProjectsForUser(String userId) {
        List<Project> allProjects = new ArrayList<>();

        allProjects.addAll(projectRepository.findByOwnerId(userId));
        allProjects.addAll(projectRepository.findByAdminIdsContaining(userId));
        allProjects.addAll(projectRepository.findByTeamIdsContaining(userId));

        return allProjects.stream()
                .distinct()
                .collect(Collectors.toList());
    }

    public Project updateProject(String id, Project projectDetails, String userId) {
        return projectRepository.findById(id).map(existingProject -> {
            if (!existingProject.getOwnerId().equals(userId) &&
                    !existingProject.getAdminIds().contains(userId)) {
                throw new RuntimeException("Permission refusée: vous n'êtes pas administrateur de ce projet");
            }

            if (projectDetails.getName() != null) {
                existingProject.setName(projectDetails.getName());
            }
            if (projectDetails.getDescription() != null) {
                existingProject.setDescription(projectDetails.getDescription());
            }
            if (projectDetails.getStatus() != null) {
                existingProject.setStatus(projectDetails.getStatus());
            }

            existingProject.setUpdatedAt(new Date());
            return projectRepository.save(existingProject);
        }).orElseThrow(() -> new RuntimeException("Projet non trouvé"));
    }

    @Transactional
    public void deleteProject(String id, String userId) {
        projectRepository.findById(id).ifPresent(project -> {
            if (!project.getOwnerId().equals(userId)) {
                throw new RuntimeException("Seul le propriétaire peut supprimer le projet");
            }
            projectRepository.deleteById(id);
        });
    }

    public Project addAdminToProject(String projectId, String adminId, String userId) {
        return projectRepository.findById(projectId).map(project -> {
            if (!project.getOwnerId().equals(userId)) {
                throw new RuntimeException("Seul le propriétaire peut ajouter des administrateurs");
            }

            if (!userRepository.existsById(adminId)) {
                throw new RuntimeException("Utilisateur admin non trouvé");
            }

            if (!project.getAdminIds().contains(adminId)) {
                project.getAdminIds().add(adminId);
                project.setUpdatedAt(new Date());
                return projectRepository.save(project);
            }

            return project;
        }).orElseThrow(() -> new RuntimeException("Projet non trouvé"));
    }

    public Project removeAdminFromProject(String projectId, String adminId, String userId) {
        return projectRepository.findById(projectId).map(project -> {
            if (!project.getOwnerId().equals(userId)) {
                throw new RuntimeException("Seul le propriétaire peut retirer des administrateurs");
            }

            if (project.getOwnerId().equals(adminId)) {
                throw new RuntimeException("Impossible de retirer le propriétaire des administrateurs");
            }

            if (project.getAdminIds().contains(adminId)) {
                project.getAdminIds().remove(adminId);
                project.setUpdatedAt(new Date());
                return projectRepository.save(project);
            }

            return project;
        }).orElseThrow(() -> new RuntimeException("Projet non trouvé"));
    }

    public Project addTeamMember(String projectId, String teamMemberId, String userId) {
        return projectRepository.findById(projectId).map(project -> {
            if (!project.getOwnerId().equals(userId) && !project.getAdminIds().contains(userId)) {
                throw new RuntimeException("Permission refusée: vous n'êtes pas administrateur");
            }

            if (!userRepository.existsById(teamMemberId)) {
                throw new RuntimeException("Utilisateur non trouvé");
            }

            if (!project.getTeamIds().contains(teamMemberId)) {
                project.getTeamIds().add(teamMemberId);
                project.setUpdatedAt(new Date());
                return projectRepository.save(project);
            }

            return project;
        }).orElseThrow(() -> new RuntimeException("Projet non trouvé"));
    }

    public Project removeTeamMember(String projectId, String teamMemberId, String userId) {
        return projectRepository.findById(projectId).map(project -> {
            if (!project.getOwnerId().equals(userId) && !project.getAdminIds().contains(userId)) {
                throw new RuntimeException("Permission refusée: vous n'êtes pas administrateur");
            }

            if (project.getTeamIds().contains(teamMemberId)) {
                project.getTeamIds().remove(teamMemberId);
                project.setUpdatedAt(new Date());
                return projectRepository.save(project);
            }

            return project;
        }).orElseThrow(() -> new RuntimeException("Projet non trouvé"));
    }

    public List<Project> searchProjects(String keyword, String userId) {
        List<Project> projects = projectRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
                keyword, keyword);

        return projects.stream()
                .filter(project -> hasAccessToProject(project, userId))
                .collect(Collectors.toList());
    }

    public Map<String, Object> getUserProjectStats(String userId) {
        List<Project> userProjects = getProjectsForUser(userId);

        long activeCount = userProjects.stream()
                .filter(p -> "ACTIVE".equals(p.getStatus()))
                .count();

        long inactiveCount = userProjects.stream()
                .filter(p -> "INACTIVE".equals(p.getStatus()))
                .count();

        long archivedCount = userProjects.stream()
                .filter(p -> "ARCHIVED".equals(p.getStatus()))
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalProjects", userProjects.size());
        stats.put("activeProjects", activeCount);
        stats.put("inactiveProjects", inactiveCount);
        stats.put("archivedProjects", archivedCount);
        stats.put("ownedProjects", getProjectsByOwner(userId).size());

        return stats;
    }

    public List<Map<String, Object>> getProjectMembersWithDetails(String projectId, String userId) {
        return projectRepository.findById(projectId).map(project -> {
            if (!hasAccessToProject(project, userId)) {
                throw new RuntimeException("Accès refusé au projet");
            }

            List<Map<String, Object>> members = new ArrayList<>();
            Set<String> userIds = new HashSet<>();

            userIds.add(project.getOwnerId());

            if (project.getAdminIds() != null) {
                userIds.addAll(project.getAdminIds());
            }

            if (project.getTeamIds() != null) {
                userIds.addAll(project.getTeamIds());
            }

            for (String memberId : userIds) {
                userRepository.findById(memberId).ifPresent(user -> {
                    Map<String, Object> memberDetails = new HashMap<>();
                    memberDetails.put("id", user.getId());
                    memberDetails.put("firstName", user.getFirstName());
                    memberDetails.put("lastName", user.getLastName());
                    memberDetails.put("email", user.getEmail());
                    memberDetails.put("phone", user.getPhone());

                    if (project.getOwnerId().equals(memberId)) {
                        memberDetails.put("role", "OWNER");
                    } else if (project.getAdminIds() != null && project.getAdminIds().contains(memberId)) {
                        memberDetails.put("role", "ADMIN");
                    } else {
                        memberDetails.put("role", "TEAM_MEMBER");
                    }

                    members.add(memberDetails);
                });
            }

            return members;
        }).orElseThrow(() -> new RuntimeException("Projet non trouvé"));
    }

    public boolean hasAccessToProject(Project project, String userId) {
        return project.getOwnerId().equals(userId) ||
                (project.getAdminIds() != null && project.getAdminIds().contains(userId)) ||
                (project.getTeamIds() != null && project.getTeamIds().contains(userId));
    }

    public Project changeProjectStatus(String projectId, String status, String userId) {
        return projectRepository.findById(projectId).map(project -> {
            if (!project.getOwnerId().equals(userId) && !project.getAdminIds().contains(userId)) {
                throw new RuntimeException("Permission refusée");
            }

            if (!Arrays.asList("ACTIVE", "INACTIVE", "ARCHIVED").contains(status)) {
                throw new RuntimeException("Statut invalide");
            }

            project.setStatus(status);
            project.setUpdatedAt(new Date());
            return projectRepository.save(project);
        }).orElseThrow(() -> new RuntimeException("Projet non trouvé"));
    }

    public long countProjects() {
        return projectRepository.count();
    }

    public List<Project> getRecentProjects(int limit) {
        Query query = new Query();
        query.with(org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        query.limit(limit);

        return mongoTemplate.find(query, Project.class);
    }
}

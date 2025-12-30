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

    // CRÉATION DE PROJET
    public Project createProject(Project project, String ownerIdString) {
        // 1. Convertir le String en ObjectId
        ObjectId ownerId;
        try {
            ownerId = new ObjectId(ownerIdString);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("ID propriétaire invalide: " + ownerIdString);
        }

        // 2. Vérifier que l'utilisateur existe
        User owner = userRepository.findById(ownerId.toHexString())
                .orElseThrow(() -> new RuntimeException("Propriétaire non trouvé"));

        // 3. Définir les champs ObjectId
        project.setOwnerId(ownerId.toHexString()); // Stocke en String
        project.setCreatedAt(new Date());
        project.setUpdatedAt(new Date());
        project.setStatus("ACTIVE");

        // 4. Initialiser les listes
        if (project.getAdminIds() == null) {
            project.setAdminIds(new ArrayList<>());
        }
        if (project.getTeamIds() == null) {
            project.setTeamIds(new ArrayList<>());
        }

        // 5. Ajouter le propriétaire comme admin (en String)
        String ownerIdStr = ownerId.toHexString();
        if (!project.getAdminIds().contains(ownerIdStr)) {
            project.getAdminIds().add(ownerIdStr);
        }

        return projectRepository.save(project);
    }

    // RÉCUPÉRATION PAR ID
    public Optional<Project> getProjectById(String id) {
        return projectRepository.findById(id);
    }

    // PROJETS D'UN PROPRIÉTAIRE
    public List<Project> getProjectsByOwner(String ownerId) {
        return projectRepository.findByOwnerId(ownerId);
    }

    // TOUS LES PROJETS D'UN UTILISATEUR
    public List<Project> getProjectsForUser(String userId) {
        List<Project> allProjects = new ArrayList<>();

        // Projets dont l'utilisateur est propriétaire
        allProjects.addAll(projectRepository.findByOwnerId(userId));

        // Projets dont l'utilisateur est admin
        allProjects.addAll(projectRepository.findByAdminIdsContaining(userId));

        // Projets dont l'utilisateur est membre de l'équipe
        allProjects.addAll(projectRepository.findByTeamIdsContaining(userId));

        // Éliminer les doublons
        return allProjects.stream()
                .distinct()
                .collect(Collectors.toList());
    }

    // MISE À JOUR DE PROJET
    public Project updateProject(String id, Project projectDetails, String userId) {
        return projectRepository.findById(id).map(existingProject -> {
            // Vérifier les permissions
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

    // SUPPRESSION DE PROJET
    @Transactional
    public void deleteProject(String id, String userId) {
        projectRepository.findById(id).ifPresent(project -> {
            // Seul le propriétaire peut supprimer
            if (!project.getOwnerId().equals(userId)) {
                throw new RuntimeException("Seul le propriétaire peut supprimer le projet");
            }
            projectRepository.deleteById(id);
        });
    }

    // AJOUT D'ADMIN AU PROJET
    public Project addAdminToProject(String projectId, String adminId, String userId) {
        return projectRepository.findById(projectId).map(project -> {
            // Vérifier que l'utilisateur est propriétaire
            if (!project.getOwnerId().equals(userId)) {
                throw new RuntimeException("Seul le propriétaire peut ajouter des administrateurs");
            }

            // Vérifier que l'admin existe
            if (!userRepository.existsById(adminId)) {
                throw new RuntimeException("Utilisateur admin non trouvé");
            }

            // Ajouter l'admin s'il n'est pas déjà dans la liste
            if (!project.getAdminIds().contains(adminId)) {
                project.getAdminIds().add(adminId);
                project.setUpdatedAt(new Date());
                return projectRepository.save(project);
            }

            return project;
        }).orElseThrow(() -> new RuntimeException("Projet non trouvé"));
    }

    // RETRAIT D'ADMIN DU PROJET
    public Project removeAdminFromProject(String projectId, String adminId, String userId) {
        return projectRepository.findById(projectId).map(project -> {
            // Vérifier que l'utilisateur est propriétaire
            if (!project.getOwnerId().equals(userId)) {
                throw new RuntimeException("Seul le propriétaire peut retirer des administrateurs");
            }

            // Ne pas permettre de retirer le propriétaire
            if (project.getOwnerId().equals(adminId)) {
                throw new RuntimeException("Impossible de retirer le propriétaire des administrateurs");
            }

            // Retirer l'admin s'il est dans la liste
            if (project.getAdminIds().contains(adminId)) {
                project.getAdminIds().remove(adminId);
                project.setUpdatedAt(new Date());
                return projectRepository.save(project);
            }

            return project;
        }).orElseThrow(() -> new RuntimeException("Projet non trouvé"));
    }

    // AJOUT DE MEMBRE À L'ÉQUIPE
    public Project addTeamMember(String projectId, String teamMemberId, String userId) {
        return projectRepository.findById(projectId).map(project -> {
            // Vérifier que l'utilisateur est propriétaire ou admin
            if (!project.getOwnerId().equals(userId) && !project.getAdminIds().contains(userId)) {
                throw new RuntimeException("Permission refusée: vous n'êtes pas administrateur");
            }

            // Vérifier que le membre existe
            if (!userRepository.existsById(teamMemberId)) {
                throw new RuntimeException("Utilisateur non trouvé");
            }

            // Ajouter le membre s'il n'est pas déjà dans l'équipe
            if (!project.getTeamIds().contains(teamMemberId)) {
                project.getTeamIds().add(teamMemberId);
                project.setUpdatedAt(new Date());
                return projectRepository.save(project);
            }

            return project;
        }).orElseThrow(() -> new RuntimeException("Projet non trouvé"));
    }

    // RETRAIT DE MEMBRE DE L'ÉQUIPE
    public Project removeTeamMember(String projectId, String teamMemberId, String userId) {
        return projectRepository.findById(projectId).map(project -> {
            // Vérifier que l'utilisateur est propriétaire ou admin
            if (!project.getOwnerId().equals(userId) && !project.getAdminIds().contains(userId)) {
                throw new RuntimeException("Permission refusée: vous n'êtes pas administrateur");
            }

            // Retirer le membre s'il est dans l'équipe
            if (project.getTeamIds().contains(teamMemberId)) {
                project.getTeamIds().remove(teamMemberId);
                project.setUpdatedAt(new Date());
                return projectRepository.save(project);
            }

            return project;
        }).orElseThrow(() -> new RuntimeException("Projet non trouvé"));
    }

    // RECHERCHE DE PROJETS
    public List<Project> searchProjects(String keyword, String userId) {
        // Recherche par nom ou description
        List<Project> projects = projectRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
                keyword, keyword);

        // Filtrer par accès utilisateur
        return projects.stream()
                .filter(project -> hasAccessToProject(project, userId))
                .collect(Collectors.toList());
    }

    // STATISTIQUES DE PROJETS
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

    // MEMBRES DU PROJET AVEC DÉTAILS
    public List<Map<String, Object>> getProjectMembersWithDetails(String projectId, String userId) {
        return projectRepository.findById(projectId).map(project -> {
            // Vérifier l'accès
            if (!hasAccessToProject(project, userId)) {
                throw new RuntimeException("Accès refusé au projet");
            }

            List<Map<String, Object>> members = new ArrayList<>();
            Set<String> userIds = new HashSet<>();

            // Propriétaire
            userIds.add(project.getOwnerId());

            // Admins
            if (project.getAdminIds() != null) {
                userIds.addAll(project.getAdminIds());
            }

            // Équipe
            if (project.getTeamIds() != null) {
                userIds.addAll(project.getTeamIds());
            }

            // Récupérer les détails des utilisateurs
            for (String memberId : userIds) {
                userRepository.findById(memberId).ifPresent(user -> {
                    Map<String, Object> memberDetails = new HashMap<>();
                    memberDetails.put("id", user.getId());
                    memberDetails.put("firstName", user.getFirstName());
                    memberDetails.put("lastName", user.getLastName());
                    memberDetails.put("email", user.getEmail());
                    memberDetails.put("phone", user.getPhone());

                    // Déterminer le rôle
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

    // VÉRIFICATION D'ACCÈS AU PROJET
    public boolean hasAccessToProject(Project project, String userId) {
        return project.getOwnerId().equals(userId) ||
                (project.getAdminIds() != null && project.getAdminIds().contains(userId)) ||
                (project.getTeamIds() != null && project.getTeamIds().contains(userId));
    }

    // CHANGEMENT DE STATUT
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

    // COMPTE DE PROJETS
    public long countProjects() {
        return projectRepository.count();
    }

    // PROJETS RÉCENTS
    public List<Project> getRecentProjects(int limit) {
        Query query = new Query();
        query.with(org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        query.limit(limit);

        return mongoTemplate.find(query, Project.class);
    }
}

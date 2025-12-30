package org.example.backend.service;

import org.example.backend.model.Project;
import org.example.backend.model.Ticket;
import org.example.backend.model.User;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TicketService {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private UserService userService;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private PermissionService permissionService;

    @Autowired
    private NotificationService notificationService; // AJOUTÉ

    // CRÉATION DE TICKET
    public Ticket createTicket(Ticket ticket, String creatorId) {
        String projectId = ticket.getProjectId();

        // Trouver le projet
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Projet non trouvé"));

        // VÉRIFICATION MODIFIÉE : Autoriser la création si :
        // 1. L'utilisateur est propriétaire OU
        // 2. L'utilisateur est admin OU
        // 3. L'utilisateur est membre de l'équipe OU
        // 4. TOUS les utilisateurs authentifiés peuvent créer des tickets (option)
        boolean hasAccess = project.getOwnerId().equals(creatorId) ||
                (project.getAdminIds() != null && project.getAdminIds().contains(creatorId)) ||
                (project.getTeamIds() != null && project.getTeamIds().contains(creatorId));

        // Pour tester, autorisez tous les utilisateurs authentifiés :
        // boolean hasAccess = true;

        if (!hasAccess) {
            throw new RuntimeException("Accès refusé au projet");
        }

        ticket.setCreatorId(creatorId);
        ticket.setCreatedAt(new Date());
        ticket.setUpdatedAt(new Date());

        if (ticket.getStatus() == null) {
            ticket.setStatus("TODO");
        }

        if (ticket.getAssigneeIds() == null) {
            ticket.setAssigneeIds(new ArrayList<>());
        }

        return ticketRepository.save(ticket);
    }

    // RÉCUPÉRATION PAR ID
    public Optional<Ticket> getTicketById(String id) {
        return ticketRepository.findById(id);
    }

    // TICKETS D'UN PROJET
    public List<Ticket> getTicketsByProject(String projectId) {
        return ticketRepository.findByProjectId(projectId);
    }

    // TICKETS D'UN UTILISATEUR (CRÉÉS PAR LUI)
    public List<Ticket> getTicketsForUser(String userId) {
        return ticketRepository.findByCreatorId(userId);
    }

    // TICKETS ASSIGNÉS À UN UTILISATEUR
    public List<Ticket> getTicketsAssignedToUser(String userId) {
        return ticketRepository.findByAssigneeIdsContaining(userId);
    }

    // MISE À JOUR DE TICKET
    public Ticket updateTicket(String id, Ticket ticketDetails, String userId) {
        return ticketRepository.findById(id).map(existingTicket -> {
            String projectId = existingTicket.getProjectId();

            // Vérifier les permissions
            if (!existingTicket.getCreatorId().equals(userId)) {
                // Check if user can edit this ticket
                boolean canEdit = permissionService.canEditTicket(projectId, userId) ||
                        permissionService.canEditAssignedTicket(projectId, userId, existingTicket.getCreatorId(),
                                existingTicket.getAssigneeIds());

                // Also check if user is a member/manager of the project
                if (!canEdit) {
                    Optional<Project> projectOpt = projectRepository.findById(projectId);
                    if (projectOpt.isPresent()) {
                        Project project = projectOpt.get();
                        // Allow project members, admins, and managers to edit tickets
                        boolean isMember = project.getTeamIds() != null && project.getTeamIds().contains(userId);
                        boolean isAdmin = project.getOwnerId().equals(userId) ||
                                (project.getAdminIds() != null && project.getAdminIds().contains(userId));
                        boolean isManager = permissionService.hasPermission(projectId, userId, "ticket.edit");

                        canEdit = isMember || isAdmin || isManager;
                    }
                }

                if (!canEdit) {
                    throw new RuntimeException("Permission refusée");
                }
            }

            // Mise à jour des champs
            if (ticketDetails.getTitle() != null) {
                existingTicket.setTitle(ticketDetails.getTitle());
            }
            if (ticketDetails.getDescription() != null) {
                existingTicket.setDescription(ticketDetails.getDescription());
            }
            if (ticketDetails.getStatus() != null) {
                existingTicket.setStatus(ticketDetails.getStatus());
            }
            if (ticketDetails.getEstimatedDate() != null) {
                existingTicket.setEstimatedDate(ticketDetails.getEstimatedDate());
            }
            if (ticketDetails.getAssigneeIds() != null) {
                existingTicket.setAssigneeIds(ticketDetails.getAssigneeIds());
            }

            existingTicket.setUpdatedAt(new Date());
            return ticketRepository.save(existingTicket);
        }).orElseThrow(() -> new RuntimeException("Ticket non trouvé"));
    }

    // SUPPRESSION DE TICKET
    @Transactional
    public void deleteTicket(String id, String userId) {
        ticketRepository.findById(id).ifPresent(ticket -> {
            String projectId = ticket.getProjectId();

            // Check if user can delete this ticket (creator or project admin)
            boolean canDelete = ticket.getCreatorId().equals(userId) ||
                    permissionService.hasPermission(projectId, userId, "ticket.delete");

            if (!canDelete) {
                throw new RuntimeException("Seul le créateur ou un administrateur peut supprimer le ticket");
            }
            ticketRepository.deleteById(id);
        });
    }

    // ASSIGNATION DE TICKET - MODIFIÉ POUR INCLURE LES NOTIFICATIONS
    public Ticket assignTicket(String ticketId, List<String> assigneeIds, String userId) {
        return ticketRepository.findById(ticketId).map(ticket -> {
            String projectId = ticket.getProjectId();

            // Check if user can assign tickets (admin, creator, or has permission)
            boolean canAssign = ticket.getCreatorId().equals(userId) ||
                    permissionService.hasPermission(projectId, userId, "ticket.assign");

            if (!canAssign) {
                throw new RuntimeException("Permission refusée pour assigner des tickets");
            }

            // Vérifier que tous les assignés existent
            for (String assigneeId : assigneeIds) {
                if (!userService.getUserById(assigneeId).isPresent()) {
                    throw new RuntimeException("Utilisateur assigné non trouvé: " + assigneeId);
                }
            }

            // Récupérer les informations de l'utilisateur qui assigne
            User assigner = userService.getUserById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur assigneur non trouvé"));

            // Créer une notification pour chaque nouvel assigné
            List<String> currentAssignees = ticket.getAssigneeIds() != null ? ticket.getAssigneeIds() : new ArrayList<>();

            for (String assigneeId : assigneeIds) {
                // Vérifier si l'assigné n'était pas déjà assigné
                if (!currentAssignees.contains(assigneeId)) {
                    // Récupérer l'assigné
                    User assignee = userService.getUserById(assigneeId)
                            .orElseThrow(() -> new RuntimeException("Utilisateur assigné non trouvé: " + assigneeId));

                    // Créer la notification
                    try {
                        notificationService.notifyTicketAssigned(
                                ticketId,
                                ticket.getTitle(),
                                assigneeId,
                                userId,
                                assigner.getFirstName() + " " + assigner.getLastName(),
                                assigner.getEmail(),
                                projectId
                        );
                        System.out.println("Notification créée pour l'assignation du ticket " + ticketId +
                                " à l'utilisateur " + assigneeId);
                    } catch (Exception e) {
                        System.err.println("Erreur lors de la création de la notification: " + e.getMessage());
                        // Ne pas bloquer l'assignation si la notification échoue
                    }
                }
            }

            // Mettre à jour les assignés
            ticket.setAssigneeIds(assigneeIds);
            ticket.setUpdatedAt(new Date());

            Ticket savedTicket = ticketRepository.save(ticket);
            System.out.println("Ticket " + ticketId + " assigné avec succès à " + assigneeIds.size() + " utilisateur(s)");

            return savedTicket;
        }).orElseThrow(() -> new RuntimeException("Ticket non trouvé"));
    }

    // STATISTIQUES DE TICKETS PAR PROJET
    public Map<String, Object> getTicketStatsByProject(String projectId) {
        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("projectId").is(projectId)),
                Aggregation.group("status")
                        .count().as("count")
        );

        AggregationResults<Map> results = mongoTemplate.aggregate(
                aggregation, "tickets", Map.class
        );

        List<Map> stats = results.getMappedResults();
        Map<String, Object> result = new HashMap<>();

        // Initialiser tous les statuts à 0
        result.put("TODO", 0);
        result.put("IN_PROGRESS", 0);
        result.put("IN_VALIDATION", 0);
        result.put("DONE", 0);

        // Mettre à jour avec les valeurs réelles
        for (Map stat : stats) {
            result.put((String) stat.get("_id"), stat.get("count"));
        }

        // Ajouter le total
        result.put("total", stats.stream()
                .mapToInt(stat -> ((Number) stat.get("count")).intValue())
                .sum());

        return result;
    }

    // TICKETS EN RETARD
    public List<Ticket> getOverdueTickets() {
        return ticketRepository.findOverdueTickets(new Date());
    }

    // RECHERCHE DE TICKETS
    public List<Ticket> searchTickets(String keyword, String projectId) {
        Query query = new Query();

        // Critères de recherche
        Criteria criteria = new Criteria();
        List<Criteria> orCriteria = new ArrayList<>();

        orCriteria.add(Criteria.where("title").regex(keyword, "i"));
        orCriteria.add(Criteria.where("description").regex(keyword, "i"));

        criteria.orOperator(orCriteria.toArray(new Criteria[0]));

        // Filtrer par projet si spécifié
        if (projectId != null && !projectId.isEmpty()) {
            criteria.and("projectId").is(projectId);
        }

        query.addCriteria(criteria);
        query.with(org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));

        return mongoTemplate.find(query, Ticket.class);
    }

    // FILTRAGE DE TICKETS
    public List<Ticket> filterTickets(String status, String projectId, String assigneeId) {
        Query query = new Query();
        Criteria criteria = new Criteria();

        if (status != null && !status.isEmpty()) {
            criteria.and("status").is(status);
        }

        if (projectId != null && !projectId.isEmpty()) {
            criteria.and("projectId").is(projectId);
        }

        if (assigneeId != null && !assigneeId.isEmpty()) {
            criteria.and("assigneeIds").in(assigneeId);
        }

        query.addCriteria(criteria);
        query.with(org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));

        return mongoTemplate.find(query, Ticket.class);
    }

    // MISE À JOUR DE STATUT
    public Ticket updateTicketStatus(String ticketId, String status, String userId) {
        return ticketRepository.findById(ticketId).map(ticket -> {
            // Vérifier les permissions
            boolean hasPermission = ticket.getCreatorId().equals(userId) ||
                    (ticket.getAssigneeIds() != null && ticket.getAssigneeIds().contains(userId));

            if (!hasPermission) {
                projectService.getProjectById(ticket.getProjectId()).ifPresent(project -> {
                    if (!project.getOwnerId().equals(userId) && !project.getAdminIds().contains(userId)) {
                        throw new RuntimeException("Permission refusée");
                    }
                });
            }

            // Valider le statut
            if (!Arrays.asList("TODO", "IN_PROGRESS", "IN_VALIDATION", "DONE").contains(status)) {
                throw new RuntimeException("Statut invalide");
            }

            ticket.setStatus(status);
            ticket.setUpdatedAt(new Date());
            return ticketRepository.save(ticket);
        }).orElseThrow(() -> new RuntimeException("Ticket non trouvé"));
    }

    // COMPTE DE TICKETS
    public Map<String, Long> getTicketCounts(String userId) {
        Map<String, Long> counts = new HashMap<>();

        counts.put("created", ticketRepository.countByCreatorId(userId));
        counts.put("assigned", ticketRepository.countByAssigneeIdsContaining(userId));
        counts.put("total", counts.get("created") + counts.get("assigned"));

        return counts;
    }

    // TICKETS RÉCENTS
    public List<Ticket> getRecentTickets(int limit) {
        Query query = new Query();
        query.with(org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        query.limit(limit);

        return mongoTemplate.find(query, Ticket.class);
    }

    // ANALYTIQUES AVANCÉES
    public Map<String, Object> getTicketAnalytics(String projectId, Date startDate, Date endDate) {
        Query query = new Query();
        Criteria criteria = Criteria.where("projectId").is(projectId);

        if (startDate != null) {
            criteria.and("createdAt").gte(startDate);
        }
        if (endDate != null) {
            criteria.and("createdAt").lte(endDate);
        }

        query.addCriteria(criteria);
        List<Ticket> tickets = mongoTemplate.find(query, Ticket.class);

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("totalTickets", tickets.size());
        analytics.put("completedTickets", tickets.stream()
                .filter(t -> "DONE".equals(t.getStatus()))
                .count());
        analytics.put("averageCompletionTime", calculateAverageCompletionTime(tickets));
        analytics.put("statusDistribution", getStatusDistribution(tickets));

        return analytics;
    }

    private double calculateAverageCompletionTime(List<Ticket> tickets) {
        List<Ticket> completedTickets = tickets.stream()
                .filter(t -> "DONE".equals(t.getStatus()) && t.getCreatedAt() != null && t.getUpdatedAt() != null)
                .collect(Collectors.toList());

        if (completedTickets.isEmpty()) {
            return 0;
        }

        double totalDays = completedTickets.stream()
                .mapToDouble(t -> {
                    long diff = t.getUpdatedAt().getTime() - t.getCreatedAt().getTime();
                    return diff / (1000.0 * 60 * 60 * 24); // Convertir en jours
                })
                .sum();

        return totalDays / completedTickets.size();
    }

    private Map<String, Long> getStatusDistribution(List<Ticket> tickets) {
        Map<String, Long> distribution = new HashMap<>();
        for (Ticket ticket : tickets) {
            distribution.merge(ticket.getStatus(), 1L, Long::sum);
        }
        return distribution;
    }

    // VÉRIFICATION D'ACCÈS AU TICKET
    public boolean hasAccessToTicket(String ticketId, String userId) {
        Optional<Ticket> ticketOpt = ticketRepository.findById(ticketId);
        if (ticketOpt.isEmpty()) {
            return false;
        }

        Ticket ticket = ticketOpt.get();

        // Le créateur a toujours accès
        if (ticket.getCreatorId().equals(userId)) {
            return true;
        }

        // Les assignés ont accès
        if (ticket.getAssigneeIds() != null && ticket.getAssigneeIds().contains(userId)) {
            return true;
        }

        // Vérifier via le projet
        Optional<Project> projectOpt = projectService.getProjectById(ticket.getProjectId());
        return projectOpt.map(project ->
                project.getOwnerId().equals(userId) ||
                        project.getAdminIds().contains(userId) ||
                        project.getTeamIds().contains(userId)
        ).orElse(false);
    }
}
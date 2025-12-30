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
    private NotificationService notificationService;

    public Ticket createTicket(Ticket ticket, String creatorId) {
        String projectId = ticket.getProjectId();

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Projet non trouvé"));

        boolean hasAccess = project.getOwnerId().equals(creatorId) ||
                (project.getAdminIds() != null && project.getAdminIds().contains(creatorId)) ||
                (project.getTeamIds() != null && project.getTeamIds().contains(creatorId));

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

    public Optional<Ticket> getTicketById(String id) {
        return ticketRepository.findById(id);
    }

    public List<Ticket> getTicketsByProject(String projectId) {
        return ticketRepository.findByProjectId(projectId);
    }

    public List<Ticket> getTicketsForUser(String userId) {
        return ticketRepository.findByCreatorId(userId);
    }

    public List<Ticket> getTicketsAssignedToUser(String userId) {
        return ticketRepository.findByAssigneeIdsContaining(userId);
    }

    public Ticket updateTicket(String id, Ticket ticketDetails, String userId) {
        return ticketRepository.findById(id).map(existingTicket -> {
            String projectId = existingTicket.getProjectId();

            if (!existingTicket.getCreatorId().equals(userId)) {
                boolean canEdit = permissionService.canEditTicket(projectId, userId) ||
                        permissionService.canEditAssignedTicket(projectId, userId, existingTicket.getCreatorId(),
                                existingTicket.getAssigneeIds());

                if (!canEdit) {
                    Optional<Project> projectOpt = projectRepository.findById(projectId);
                    if (projectOpt.isPresent()) {
                        Project project = projectOpt.get();
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

    @Transactional
    public void deleteTicket(String id, String userId) {
        ticketRepository.findById(id).ifPresent(ticket -> {
            String projectId = ticket.getProjectId();

            boolean canDelete = ticket.getCreatorId().equals(userId) ||
                    permissionService.hasPermission(projectId, userId, "ticket.delete");

            if (!canDelete) {
                throw new RuntimeException("Seul le créateur ou un administrateur peut supprimer le ticket");
            }
            ticketRepository.deleteById(id);
        });
    }

    public Ticket assignTicket(String ticketId, List<String> assigneeIds, String userId) {
        return ticketRepository.findById(ticketId).map(ticket -> {
            String projectId = ticket.getProjectId();

            boolean canAssign = ticket.getCreatorId().equals(userId) ||
                    permissionService.hasPermission(projectId, userId, "ticket.assign");

            if (!canAssign) {
                throw new RuntimeException("Permission refusée pour assigner des tickets");
            }

            for (String assigneeId : assigneeIds) {
                if (!userService.getUserById(assigneeId).isPresent()) {
                    throw new RuntimeException("Utilisateur assigné non trouvé: " + assigneeId);
                }
            }

            User assigner = userService.getUserById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur assigneur non trouvé"));

            List<String> currentAssignees = ticket.getAssigneeIds() != null ? ticket.getAssigneeIds() : new ArrayList<>();

            for (String assigneeId : assigneeIds) {
                if (!currentAssignees.contains(assigneeId)) {
                    User assignee = userService.getUserById(assigneeId)
                            .orElseThrow(() -> new RuntimeException("Utilisateur assigné non trouvé: " + assigneeId));

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
                    }
                }
            }

            ticket.setAssigneeIds(assigneeIds);
            ticket.setUpdatedAt(new Date());

            Ticket savedTicket = ticketRepository.save(ticket);
            System.out.println("Ticket " + ticketId + " assigné avec succès à " + assigneeIds.size() + " utilisateur(s)");

            return savedTicket;
        }).orElseThrow(() -> new RuntimeException("Ticket non trouvé"));
    }

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

        result.put("TODO", 0);
        result.put("IN_PROGRESS", 0);
        result.put("IN_VALIDATION", 0);
        result.put("DONE", 0);

        for (Map stat : stats) {
            result.put((String) stat.get("_id"), stat.get("count"));
        }

        result.put("total", stats.stream()
                .mapToInt(stat -> ((Number) stat.get("count")).intValue())
                .sum());

        return result;
    }

    public List<Ticket> getOverdueTickets() {
        return ticketRepository.findOverdueTickets(new Date());
    }

    public List<Ticket> searchTickets(String keyword, String projectId) {
        Query query = new Query();

        Criteria criteria = new Criteria();
        List<Criteria> orCriteria = new ArrayList<>();

        orCriteria.add(Criteria.where("title").regex(keyword, "i"));
        orCriteria.add(Criteria.where("description").regex(keyword, "i"));

        criteria.orOperator(orCriteria.toArray(new Criteria[0]));

        if (projectId != null && !projectId.isEmpty()) {
            criteria.and("projectId").is(projectId);
        }

        query.addCriteria(criteria);
        query.with(org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));

        return mongoTemplate.find(query, Ticket.class);
    }

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

    public Ticket updateTicketStatus(String ticketId, String status, String userId) {
        return ticketRepository.findById(ticketId).map(ticket -> {
            boolean hasPermission = ticket.getCreatorId().equals(userId) ||
                    (ticket.getAssigneeIds() != null && ticket.getAssigneeIds().contains(userId));

            if (!hasPermission) {
                projectService.getProjectById(ticket.getProjectId()).ifPresent(project -> {
                    if (!project.getOwnerId().equals(userId) && !project.getAdminIds().contains(userId)) {
                        throw new RuntimeException("Permission refusée");
                    }
                });
            }

            if (!Arrays.asList("TODO", "IN_PROGRESS", "IN_VALIDATION", "DONE").contains(status)) {
                throw new RuntimeException("Statut invalide");
            }

            ticket.setStatus(status);
            ticket.setUpdatedAt(new Date());
            return ticketRepository.save(ticket);
        }).orElseThrow(() -> new RuntimeException("Ticket non trouvé"));
    }

    public Map<String, Long> getTicketCounts(String userId) {
        Map<String, Long> counts = new HashMap<>();

        counts.put("created", ticketRepository.countByCreatorId(userId));
        counts.put("assigned", ticketRepository.countByAssigneeIdsContaining(userId));
        counts.put("total", counts.get("created") + counts.get("assigned"));

        return counts;
    }

    public List<Ticket> getRecentTickets(int limit) {
        Query query = new Query();
        query.with(org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        query.limit(limit);

        return mongoTemplate.find(query, Ticket.class);
    }

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
                    return diff / (1000.0 * 60 * 60 * 24);
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

    public boolean hasAccessToTicket(String ticketId, String userId) {
        Optional<Ticket> ticketOpt = ticketRepository.findById(ticketId);
        if (ticketOpt.isEmpty()) {
            return false;
        }

        Ticket ticket = ticketOpt.get();

        if (ticket.getCreatorId().equals(userId)) {
            return true;
        }

        if (ticket.getAssigneeIds() != null && ticket.getAssigneeIds().contains(userId)) {
            return true;
        }

        Optional<Project> projectOpt = projectService.getProjectById(ticket.getProjectId());
        return projectOpt.map(project ->
                project.getOwnerId().equals(userId) ||
                        project.getAdminIds().contains(userId) ||
                        project.getTeamIds().contains(userId)
        ).orElse(false);
    }
}
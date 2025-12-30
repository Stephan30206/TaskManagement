package org.example.backend.service;

import org.example.backend.model.Comment;
import org.example.backend.model.Ticket;
import org.example.backend.model.User;
import org.example.backend.repository.CommentRepository;
import org.example.backend.repository.TicketRepository;
import org.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class CommentService {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private MongoTemplate mongoTemplate;

    public static class CommentWithAuthor {
        private Comment comment;
        private String authorName;
        private String authorEmail;
        private String authorId;

        public CommentWithAuthor(Comment comment, String authorName, String authorEmail, String authorId) {
            this.comment = comment;
            this.authorName = authorName;
            this.authorEmail = authorEmail;
            this.authorId = authorId;
        }

        public Comment getComment() { return comment; }
        public String getAuthorName() { return authorName; }
        public String getAuthorEmail() { return authorEmail; }
        public String getAuthorId() { return authorId; }
    }

    public static class CommentStats {
        private String date;
        private int commentCount;
        private int uniqueUsers;

        public CommentStats(String date, int commentCount, int uniqueUsers) {
            this.date = date;
            this.commentCount = commentCount;
            this.uniqueUsers = uniqueUsers;
        }

        public String getDate() { return date; }
        public int getCommentCount() { return commentCount; }
        public int getUniqueUsers() { return uniqueUsers; }
    }

    public Comment createComment(Comment comment, String authorId) {
        Ticket ticket = ticketRepository.findById(comment.getTicketId())
                .orElseThrow(() -> new RuntimeException("Ticket non trouvé"));

        projectService.getProjectById(ticket.getProjectId()).ifPresent(project -> {
            boolean hasAccess = project.getOwnerId().equals(authorId) ||
                    project.getAdminIds().contains(authorId) ||
                    project.getTeamIds().contains(authorId) ||
                    ticket.getCreatorId().equals(authorId) ||
                    (ticket.getAssigneeIds() != null && ticket.getAssigneeIds().contains(authorId));

            if (!hasAccess) {
                throw new RuntimeException("Accès refusé au ticket");
            }
        });

        comment.setAuthorId(authorId);
        comment.setCreatedAt(new Date());
        comment.setUpdatedAt(new Date());

        return commentRepository.save(comment);
    }

    public List<Comment> getCommentsByTicketId(String ticketId, String userId) {
        if (!hasAccessToTicket(ticketId, userId)) {
            throw new RuntimeException("Accès refusé au ticket");
        }

        return commentRepository.findByTicketIdOrderByCreatedAtDesc(ticketId);
    }

    public List<CommentWithAuthor> getCommentsWithAuthorInfo(String ticketId, String userId) {
        if (!hasAccessToTicket(ticketId, userId)) {
            throw new RuntimeException("Accès refusé au ticket");
        }

        List<Comment> comments = commentRepository.findByTicketIdOrderByCreatedAtDesc(ticketId);

        return comments.stream().map(comment -> {
            User author = userRepository.findById(comment.getAuthorId())
                    .orElse(new User());

            return new CommentWithAuthor(
                    comment,
                    author.getFirstName() + " " + author.getLastName(),
                    author.getEmail(),
                    author.getId()
            );
        }).collect(Collectors.toList());
    }

    public Optional<Comment> getCommentById(String commentId) {
        return commentRepository.findById(commentId);
    }

    public Comment updateComment(String commentId, String newContent, String userId) {
        return commentRepository.findById(commentId)
                .map(existingComment -> {
                    if (!existingComment.getAuthorId().equals(userId)) {
                        throw new RuntimeException("Seul l'auteur peut modifier le commentaire");
                    }

                    ticketRepository.findById(existingComment.getTicketId())
                            .ifPresent(ticket -> {
                                if ("DONE".equals(ticket.getStatus())) {
                                    throw new RuntimeException("Impossible de modifier un commentaire sur un ticket terminé");
                                }
                            });

                    existingComment.setContent(newContent);
                    existingComment.setUpdatedAt(new Date());

                    return commentRepository.save(existingComment);
                })
                .orElseThrow(() -> new RuntimeException("Commentaire non trouvé"));
    }

    @Transactional
    public void deleteComment(String commentId, String userId) {
        commentRepository.findById(commentId).ifPresent(comment -> {
            if (!hasCommentPermission(comment, userId)) {
                throw new RuntimeException("Permission refusée pour supprimer ce commentaire");
            }

            commentRepository.deleteById(commentId);
        });
    }

    @Transactional
    public void deleteCommentsByTicketId(String ticketId, String userId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket non trouvé"));

        projectService.getProjectById(ticket.getProjectId()).ifPresent(project -> {
            boolean canDelete = ticket.getCreatorId().equals(userId) ||
                    project.getOwnerId().equals(userId) ||
                    project.getAdminIds().contains(userId);

            if (!canDelete) {
                throw new RuntimeException("Permission refusée");
            }
        });

        commentRepository.deleteByTicketId(ticketId);
    }

    public List<Comment> searchCommentsInTicket(String ticketId, String keyword, String userId) { // ✅ Ajout du paramètre userId
        if (!hasAccessToTicket(ticketId, userId)) {
            throw new RuntimeException("Accès refusé au ticket");
        }

        Query query = new Query();
        query.addCriteria(Criteria.where("ticketId").is(ticketId)
                .and("content").regex(keyword, "i"));
        query.with(org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));

        return mongoTemplate.find(query, Comment.class);
    }

    public long countCommentsByTicketId(String ticketId) {
        return commentRepository.countByTicketId(ticketId);
    }

    public List<Comment> getRecentCommentsByProject(String projectId, int limit, String userId) { // ✅ Ajout du paramètre userId
        projectService.getProjectById(projectId).ifPresent(project -> {
            if (!hasAccessToProject(project, userId)) {
                throw new RuntimeException("Accès refusé au projet");
            }
        });

        List<Ticket> projectTickets = ticketRepository.findByProjectId(projectId);
        List<String> ticketIds = projectTickets.stream()
                .map(Ticket::getId)
                .collect(Collectors.toList());

        if (ticketIds.isEmpty()) {
            return List.of();
        }

        Query query = new Query(Criteria.where("ticketId").in(ticketIds));
        query.limit(limit);
        query.with(org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));

        return mongoTemplate.find(query, Comment.class);
    }

    public List<Comment> getCommentsByUser(String userId, int limit) {
        Query query = new Query(Criteria.where("authorId").is(userId));
        query.limit(limit);
        query.with(org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));

        return mongoTemplate.find(query, Comment.class);
    }

    public List<CommentStats> getCommentStats(Date startDate, String userId) {
        Query query = new Query(Criteria.where("createdAt").gte(startDate));

        if (userId != null) {
            query.addCriteria(Criteria.where("authorId").is(userId));
        }

        List<Comment> comments = mongoTemplate.find(query, Comment.class);

        Map<String, List<Comment>> commentsByDate = comments.stream()
                .collect(Collectors.groupingBy(comment -> {
                    Date date = comment.getCreatedAt();
                    return new java.sql.Date(date.getTime()).toLocalDate().toString();
                }));

        return commentsByDate.entrySet().stream()
                .map(entry -> {
                    String date = entry.getKey();
                    List<Comment> dateComments = entry.getValue();
                    int uniqueUsers = (int) dateComments.stream()
                            .map(Comment::getAuthorId)
                            .distinct()
                            .count();

                    return new CommentStats(date, dateComments.size(), uniqueUsers);
                })
                .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
                .collect(Collectors.toList());
    }

    private boolean hasAccessToTicket(String ticketId, String userId) {
        Optional<Ticket> ticketOpt = ticketRepository.findById(ticketId);
        if (ticketOpt.isEmpty()) {
            return false;
        }

        Ticket ticket = ticketOpt.get();
        return hasAccessToTicket(ticket, userId);
    }

    private boolean hasAccessToTicket(Ticket ticket, String userId) {
        if (ticket.getCreatorId().equals(userId)) {
            return true;
        }

        if (ticket.getAssigneeIds() != null && ticket.getAssigneeIds().contains(userId)) {
            return true;
        }

        return projectService.getProjectById(ticket.getProjectId())
                .map(project -> hasAccessToProject(project, userId))
                .orElse(false);
    }

    private boolean hasAccessToProject(org.example.backend.model.Project project, String userId) {
        return project.getOwnerId().equals(userId) ||
                (project.getAdminIds() != null && project.getAdminIds().contains(userId)) ||
                (project.getTeamIds() != null && project.getTeamIds().contains(userId));
    }

    private boolean hasCommentPermission(Comment comment, String userId) {
        if (comment.getAuthorId().equals(userId)) {
            return true;
        }

        Optional<Ticket> ticketOpt = ticketRepository.findById(comment.getTicketId());
        if (ticketOpt.isEmpty()) {
            return false;
        }

        Ticket ticket = ticketOpt.get();

        return projectService.getProjectById(ticket.getProjectId())
                .map(project -> {
                    return project.getOwnerId().equals(userId) ||
                            project.getAdminIds().contains(userId) ||
                            ticket.getCreatorId().equals(userId);
                })
                .orElse(false);
    }

    @Transactional
    public void transferUserComments(String oldUserId, String newUserId, String currentUserId) {

        Query query = new Query(Criteria.where("authorId").is(oldUserId));
        Update update = new Update().set("authorId", newUserId);

        mongoTemplate.updateMulti(query, update, Comment.class);
    }

    @Transactional
    public void updateAllCommentsTimestamp(String ticketId, String userId) {
        if (!hasAccessToTicket(ticketId, userId)) {
            throw new RuntimeException("Accès refusé");
        }

        Query query = new Query(Criteria.where("ticketId").is(ticketId));
        Update update = new Update().set("updatedAt", new Date());

        mongoTemplate.updateMulti(query, update, Comment.class);
    }

    public long countAllComments() {
        return commentRepository.count();
    }

    public List<Comment> getLatestComments(int limit) {
        Query query = new Query();
        query.with(org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        query.limit(limit);

        return mongoTemplate.find(query, Comment.class);
    }

    public List<Comment> searchComments(String keyword, String userId) {
        Query query = new Query();
        query.addCriteria(Criteria.where("content").regex(keyword, "i"));
        query.with(org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));

        List<Comment> allComments = mongoTemplate.find(query, Comment.class);

        return allComments.stream()
                .filter(comment -> hasCommentPermission(comment, userId))
                .collect(Collectors.toList());
    }

    public List<Comment> getLatestCommentsByUser(String userId, int limit) {
        Query query = new Query(Criteria.where("authorId").is(userId));
        query.with(org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        query.limit(limit);

        return mongoTemplate.find(query, Comment.class);
    }

    public long countCommentsByUser(String userId) {
        Query query = new Query(Criteria.where("authorId").is(userId));
        return mongoTemplate.count(query, Comment.class);
    }
}
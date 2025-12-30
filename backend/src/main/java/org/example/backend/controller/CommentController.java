package org.example.backend.controller;

import org.example.backend.model.Comment;
import org.example.backend.model.User;
import org.example.backend.service.CommentService;
import org.example.backend.service.CommentService.CommentWithAuthor;
import org.example.backend.service.CommentService.CommentStats;
import jakarta.validation.Valid;
import org.example.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/comments")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class CommentController {

    @Autowired
    private CommentService commentService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createComment(@Valid @RequestBody Comment comment) {
        String authorId = getCurrentUserId();
        comment.setAuthorId(authorId);

        Comment createdComment = commentService.createComment(comment, authorId);

        // ✅ Enrichir avec l'auteur pour la réponse
        Map<String, Object> response = enrichCommentWithAuthor(createdComment);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<List<Comment>> getCommentsByTicket(@PathVariable String ticketId) {
        String userId = getCurrentUserId();
        List<Comment> comments = commentService.getCommentsByTicketId(ticketId, userId);
        return ResponseEntity.ok(comments);
    }

    // ✅ ENDPOINT PRINCIPAL POUR LE FRONTEND - Retourne les commentaires avec auteurs
    @GetMapping("/ticket/{ticketId}/with-authors")
    public ResponseEntity<List<Map<String, Object>>> getCommentsWithAuthors(@PathVariable String ticketId) {
        String userId = getCurrentUserId();

        // Récupérer les commentaires
        List<Comment> comments = commentService.getCommentsByTicketId(ticketId, userId);

        // ✅ Enrichir chaque commentaire avec les données de l'auteur
        List<Map<String, Object>> enrichedComments = new ArrayList<>();
        for (Comment comment : comments) {
            enrichedComments.add(enrichCommentWithAuthor(comment));
        }

        return ResponseEntity.ok(enrichedComments);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Comment> getCommentById(@PathVariable String id) {
        return commentService.getCommentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateComment(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {

        String newContent = request.get("content");
        if (newContent == null || newContent.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        String userId = getCurrentUserId();
        Comment updatedComment = commentService.updateComment(id, newContent, userId);

        // ✅ Enrichir avec l'auteur
        Map<String, Object> response = enrichCommentWithAuthor(updatedComment);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable String id) {
        String userId = getCurrentUserId();

        try {
            commentService.deleteComment(id, userId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/ticket/{ticketId}")
    public ResponseEntity<Void> deleteCommentsByTicket(@PathVariable String ticketId) {
        String userId = getCurrentUserId();

        try {
            commentService.deleteCommentsByTicketId(ticketId, userId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/ticket/{ticketId}/search")
    public ResponseEntity<List<Comment>> searchComments(
            @PathVariable String ticketId,
            @RequestParam String keyword) {

        String userId = getCurrentUserId();
        List<Comment> comments = commentService.searchCommentsInTicket(ticketId, keyword, userId);
        return ResponseEntity.ok(comments);
    }

    @GetMapping("/ticket/{ticketId}/count")
    public ResponseEntity<Long> countComments(@PathVariable String ticketId) {
        long count = commentService.countCommentsByTicketId(ticketId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/project/{projectId}/recent")
    public ResponseEntity<List<Comment>> getRecentProjectComments(
            @PathVariable String projectId,
            @RequestParam(defaultValue = "20") int limit) {

        String userId = getCurrentUserId();
        List<Comment> comments = commentService.getRecentCommentsByProject(projectId, limit, userId);
        return ResponseEntity.ok(comments);
    }

    @GetMapping("/stats")
    public ResponseEntity<List<CommentStats>> getCommentStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date startDate) {

        String userId = getCurrentUserId();
        List<CommentStats> stats = commentService.getCommentStats(startDate, userId);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Comment>> getUserComments(
            @PathVariable String userId,
            @RequestParam(defaultValue = "50") int limit) {
        List<Comment> comments = commentService.getCommentsByUser(userId, limit);
        return ResponseEntity.ok(comments);
    }

    @GetMapping("/search")
    public ResponseEntity<List<Comment>> searchAllComments(@RequestParam String keyword) {
        String userId = getCurrentUserId();
        List<Comment> comments = commentService.searchComments(keyword, userId);
        return ResponseEntity.ok(comments);
    }

    @GetMapping("/me/recent")
    public ResponseEntity<List<Comment>> getMyRecentComments(
            @RequestParam(defaultValue = "20") int limit) {

        String userId = getCurrentUserId();
        List<Comment> comments = commentService.getLatestCommentsByUser(userId, limit);
        return ResponseEntity.ok(comments);
    }

    @GetMapping("/me/count")
    public ResponseEntity<Long> countMyComments() {
        String userId = getCurrentUserId();
        long count = commentService.countCommentsByUser(userId);
        return ResponseEntity.ok(count);
    }

    // ✅ MÉTHODE UTILITAIRE : Enrichir un commentaire avec les données de l'auteur
    private Map<String, Object> enrichCommentWithAuthor(Comment comment) {
        Map<String, Object> result = new HashMap<>();

        // Données du commentaire
        result.put("id", comment.getId());
        result.put("content", comment.getContent());
        result.put("ticketId", comment.getTicketId());
        result.put("authorId", comment.getAuthorId());
        result.put("createdAt", comment.getCreatedAt());
        result.put("updatedAt", comment.getUpdatedAt());

        // ✅ Ajouter les données de l'auteur
        if (comment.getAuthorId() != null) {
            userService.getUserById(comment.getAuthorId()).ifPresent(author -> {
                Map<String, Object> authorMap = new HashMap<>();
                authorMap.put("id", author.getId());
                authorMap.put("firstName", author.getFirstName());
                authorMap.put("lastName", author.getLastName());
                authorMap.put("email", author.getEmail());
                result.put("author", authorMap);
            });
        }

        return result;
    }

    /**
     * Méthode helper pour obtenir l'ID de l'utilisateur courant
     */
    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            throw new RuntimeException("Utilisateur non authentifié");
        }

        String email = auth.getName();

        return userService.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"))
                .getId();
    }
}
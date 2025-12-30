package org.example.backend.controller;

import org.example.backend.model.Ticket;
import org.example.backend.model.User;
import org.example.backend.service.TicketService;
import jakarta.validation.Valid;
import org.example.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/tickets")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class TicketController {

    @Autowired
    private TicketService ticketService;

    @Autowired
    private UserService userService;

    // ✅ Méthode utilitaire pour récupérer l'ID utilisateur
    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userService.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"))
                .getId();
    }

    @PostMapping
    public ResponseEntity<Ticket> createTicket(@Valid @RequestBody Ticket ticket) {
        String creatorId = getCurrentUserId();
        Ticket createdTicket = ticketService.createTicket(ticket, creatorId);

        // ✅ Enrichir avec les données du créateur
        enrichTicketWithDetails(createdTicket);

        return ResponseEntity.ok(createdTicket);
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<Ticket>> getTicketsByProject(@PathVariable String projectId) {
        List<Ticket> tickets = ticketService.getTicketsByProject(projectId);

        // ✅ Enrichir tous les tickets avec les détails
        tickets.forEach(this::enrichTicketWithDetails);

        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicketById(@PathVariable String id) {
        return ticketService.getTicketById(id)
                .map(ticket -> {
                    // ✅ Enrichir avec créateur et assignés
                    enrichTicketWithDetails(ticket);
                    return ResponseEntity.ok(ticket);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/my-tickets")
    public ResponseEntity<List<Ticket>> getUserTickets() {
        String userId = getCurrentUserId();
        List<Ticket> tickets = ticketService.getTicketsForUser(userId);

        tickets.forEach(this::enrichTicketWithDetails);

        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/assigned")
    public ResponseEntity<List<Ticket>> getAssignedTickets() {
        String userId = getCurrentUserId();
        List<Ticket> tickets = ticketService.getTicketsAssignedToUser(userId);

        tickets.forEach(this::enrichTicketWithDetails);

        return ResponseEntity.ok(tickets);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Ticket> updateTicket(
            @PathVariable String id,
            @Valid @RequestBody Ticket ticketDetails) {
        try {
            String userId = getCurrentUserId();
            Ticket updatedTicket = ticketService.updateTicket(id, ticketDetails, userId);

            // ✅ Enrichir le ticket mis à jour
            enrichTicketWithDetails(updatedTicket);

            return ResponseEntity.ok(updatedTicket);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(@PathVariable String id) {
        try {
            String userId = getCurrentUserId();
            ticketService.deleteTicket(id, userId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/assign")
    public ResponseEntity<Ticket> assignTicket(
            @PathVariable String id,
            @RequestBody List<String> assigneeIds) {
        try {
            String userId = getCurrentUserId();

            System.out.println("Assignation du ticket " + id + " par l'utilisateur " + userId);
            System.out.println("Assignés: " + assigneeIds);

            Ticket updatedTicket = ticketService.assignTicket(id, assigneeIds, userId);

            enrichTicketWithDetails(updatedTicket);

            return ResponseEntity.ok(updatedTicket);
        } catch (RuntimeException e) {
            System.err.println("Erreur lors de l'assignation: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Ticket> updateTicketStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        try {
            String userId = getCurrentUserId();
            String status = request.get("status");

            Ticket ticket = ticketService.getTicketById(id)
                    .orElseThrow(() -> new RuntimeException("Ticket non trouvé"));

            ticket.setStatus(status);
            Ticket updatedTicket = ticketService.updateTicket(id, ticket, userId);

            enrichTicketWithDetails(updatedTicket);

            return ResponseEntity.ok(updatedTicket);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<Ticket>> getOverdueTickets() {
        List<Ticket> tickets = ticketService.getOverdueTickets();

        tickets.forEach(this::enrichTicketWithDetails);

        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/project/{projectId}/stats")
    public ResponseEntity<Map<String, Object>> getTicketStats(@PathVariable String projectId) {
        Map<String, Object> stats = ticketService.getTicketStatsByProject(projectId);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/search")
    public ResponseEntity<List<Ticket>> searchTickets(
            @RequestParam String keyword,
            @RequestParam(required = false) String projectId) {
        List<Ticket> tickets = ticketService.searchTickets(keyword, projectId);

        tickets.forEach(this::enrichTicketWithDetails);

        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/filter")
    public ResponseEntity<List<Ticket>> filterTickets(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) String assigneeId) {
        List<Ticket> tickets = ticketService.filterTickets(status, projectId, assigneeId);

        tickets.forEach(this::enrichTicketWithDetails);

        return ResponseEntity.ok(tickets);
    }

    // ✅ MÉTHODE UTILITAIRE POUR ENRICHIR LES TICKETS
    private void enrichTicketWithDetails(Ticket ticket) {
        // Enrichir avec le créateur
        if (ticket.getCreatorId() != null) {
            userService.getUserById(ticket.getCreatorId()).ifPresent(ticket::setCreator);
        }

        // Enrichir avec les assignés
        if (ticket.getAssigneeIds() != null && !ticket.getAssigneeIds().isEmpty()) {
            List<User> assignees = ticket.getAssigneeIds().stream()
                    .map(assigneeId -> userService.getUserById(assigneeId).orElse(null))
                    .filter(user -> user != null)
                    .collect(Collectors.toList());
            ticket.setAssignees(assignees);
        }
    }
}
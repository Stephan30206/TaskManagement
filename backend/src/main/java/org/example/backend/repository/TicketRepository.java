package org.example.backend.repository;

import org.example.backend.model.Ticket;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Date;
import java.util.List;

@Repository
public interface TicketRepository extends MongoRepository<Ticket, String> {

    // MongoDB Shell: db.tickets.find({projectId: ObjectId("...")})
    List<Ticket> findByProjectId(String projectId);

    // MongoDB Shell: db.tickets.find({creatorId: ObjectId("...")})
    List<Ticket> findByCreatorId(String creatorId);

    // MongoDB Shell: db.tickets.find({assigneeIds: ObjectId("...")})
    List<Ticket> findByAssigneeIdsContaining(String assigneeId);

    // Recherche par statut
    List<Ticket> findByStatus(String status);

    // Tickets en retard
    @Query("{'estimatedDate': {$lt: ?0}, 'status': {$ne: 'DONE'}}")
    List<Ticket> findOverdueTickets(Date currentDate);

    // Tickets pour un projet avec statut spécifique
    List<Ticket> findByProjectIdAndStatus(String projectId, String status);

    // Recherche textuelle
    @Query("{'$text': {'$search': ?0}}")
    List<Ticket> searchByText(String keyword);

    // Agrégation simple: Compter les tickets par statut
    @Query(value = "{}", fields = "{status: 1}")
    List<Ticket> findAllStatuses();

    @Query("{'creatorId': ?0}")
    long countByCreatorId(String creatorId);

    // ✅ Compte les tickets où un utilisateur est dans la liste des assignés
    @Query("{'assigneeIds': ?0}")
    long countByAssigneeIdsContaining(String assigneeId);
}

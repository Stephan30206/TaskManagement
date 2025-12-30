package org.example.backend.repository;

import org.example.backend.model.Ticket;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Date;
import java.util.List;

@Repository
public interface TicketRepository extends MongoRepository<Ticket, String> {

    List<Ticket> findByProjectId(String projectId);
    List<Ticket> findByCreatorId(String creatorId);
    List<Ticket> findByAssigneeIdsContaining(String assigneeId);
    List<Ticket> findByStatus(String status);

    @Query("{'estimatedDate': {$lt: ?0}, 'status': {$ne: 'DONE'}}")
    List<Ticket> findOverdueTickets(Date currentDate);

    List<Ticket> findByProjectIdAndStatus(String projectId, String status);

    @Query("{'$text': {'$search': ?0}}")
    List<Ticket> searchByText(String keyword);

    @Query(value = "{}", fields = "{status: 1}")
    List<Ticket> findAllStatuses();

    @Query("{'creatorId': ?0}")
    long countByCreatorId(String creatorId);

    @Query("{'assigneeIds': ?0}")
    long countByAssigneeIdsContaining(String assigneeId);
}

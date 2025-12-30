package org.example.backend.repository;

import org.example.backend.model.Checklist;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChecklistRepository extends MongoRepository<Checklist, String> {

    List<Checklist> findByTicketId(String ticketId);

    List<Checklist> findByTicketIdAndActive(String ticketId, boolean active);

    List<Checklist> findByCreatedBy(String createdBy);

    long countByTicketId(String ticketId);

    void deleteByTicketId(String ticketId);

    List<Checklist> findByTicketIdOrderByCreatedAtDesc(String ticketId);
}

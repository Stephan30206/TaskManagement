package org.example.backend.repository;

import org.example.backend.model.TicketLabel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketLabelRepository extends MongoRepository<TicketLabel, String> {

    List<TicketLabel> findByProjectId(String projectId);

    List<TicketLabel> findByProjectIdAndActive(String projectId, boolean active);

    Optional<TicketLabel> findByProjectIdAndName(String projectId, String name);

    List<TicketLabel> findByProjectIdAndNameContainingIgnoreCase(String projectId, String name);

    List<TicketLabel> findByCreatedBy(String createdBy);

    long countByProjectId(String projectId);

    List<TicketLabel> findByProjectIdOrderByCreatedAtDesc(String projectId);
}

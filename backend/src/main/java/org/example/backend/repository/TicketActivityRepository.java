package org.example.backend.repository;

import org.example.backend.model.TicketActivity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface TicketActivityRepository extends MongoRepository<TicketActivity, String> {

    List<TicketActivity> findByTicketId(String ticketId);

    List<TicketActivity> findByTicketIdOrderByCreatedAtDesc(String ticketId);

    List<TicketActivity> findByProjectId(String projectId);

    List<TicketActivity> findByProjectIdOrderByCreatedAtDesc(String projectId);

    List<TicketActivity> findByActionBy(String userId);

    List<TicketActivity> findByAction(String action);

    List<TicketActivity> findByTicketIdAndAction(String ticketId, String action);

    @Query("{ 'ticketId': ?0, 'createdAt': { $gte: ?1, $lte: ?2 } }")
    List<TicketActivity> findByTicketIdAndDateRange(String ticketId, Date startDate, Date endDate);

    @Query("{ 'projectId': ?0, 'createdAt': { $gte: ?1 } }")
    List<TicketActivity> findRecentActivities(String projectId, Date since);

    long countByTicketId(String ticketId);

    void deleteByTicketId(String ticketId);
}

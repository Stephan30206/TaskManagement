package org.example.backend.repository;

import org.example.backend.model.AuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {

    List<AuditLog> findByProjectId(String projectId);

    List<AuditLog> findByProjectIdOrderByCreatedAtDesc(String projectId);

    List<AuditLog> findByEntityId(String entityId);

    List<AuditLog> findByEntityIdOrderByCreatedAtDesc(String entityId);

    List<AuditLog> findByUserId(String userId);

    List<AuditLog> findByUserIdOrderByCreatedAtDesc(String userId);

    List<AuditLog> findByAction(String action);

    List<AuditLog> findByEntityType(String entityType);

    @Query("{ 'projectId': ?0, 'createdAt': { $gte: ?1, $lte: ?2 } }")
    List<AuditLog> findByProjectIdAndDateRange(String projectId, Date startDate, Date endDate);

    @Query("{ 'projectId': ?0, 'entityType': ?1, 'createdAt': { $gte: ?2, $lte: ?3 }, 'deletedByAdmin': false }")
    List<AuditLog> findActiveAuditsByProjectAndEntityType(String projectId, String entityType, Date startDate, Date endDate);

    @Query("{ 'deletedByAdmin': false }")
    List<AuditLog> findAllActive();

    long countByProjectId(String projectId);

    long countByUserId(String userId);

    long countByAction(String action);
}

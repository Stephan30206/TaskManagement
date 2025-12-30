package org.example.backend.repository;

import org.example.backend.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {

    List<Notification> findByRecipientId(String recipientId);

    List<Notification> findByRecipientIdOrderByCreatedAtDesc(String recipientId);

    List<Notification> findByRecipientIdAndIsReadFalse(String recipientId);

    List<Notification> findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(String recipientId);

    List<Notification> findByRecipientIdAndDismissedFalse(String recipientId);

    List<Notification> findByRecipientIdAndProjectId(String recipientId, String projectId);

    List<Notification> findByEntityIdAndEntityType(String entityId, String entityType);

    long countByRecipientIdAndIsReadFalse(String recipientId);

    long countByRecipientId(String recipientId);

    List<Notification> findByRecipientIdAndCreatedAtGreaterThan(String recipientId, Date since);

    List<Notification> findBySenderId(String senderId);

    void deleteByRecipientIdAndCreatedAtBefore(String recipientId, Date before);
}

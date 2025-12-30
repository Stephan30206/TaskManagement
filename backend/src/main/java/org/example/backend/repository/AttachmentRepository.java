package org.example.backend.repository;

import org.example.backend.model.Attachment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttachmentRepository extends MongoRepository<Attachment, String> {

    // Tous les fichiers (y compris supprimés)
    List<Attachment> findByTicketId(String ticketId);

    // ✅ Fichiers NON supprimés (soft delete)
    List<Attachment> findByTicketIdAndDeletedFalse(String ticketId);

    List<Attachment> findByCommentIdAndDeletedFalse(String commentId);

    List<Attachment> findByUploadedByAndDeletedFalse(String uploadedBy);

    long countByTicketId(String ticketId);

    List<Attachment> findByTicketIdAndDeletedFalseOrderByUploadedAtDesc(String ticketId);

    // ⚠️ ATTENTION : suppression physique (à éviter en prod)
    void deleteByTicketId(String ticketId);
}


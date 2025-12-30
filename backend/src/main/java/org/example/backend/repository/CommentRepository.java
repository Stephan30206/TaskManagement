package org.example.backend.repository;

import org.example.backend.model.Comment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommentRepository extends MongoRepository<Comment, String> {

    // MongoDB Shell: db.comments.find({ticketId: ObjectId("...")})
    List<Comment> findByTicketId(String ticketId);

    // MongoDB Shell: db.comments.find({authorId: ObjectId("...")})
    List<Comment> findByAuthorId(String authorId);

    // MongoDB Shell: db.comments.find({ticketId: ObjectId("...")}).sort({createdAt: -1})
    List<Comment> findByTicketIdOrderByCreatedAtDesc(String ticketId);

    // Suppression des commentaires d'un ticket
    void deleteByTicketId(String ticketId);

    // Nombre de commentaires par ticket
    long countByTicketId(String ticketId);
}
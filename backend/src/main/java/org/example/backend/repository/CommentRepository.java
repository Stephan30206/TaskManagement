package org.example.backend.repository;

import org.example.backend.model.Comment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommentRepository extends MongoRepository<Comment, String> {
    List<Comment> findByTicketId(String ticketId);
    List<Comment> findByAuthorId(String authorId);
    List<Comment> findByTicketIdOrderByCreatedAtDesc(String ticketId);
    void deleteByTicketId(String ticketId);
    long countByTicketId(String ticketId);
}
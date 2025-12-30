package org.example.backend.repository;

import org.example.backend.model.Project;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProjectRepository extends MongoRepository<Project, String> {

    List<Project> findByOwnerId(String ownerId);
    List<Project> findByAdminIdsContaining(String adminId);
    List<Project> findByTeamIdsContaining(String teamId);

    List<Project> findByStatus(String status);

    @Query("{$or: ["
            + "{'name': {$regex: ?0, $options: 'i'}}, "
            + "{'description': {$regex: ?1, $options: 'i'}}"
            + "]}")
    List<Project> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String nameKeyword, String descriptionKeyword);

    @Query("{'$text': {'$search': ?0}}")
    List<Project> searchByText(String keyword);

    @Query("{'ownerId': ?0, 'status': {$in: [?1, ?2]}}")
    List<Project> findByOwnerAndStatusIn(String ownerId, String status1, String status2);

    long countByOwnerId(String ownerId);
}

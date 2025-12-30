package org.example.backend.repository;

import org.example.backend.model.Project;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProjectRepository extends MongoRepository<Project, String> {

    // MongoDB Shell: db.projects.find({ownerId: ObjectId("...")})
    List<Project> findByOwnerId(String ownerId);

    // MongoDB Shell: db.projects.find({adminIds: ObjectId("...")})
    List<Project> findByAdminIdsContaining(String adminId);

    // MongoDB Shell: db.projects.find({teamIds: ObjectId("...")})
    List<Project> findByTeamIdsContaining(String teamId);

    // Recherche par statut
    List<Project> findByStatus(String status);

    @Query("{$or: ["
            + "{'name': {$regex: ?0, $options: 'i'}}, "
            + "{'description': {$regex: ?1, $options: 'i'}}"
            + "]}")
    List<Project> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String nameKeyword, String descriptionKeyword);

    // Recherche textuelle (nécessite un index text)
    @Query("{'$text': {'$search': ?0}}")
    List<Project> searchByText(String keyword);

    // Requête complexe avec plusieurs conditions
    @Query("{'ownerId': ?0, 'status': {$in: [?1, ?2]}}")
    List<Project> findByOwnerAndStatusIn(String ownerId, String status1, String status2);

    // Compter les projets par utilisateur
    long countByOwnerId(String ownerId);
}

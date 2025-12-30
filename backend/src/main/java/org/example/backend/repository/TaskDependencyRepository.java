package org.example.backend.repository;

import org.example.backend.model.TaskDependency;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskDependencyRepository extends MongoRepository<TaskDependency, String> {

    List<TaskDependency> findByDependentTicketId(String dependentTicketId);

    List<TaskDependency> findByDependsOnTicketId(String dependsOnTicketId);

    List<TaskDependency> findByProjectId(String projectId);

    List<TaskDependency> findByDependentTicketIdAndActive(String dependentTicketId, boolean active);

    List<TaskDependency> findByDependsOnTicketIdAndActive(String dependsOnTicketId, boolean active);

    Optional<TaskDependency> findByDependentTicketIdAndDependsOnTicketId(String dependentTicketId, String dependsOnTicketId);

    long countByDependentTicketId(String dependentTicketId);

    long countByDependsOnTicketId(String dependsOnTicketId);

    void deleteByDependentTicketIdAndDependsOnTicketId(String dependentTicketId, String dependsOnTicketId);

    List<TaskDependency> findByProjectIdAndActive(String projectId, boolean active);
}

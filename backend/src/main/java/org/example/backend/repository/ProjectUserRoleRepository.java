package org.example.backend.repository;

import org.example.backend.model.ProjectUserRole;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectUserRoleRepository extends MongoRepository<ProjectUserRole, String> {

    Optional<ProjectUserRole> findByProjectIdAndUserId(String projectId, String userId);

    List<ProjectUserRole> findByProjectId(String projectId);

    List<ProjectUserRole> findByProjectIdAndStatus(String projectId, String status);

    List<ProjectUserRole> findByUserId(String userId);

    List<ProjectUserRole> findByUserIdAndStatus(String userId, String status);

    List<ProjectUserRole> findByRole(String role);

    List<ProjectUserRole> findByProjectIdAndRole(String projectId, String role);

    long countByProjectIdAndRole(String projectId, String role);

    long countByProjectId(String projectId);

    void deleteByProjectIdAndUserId(String projectId, String userId);

    List<ProjectUserRole> findByProjectIdAndStatusOrderByJoinedAtAsc(String projectId, String status);
}

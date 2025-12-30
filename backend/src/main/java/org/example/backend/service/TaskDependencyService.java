package org.example.backend.service;

import org.example.backend.model.TaskDependency;
import org.example.backend.repository.TaskDependencyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class TaskDependencyService {

    @Autowired
    private TaskDependencyRepository taskDependencyRepository;

    /**
     * Create a dependency between two tickets
     */
    public TaskDependency createDependency(String dependentTicketId, String dependsOnTicketId, String projectId,
                                          String relationshipType, String createdBy) {
        // Check if dependency already exists
        Optional<TaskDependency> existing = taskDependencyRepository.findByDependentTicketIdAndDependsOnTicketId(
                dependentTicketId, dependsOnTicketId);

        if (existing.isPresent()) {
            throw new RuntimeException("Dependency already exists between these tickets");
        }

        TaskDependency dependency = new TaskDependency(dependentTicketId, dependsOnTicketId, projectId,
                relationshipType, createdBy);

        return taskDependencyRepository.save(dependency);
    }

    /**
     * Get dependency by ID
     */
    public Optional<TaskDependency> getDependencyById(String dependencyId) {
        return taskDependencyRepository.findById(dependencyId);
    }

    /**
     * Get all dependencies for a dependent ticket (what blocks this ticket)
     */
    public List<TaskDependency> getDependsOn(String ticketId) {
        return taskDependencyRepository.findByDependentTicketIdAndActive(ticketId, true);
    }

    /**
     * Get all tickets that depend on this ticket (what this ticket blocks)
     */
    public List<TaskDependency> getBlockedBy(String ticketId) {
        return taskDependencyRepository.findByDependsOnTicketIdAndActive(ticketId, true);
    }

    /**
     * Get all dependencies for a project
     */
    public List<TaskDependency> getProjectDependencies(String projectId) {
        return taskDependencyRepository.findByProjectIdAndActive(projectId, true);
    }

    /**
     * Update dependency
     */
    public TaskDependency updateDependency(String dependencyId, String relationshipType, String description) {
        Optional<TaskDependency> dependency = taskDependencyRepository.findById(dependencyId);

        if (dependency.isEmpty()) {
            throw new RuntimeException("Dependency not found");
        }

        TaskDependency existing = dependency.get();
        if (relationshipType != null) {
            existing.setRelationshipType(relationshipType);
        }
        if (description != null) {
            existing.setDescription(description);
        }
        existing.setUpdatedAt(new Date());

        return taskDependencyRepository.save(existing);
    }

    /**
     * Delete dependency (soft delete)
     */
    public void deleteDependency(String dependencyId) {
        Optional<TaskDependency> dependency = taskDependencyRepository.findById(dependencyId);

        if (dependency.isEmpty()) {
            throw new RuntimeException("Dependency not found");
        }

        TaskDependency existing = dependency.get();
        existing.setActive(false);
        existing.setUpdatedAt(new Date());

        taskDependencyRepository.save(existing);
    }

    /**
     * Delete dependency by tickets
     */
    public void deleteDependencyByTickets(String dependentTicketId, String dependsOnTicketId) {
        taskDependencyRepository.deleteByDependentTicketIdAndDependsOnTicketId(dependentTicketId, dependsOnTicketId);
    }

    /**
     * Check if ticket has blocking dependencies
     */
    public boolean hasBlockingDependencies(String ticketId) {
        List<TaskDependency> dependencies = getDependsOn(ticketId);
        return !dependencies.isEmpty();
    }

    /**
     * Check if ticket can be completed (no blocking dependencies)
     */
    public boolean canBeCompleted(String ticketId) {
        return !hasBlockingDependencies(ticketId);
    }

    /**
     * Detect circular dependencies
     */
    public boolean hasCircularDependency(String ticketId1, String ticketId2) {
        // Simple check: if ticket 2 depends on ticket 1, and we're trying to make ticket 1 depend on 2, it's circular
        Optional<TaskDependency> reverse = taskDependencyRepository.findByDependentTicketIdAndDependsOnTicketId(
                ticketId2, ticketId1);
        return reverse.isPresent();
    }

    /**
     * Get blocking reason for a ticket
     */
    public String getBlockingReason(String ticketId) {
        List<TaskDependency> blockers = getDependsOn(ticketId);
        if (blockers.isEmpty()) {
            return null;
        }
        StringBuilder reason = new StringBuilder("Blocked by: ");
        for (int i = 0; i < blockers.size(); i++) {
            reason.append(blockers.get(i).getDependsOnTicketId());
            if (i < blockers.size() - 1) {
                reason.append(", ");
            }
        }
        return reason.toString();
    }

    /**
     * Count dependencies for a ticket
     */
    public long countDependencies(String ticketId) {
        return taskDependencyRepository.countByDependentTicketId(ticketId);
    }

    /**
     * Count tickets depending on this ticket
     */
    public long countDependents(String ticketId) {
        return taskDependencyRepository.countByDependsOnTicketId(ticketId);
    }
}

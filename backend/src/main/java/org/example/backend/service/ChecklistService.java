package org.example.backend.service;

import org.example.backend.model.Checklist;
import org.example.backend.model.ChecklistItem;
import org.example.backend.repository.ChecklistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ChecklistService {

    @Autowired
    private ChecklistRepository checklistRepository;

    /**
     * Create a new checklist for a ticket
     */
    public Checklist createChecklist(String ticketId, String title, String description, String createdBy) {
        Checklist checklist = new Checklist(title, ticketId, createdBy);
        if (description != null) {
            checklist.setDescription(description);
        }
        return checklistRepository.save(checklist);
    }

    /**
     * Get checklist by ID
     */
    public Optional<Checklist> getChecklistById(String checklistId) {
        return checklistRepository.findById(checklistId);
    }

    /**
     * Get all checklists for a ticket
     */
    public List<Checklist> getTicketChecklists(String ticketId) {
        return checklistRepository.findByTicketIdAndActive(ticketId, true);
    }

    /**
     * Update checklist title/description
     */
    public Checklist updateChecklist(String checklistId, String title, String description) {
        Optional<Checklist> checklist = checklistRepository.findById(checklistId);

        if (checklist.isEmpty()) {
            throw new RuntimeException("Checklist not found");
        }

        Checklist existing = checklist.get();
        if (title != null && !title.isBlank()) {
            existing.setTitle(title);
        }
        if (description != null) {
            existing.setDescription(description);
        }
        existing.setUpdatedAt(new Date());

        return checklistRepository.save(existing);
    }

    /**
     * Delete checklist (soft delete)
     */
    public void deleteChecklist(String checklistId) {
        Optional<Checklist> checklist = checklistRepository.findById(checklistId);

        if (checklist.isEmpty()) {
            throw new RuntimeException("Checklist not found");
        }

        Checklist existing = checklist.get();
        existing.setActive(false);
        existing.setUpdatedAt(new Date());

        checklistRepository.save(existing);
    }

    /**
     * Add item to checklist
     */
    public Checklist addItem(String checklistId, String itemTitle, String description) {
        Optional<Checklist> checklist = checklistRepository.findById(checklistId);

        if (checklist.isEmpty()) {
            throw new RuntimeException("Checklist not found");
        }

        Checklist existing = checklist.get();
        ChecklistItem item = new ChecklistItem(UUID.randomUUID().toString(), itemTitle, existing.getItems().size());
        if (description != null) {
            item.setDescription(description);
        }

        existing.getItems().add(item);
        existing.setUpdatedAt(new Date());

        return checklistRepository.save(existing);
    }

    /**
     * Complete a checklist item
     */
    public Checklist completeItem(String checklistId, String itemId, String completedBy) {
        Optional<Checklist> checklist = checklistRepository.findById(checklistId);

        if (checklist.isEmpty()) {
            throw new RuntimeException("Checklist not found");
        }

        Checklist existing = checklist.get();
        for (ChecklistItem item : existing.getItems()) {
            if (item.getId().equals(itemId)) {
                item.setCompleted(true);
                item.setCompletedBy(completedBy);
                item.setCompletedAt(new Date());
                item.setUpdatedAt(new Date());
                break;
            }
        }

        existing.setUpdatedAt(new Date());
        return checklistRepository.save(existing);
    }

    /**
     * Uncomplete a checklist item
     */
    public Checklist uncompleteItem(String checklistId, String itemId) {
        Optional<Checklist> checklist = checklistRepository.findById(checklistId);

        if (checklist.isEmpty()) {
            throw new RuntimeException("Checklist not found");
        }

        Checklist existing = checklist.get();
        for (ChecklistItem item : existing.getItems()) {
            if (item.getId().equals(itemId)) {
                item.setCompleted(false);
                item.setCompletedBy(null);
                item.setCompletedAt(null);
                item.setUpdatedAt(new Date());
                break;
            }
        }

        existing.setUpdatedAt(new Date());
        return checklistRepository.save(existing);
    }

    /**
     * Update checklist item
     */
    public Checklist updateItem(String checklistId, String itemId, String title, String description) {
        Optional<Checklist> checklist = checklistRepository.findById(checklistId);

        if (checklist.isEmpty()) {
            throw new RuntimeException("Checklist not found");
        }

        Checklist existing = checklist.get();
        for (ChecklistItem item : existing.getItems()) {
            if (item.getId().equals(itemId)) {
                if (title != null && !title.isBlank()) {
                    item.setTitle(title);
                }
                if (description != null) {
                    item.setDescription(description);
                }
                item.setUpdatedAt(new Date());
                break;
            }
        }

        existing.setUpdatedAt(new Date());
        return checklistRepository.save(existing);
    }

    /**
     * Delete checklist item
     */
    public Checklist deleteItem(String checklistId, String itemId) {
        Optional<Checklist> checklist = checklistRepository.findById(checklistId);

        if (checklist.isEmpty()) {
            throw new RuntimeException("Checklist not found");
        }

        Checklist existing = checklist.get();
        existing.getItems().removeIf(item -> item.getId().equals(itemId));
        existing.setUpdatedAt(new Date());

        return checklistRepository.save(existing);
    }

    /**
     * Get progress percentage for a checklist
     */
    public double getProgress(String checklistId) {
        Optional<Checklist> checklist = checklistRepository.findById(checklistId);
        return checklist.map(Checklist::getProgress).orElse(0.0);
    }

    /**
     * Assign item to user
     */
    public Checklist assignItem(String checklistId, String itemId, String assignedTo) {
        Optional<Checklist> checklist = checklistRepository.findById(checklistId);

        if (checklist.isEmpty()) {
            throw new RuntimeException("Checklist not found");
        }

        Checklist existing = checklist.get();
        for (ChecklistItem item : existing.getItems()) {
            if (item.getId().equals(itemId)) {
                item.setAssignedTo(assignedTo);
                item.setUpdatedAt(new Date());
                break;
            }
        }

        existing.setUpdatedAt(new Date());
        return checklistRepository.save(existing);
    }

    /**
     * Check if checklist belongs to ticket
     */
    public boolean isChecklistInTicket(String checklistId, String ticketId) {
        Optional<Checklist> checklist = checklistRepository.findById(checklistId);
        return checklist.isPresent() && checklist.get().getTicketId().equals(ticketId) && checklist.get().isActive();
    }

    /**
     * Count checklists in ticket
     */
    public long countTicketChecklists(String ticketId) {
        return checklistRepository.countByTicketId(ticketId);
    }
}

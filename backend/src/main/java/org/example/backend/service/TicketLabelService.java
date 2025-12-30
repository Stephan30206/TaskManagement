package org.example.backend.service;

import org.example.backend.model.TicketLabel;
import org.example.backend.repository.TicketLabelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class TicketLabelService {

    @Autowired
    private TicketLabelRepository labelRepository;

    public TicketLabel createLabel(String projectId, String name, String color, String createdBy) {
        TicketLabel label = new TicketLabel(name, color, projectId, createdBy);
        return labelRepository.save(label);
    }

    public Optional<TicketLabel> getLabelById(String labelId) {
        return labelRepository.findById(labelId);
    }

    public List<TicketLabel> getProjectLabels(String projectId) {
        return labelRepository.findByProjectIdAndActive(projectId, true);
    }

    public Optional<TicketLabel> getLabelByName(String projectId, String name) {
        return labelRepository.findByProjectIdAndName(projectId, name);
    }

    public List<TicketLabel> searchLabels(String projectId, String searchTerm) {
        return labelRepository.findByProjectIdAndNameContainingIgnoreCase(projectId, searchTerm);
    }

    public TicketLabel updateLabel(String labelId, String name, String color, String description) {
        Optional<TicketLabel> label = labelRepository.findById(labelId);

        if (label.isEmpty()) {
            throw new RuntimeException("Label not found");
        }

        TicketLabel existing = label.get();
        if (name != null && !name.isBlank()) {
            existing.setName(name);
        }
        if (color != null && !color.isBlank()) {
            existing.setColor(color);
        }
        if (description != null) {
            existing.setDescription(description);
        }
        existing.setUpdatedAt(new Date());

        return labelRepository.save(existing);
    }

    public void deleteLabel(String labelId) {
        Optional<TicketLabel> label = labelRepository.findById(labelId);

        if (label.isEmpty()) {
            throw new RuntimeException("Label not found");
        }

        TicketLabel existing = label.get();
        existing.setActive(false);
        existing.setUpdatedAt(new Date());

        labelRepository.save(existing);
    }

    public TicketLabel restoreLabel(String labelId) {
        Optional<TicketLabel> label = labelRepository.findById(labelId);

        if (label.isEmpty()) {
            throw new RuntimeException("Label not found");
        }

        TicketLabel existing = label.get();
        existing.setActive(true);
        existing.setUpdatedAt(new Date());

        return labelRepository.save(existing);
    }

    public long countProjectLabels(String projectId) {
        return labelRepository.countByProjectId(projectId);
    }

    public boolean labelExists(String labelId) {
        Optional<TicketLabel> label = labelRepository.findById(labelId);
        return label.isPresent() && label.get().isActive();
    }

    public boolean isLabelInProject(String labelId, String projectId) {
        Optional<TicketLabel> label = labelRepository.findById(labelId);
        return label.isPresent() && label.get().getProjectId().equals(projectId) && label.get().isActive();
    }
}

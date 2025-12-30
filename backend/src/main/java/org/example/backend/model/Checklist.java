package org.example.backend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "checklists")
public class Checklist {

    @Id
    private String id;

    @NotBlank
    @Size(min = 1, max = 200)
    @Field("title")
    private String title;

    @Field("description")
    private String description;

    @Indexed
    @Field("ticketId")
    private String ticketId;

    @Field("items")
    private List<ChecklistItem> items = new ArrayList<>();

    @Field("createdBy")
    private String createdBy;

    @Field("createdAt")
    private Date createdAt;

    @Field("updatedAt")
    private Date updatedAt;

    @Field("active")
    private boolean active;

    public int getCompletedCount() {
        return (int) items.stream().filter(ChecklistItem::isCompleted).count();
    }

    public int getTotalCount() {
        return items.size();
    }

    public double getProgress() {
        if (items.isEmpty()) return 0;
        return (getCompletedCount() * 100.0) / getTotalCount();
    }

    public Checklist(String title, String ticketId, String createdBy) {
        this.title = title;
        this.ticketId = ticketId;
        this.createdBy = createdBy;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.items = new ArrayList<>();
        this.active = true;
    }
}

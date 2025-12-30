package org.example.backend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Field;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistItem {

    @Field("id")
    private String id;

    @NotBlank
    @Size(min = 1, max = 500)
    @Field("title")
    private String title;

    @Field("description")
    private String description;

    @Field("completed")
    private boolean completed;

    @Field("completedBy")
    private String completedBy;

    @Field("completedAt")
    private Date completedAt;

    @Field("assignedTo")
    private String assignedTo;

    @Field("dueDate")
    private Date dueDate;

    @Field("order")
    private Integer order;

    @Field("createdAt")
    private Date createdAt;

    @Field("updatedAt")
    private Date updatedAt;

    public ChecklistItem(String id, String title, Integer order) {
        this.id = id;
        this.title = title;
        this.order = order;
        this.completed = false;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
}

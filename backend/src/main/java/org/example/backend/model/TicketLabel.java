package org.example.backend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "ticket_labels")
@CompoundIndexes({
    @CompoundIndex(name = "project_name_idx", def = "{'projectId': 1, 'name': 1}", unique = true)
})
public class TicketLabel {

    @Id
    private String id;

    @NotBlank
    @Size(min = 1, max = 50)
    @Field("name")
    private String name;

    @Field("description")
    private String description;

    @Field("color")
    private String color; // Hex color code (e.g., #FF5733)

    @Indexed
    @Field("projectId")
    private String projectId;

    @Indexed
    @Field("createdBy")
    private String createdBy; // User ID who created this label

    @Field("createdAt")
    private Date createdAt;

    @Field("updatedAt")
    private Date updatedAt;

    @Field("active")
    private boolean active; // Soft delete via status

    public TicketLabel(String name, String color, String projectId, String createdBy) {
        this.name = name;
        this.color = color;
        this.projectId = projectId;
        this.createdBy = createdBy;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.active = true;
    }
}

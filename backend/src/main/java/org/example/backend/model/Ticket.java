package org.example.backend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import jakarta.validation.constraints.*;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "tickets")
public class Ticket {

    @Id
    private String id;

    @Size(min = 3, max = 200, message = "Le titre doit contenir entre 3 et 200 caractères")
    @Field("title")
    private String title;

    @Size(max = 5000, message = "La description ne doit pas dépasser 5000 caractères")
    @Field("description")
    private String description;

    @Pattern(regexp = "TODO|IN_PROGRESS|IN_VALIDATION|DONE",
            message = "Statut invalide. Valeurs acceptées: TODO, IN_PROGRESS, IN_VALIDATION, DONE")
    @Field("status")
    private String status;

    @FutureOrPresent(message = "La date d'estimation doit être aujourd'hui ou dans le futur")
    @Field("estimatedDate")
    private Date estimatedDate;

    @Field("dueDate")
    private Date dueDate; // Deadline for completion

    @Indexed
    @Field("projectId")
    private String projectId;

    @Indexed
    @Field("creatorId")
    private String creatorId;

    @Field("assigneeIds")
    private List<String> assigneeIds = new ArrayList<>();

    @Field("labelIds")
    private List<String> labelIds = new ArrayList<>(); // IDs of attached labels

    @Field("checklistIds")
    private List<String> checklistIds = new ArrayList<>(); // IDs of attached checklists

    @Field("attachmentIds")
    private List<String> attachmentIds = new ArrayList<>(); // IDs of attachments

    @Field("priority")
    private String priority; // LOW, MEDIUM, HIGH, CRITICAL

    @Field("storyPoints")
    private Integer storyPoints; // Agile estimation

    @Field("completedAt")
    private Date completedAt; // When ticket was marked as DONE

    @Indexed
    @Field("createdAt")
    private Date createdAt;

    @Field("updatedAt")
    private Date updatedAt;

    // Transient fields (not stored in MongoDB)
    @Transient
    private User creator;

    @Transient
    private List<User> assignees;

    @Transient
    private List<TicketLabel> labels;

    @Transient
    private List<Checklist> checklists;

    @Transient
    private List<Attachment> attachments;

    @Transient
    private Integer commentCount;

    @Transient
    private List<TicketActivity> activities;

    @Transient
    private List<TaskDependency> dependencies;
}

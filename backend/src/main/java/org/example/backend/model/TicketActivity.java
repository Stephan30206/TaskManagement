package org.example.backend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import java.util.Date;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "ticket_activities")
public class TicketActivity {

    @Id
    private String id;

    @Indexed
    @Field("ticketId")
    private String ticketId;

    @Indexed
    @Field("projectId")
    private String projectId;

    @Field("action")
    private String action; // CREATED, EDITED, STATUS_CHANGED, ASSIGNED, COMMENTED, LABEL_ADDED, LABEL_REMOVED, CHECKLIST_UPDATED

    @Field("actionBy")
    private String actionBy; // User ID

    @Field("actionByName")
    private String actionByName; // User name for display

    @Field("actionByEmail")
    private String actionByEmail; // User email

    @Field("description")
    private String description; // Human-readable description

    @Field("changes")
    private Map<String, Object> changes; // What changed (oldValue, newValue)

    @Field("relatedEntityId")
    private String relatedEntityId; // ID of comment, label, checklist item, etc.

    @Field("relatedEntityType")
    private String relatedEntityType; // COMMENT, LABEL, CHECKLIST_ITEM, ATTACHMENT

    @Indexed
    @Field("createdAt")
    private Date createdAt;

    // Constructor for common activity types
    public TicketActivity(String ticketId, String projectId, String action, String actionBy, 
                         String actionByName, String actionByEmail, String description) {
        this.ticketId = ticketId;
        this.projectId = projectId;
        this.action = action;
        this.actionBy = actionBy;
        this.actionByName = actionByName;
        this.actionByEmail = actionByEmail;
        this.description = description;
        this.createdAt = new Date();
    }
}

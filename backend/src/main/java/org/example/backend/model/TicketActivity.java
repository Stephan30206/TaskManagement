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
    private String action;

    @Field("actionBy")
    private String actionBy;

    @Field("actionByName")
    private String actionByName;

    @Field("actionByEmail")
    private String actionByEmail;

    @Field("description")
    private String description;

    @Field("changes")
    private Map<String, Object> changes;

    @Field("relatedEntityId")
    private String relatedEntityId;

    @Field("relatedEntityType")
    private String relatedEntityType;

    @Indexed
    @Field("createdAt")
    private Date createdAt;

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

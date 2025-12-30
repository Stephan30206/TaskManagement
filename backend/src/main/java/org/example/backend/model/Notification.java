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
@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    @Indexed
    @Field("recipientId")
    private String recipientId; // User receiving the notification

    @Field("senderId")
    private String senderId; // User sending/triggering the notification

    @Field("senderName")
    private String senderName;

    @Field("senderEmail")
    private String senderEmail;

    @Field("type")
    private String type; // TICKET_ASSIGNED, TICKET_COMMENTED, STATUS_CHANGED, LABEL_ADDED, CHECKLIST_UPDATED, etc.

    @Field("title")
    private String title;

    @Field("message")
    private String message;

    @Field("entityType")
    private String entityType; // TICKET, PROJECT, COMMENT, etc.

    @Indexed
    @Field("entityId")
    private String entityId; // ID of the entity (ticket ID, comment ID, etc.)

    @Indexed
    @Field("projectId")
    private String projectId;

    @Field("relatedData")
    private Map<String, Object> relatedData; // Additional context

    @Field("isRead")
    private boolean isRead;

    @Indexed
    @Field("readAt")
    private Date readAt;

    @Indexed
    @Field("createdAt")
    private Date createdAt;

    @Field("actionUrl")
    private String actionUrl; // Link to the relevant entity

    @Field("sendEmail")
    private boolean sendEmail; // Whether email was sent

    @Field("emailSentAt")
    private Date emailSentAt;

    @Field("dismissed")
    private boolean dismissed;

    @Field("dismissedAt")
    private Date dismissedAt;

    // Constructor
    public Notification(String recipientId, String senderId, String senderName, String senderEmail,
                       String type, String title, String message, String entityType, String entityId, String projectId) {
        this.recipientId = recipientId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.senderEmail = senderEmail;
        this.type = type;
        this.title = title;
        this.message = message;
        this.entityType = entityType;
        this.entityId = entityId;
        this.projectId = projectId;
        this.createdAt = new Date();
        this.isRead = false;
        this.dismissed = false;
        this.sendEmail = true;
    }
}

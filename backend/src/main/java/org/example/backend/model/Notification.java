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
    private String recipientId;

    @Field("senderId")
    private String senderId;

    @Field("senderName")
    private String senderName;

    @Field("senderEmail")
    private String senderEmail;

    @Field("type")
    private String type;

    @Field("title")
    private String title;

    @Field("message")
    private String message;

    @Field("entityType")
    private String entityType;

    @Indexed
    @Field("entityId")
    private String entityId;

    @Indexed
    @Field("projectId")
    private String projectId;

    @Field("relatedData")
    private Map<String, Object> relatedData;

    @Field("isRead")
    private boolean isRead;

    @Indexed
    @Field("readAt")
    private Date readAt;

    @Indexed
    @Field("createdAt")
    private Date createdAt;

    @Field("actionUrl")
    private String actionUrl;

    @Field("sendEmail")
    private boolean sendEmail;

    @Field("emailSentAt")
    private Date emailSentAt;

    @Field("dismissed")
    private boolean dismissed;

    @Field("dismissedAt")
    private Date dismissedAt;

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

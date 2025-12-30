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
@Document(collection = "audit_logs")
public class AuditLog {

    @Id
    private String id;

    @Indexed
    @Field("action")
    private String action; // CREATE, UPDATE, DELETE, ASSIGN, STATUS_CHANGE, COMMENT, LABEL, CHECKLIST, etc.

    @Indexed
    @Field("entityType")
    private String entityType; // TICKET, PROJECT, COMMENT, LABEL, CHECKLIST, ATTACHMENT, USER, etc.

    @Indexed
    @Field("entityId")
    private String entityId; // ID of the entity being modified

    @Indexed
    @Field("projectId")
    private String projectId; // For filtering audits by project

    @Indexed
    @Field("userId")
    private String userId; // User who performed the action

    @Field("userName")
    private String userName; // Cached username for readability

    @Field("userEmail")
    private String userEmail; // Cached email for readability

    @Field("description")
    private String description; // Human-readable description of the action

    @Field("changes")
    private Map<String, Object> changes; // Old value -> new value for update operations

    @Field("details")
    private Map<String, Object> details; // Additional metadata

    @Indexed
    @Field("createdAt")
    private Date createdAt; // Immutable timestamp

    @Field("ipAddress")
    private String ipAddress; // For security tracking

    @Field("deletedByAdmin")
    private boolean deletedByAdmin; // Only ADMIN can mark as deleted (logical delete, never physical)

    @Field("deleteReason")
    private String deleteReason; // Reason why admin deleted this audit log entry

    @Field("deletedAt")
    private Date deletedAt; // When the admin deleted it

    @Field("deletedById")
    private String deletedById; // Which admin deleted it
}

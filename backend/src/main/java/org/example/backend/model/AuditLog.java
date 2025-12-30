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
    private String action;

    @Indexed
    @Field("entityType")
    private String entityType;

    @Indexed
    @Field("entityId")
    private String entityId;

    @Indexed
    @Field("projectId")
    private String projectId;

    @Indexed
    @Field("userId")
    private String userId;

    @Field("userName")
    private String userName;

    @Field("userEmail")
    private String userEmail;

    @Field("description")
    private String description;

    @Field("changes")
    private Map<String, Object> changes;

    @Field("details")
    private Map<String, Object> details;

    @Indexed
    @Field("createdAt")
    private Date createdAt;

    @Field("ipAddress")
    private String ipAddress;

    @Field("deletedByAdmin")
    private boolean deletedByAdmin;

    @Field("deleteReason")
    private String deleteReason;

    @Field("deletedAt")
    private Date deletedAt;

    @Field("deletedById")
    private String deletedById;
}

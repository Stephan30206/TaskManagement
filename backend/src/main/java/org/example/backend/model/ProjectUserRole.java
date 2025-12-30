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
import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "project_user_roles")
@CompoundIndexes({
    @CompoundIndex(name = "project_user_idx", def = "{'projectId': 1, 'userId': 1}", unique = true)
})
public class ProjectUserRole {

    @Id
    private String id;

    @Indexed
    @Field("projectId")
    private String projectId;

    @Indexed
    @Field("userId")
    private String userId;

    @Field("role")
    private String role;

    @Field("permissions")
    private List<String> permissions;

    @Field("joinedAt")
    private Date joinedAt;

    @Field("updatedAt")
    private Date updatedAt;

    @Field("invitedBy")
    private String invitedBy;

    @Field("status")
    private String status;

    public static final List<String> ADMIN_PERMISSIONS = List.of(
        "project.view",
        "project.edit",
        "project.delete",
        "project.manage_members",
        "project.manage_roles",
        "ticket.create",
        "ticket.edit",
        "ticket.delete",
        "ticket.assign",
        "ticket.change_status",
        "comment.create",
        "comment.edit",
        "comment.delete",
        "label.create",
        "label.edit",
        "label.delete",
        "checklist.create",
        "checklist.edit",
        "checklist.delete",
        "attachment.upload",
        "attachment.delete",
        "audit.view",
        "audit.export",
        "audit.delete"
    );

    public static final List<String> MANAGER_PERMISSIONS = List.of(
        "project.view",
        "project.edit",
        "ticket.create",
        "ticket.edit",
        "ticket.assign",
        "ticket.change_status",
        "comment.create",
        "comment.edit",
        "comment.delete",
        "label.create",
        "label.edit",
        "checklist.create",
        "checklist.edit",
        "attachment.upload",
        "audit.view"
    );

    public static final List<String> MEMBER_PERMISSIONS = List.of(
        "project.view",
        "ticket.edit_assigned",
        "ticket.change_status_assigned",
        "comment.create",
        "comment.edit_own",
        "comment.delete_own",
        "checklist.complete",
        "attachment.upload",
        "audit.view"
    );

    public static final List<String> OBSERVER_PERMISSIONS = List.of(
        "project.view",
        "ticket.view",
        "comment.view",
        "audit.view"
    );

    public static List<String> getPermissionsForRole(String role) {
        return switch (role) {
            case "ADMIN" -> ADMIN_PERMISSIONS;
            case "MANAGER" -> MANAGER_PERMISSIONS;
            case "MEMBER" -> MEMBER_PERMISSIONS;
            case "OBSERVER" -> OBSERVER_PERMISSIONS;
            default -> List.of();
        };
    }

    public boolean hasPermission(String permission) {
        return this.permissions != null && this.permissions.contains(permission);
    }
}

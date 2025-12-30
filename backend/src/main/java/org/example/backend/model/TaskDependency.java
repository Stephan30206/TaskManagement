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

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "task_dependencies")
@CompoundIndexes({
    @CompoundIndex(name = "dependency_idx", def = "{'dependentTicketId': 1, 'dependsOnTicketId': 1}", unique = true)
})
public class TaskDependency {

    @Id
    private String id;

    @Indexed
    @Field("dependentTicketId")
    private String dependentTicketId;

    @Indexed
    @Field("dependsOnTicketId")
    private String dependsOnTicketId;

    @Indexed
    @Field("projectId")
    private String projectId;

    @Field("relationshipType")
    private String relationshipType;

    @Field("description")
    private String description;

    @Field("createdBy")
    private String createdBy;

    @Field("createdAt")
    private Date createdAt;

    @Field("updatedAt")
    private Date updatedAt;

    @Field("active")
    private boolean active;

    public TaskDependency(String dependentTicketId, String dependsOnTicketId, String projectId, 
                         String relationshipType, String createdBy) {
        this.dependentTicketId = dependentTicketId;
        this.dependsOnTicketId = dependsOnTicketId;
        this.projectId = projectId;
        this.relationshipType = relationshipType;
        this.createdBy = createdBy;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.active = true;
    }
}

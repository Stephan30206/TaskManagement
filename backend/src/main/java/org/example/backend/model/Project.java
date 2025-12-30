package org.example.backend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Field;
import jakarta.validation.constraints.*;
import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "projects")
public class Project {

    @Id
    private String id;

    @NotBlank(message = "Le nom du projet est obligatoire")
    @Size(min = 3, max = 100, message = "Le nom doit contenir entre 3 et 100 caractères")
    @Field("name")
    private String name;

    @NotBlank(message = "La description est obligatoire")
    @Size(max = 1000, message = "La description ne doit pas dépasser 1000 caractères")
    @Field("description")
    private String description;

    @NotBlank(message = "Le statut est obligatoire")
    @Pattern(regexp = "ACTIVE|INACTIVE|ARCHIVED", message = "Statut invalide")
    @Field("status")
    private String status;

    @Field("ownerId")
    private String ownerId;

    @Field("adminIds")
    private List<String> adminIds;

    @Field("teamIds")
    private List<String> teamIds;

    @Field("createdAt")
    private Date createdAt;

    @Field("updatedAt")
    private Date updatedAt;
}

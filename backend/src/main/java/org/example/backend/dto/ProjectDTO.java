package org.example.backend.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.util.Date;
import java.util.List;

@Data
public class ProjectDTO {

    private String id;

    @NotBlank(message = "Le nom du projet est obligatoire")
    @Size(min = 3, max = 100)
    private String name;

    @NotBlank(message = "La description est obligatoire")
    @Size(max = 1000)
    private String description;

    @NotBlank
    @Pattern(regexp = "ACTIVE|INACTIVE|ARCHIVED")
    private String status;

    private String ownerId;
    private List<String> adminIds;
    private List<String> teamIds;
    private Date createdAt;
    private Date updatedAt;
}
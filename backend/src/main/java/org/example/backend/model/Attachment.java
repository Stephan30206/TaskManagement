package org.example.backend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "attachments")
public class Attachment {

    @Id
    private String id;

    @NotBlank
    @Size(min = 1, max = 255)
    @Field("fileName")
    private String fileName;

    @Field("fileSize")
    private Long fileSize;

    @Field("mimeType")
    private String mimeType;

    @NotBlank
    @Field("fileUrl")
    private String fileUrl;

    @Field("thumbnailUrl")
    private String thumbnailUrl;

    @Indexed
    @Field("ticketId")
    private String ticketId;

    @Indexed
    @Field("commentId")
    private String commentId;

    @Indexed
    @Field("uploadedBy")
    private String uploadedBy;

    @Field("uploadedAt")
    private Date uploadedAt;

    @Field("description")
    private String description;

    @Field("isImage")
    private boolean isImage;

    @Field("width")
    private Integer width;

    @Field("height")
    private Integer height;

    @Field("deleted")
    private boolean deleted;

    @Field("deletedAt")
    private Date deletedAt;

    @Field("deletedBy")
    private String deletedBy;

    public Attachment(String fileName, Long fileSize, String mimeType, String fileUrl, String ticketId, String uploadedBy) {
        this.fileName = fileName;
        this.fileSize = fileSize;
        this.mimeType = mimeType;
        this.fileUrl = fileUrl;
        this.ticketId = ticketId;
        this.uploadedBy = uploadedBy;
        this.uploadedAt = new Date();
        this.deleted = false;
        this.isImage = mimeType != null && mimeType.startsWith("image/");
    }
}

package org.example.backend.service;

import org.example.backend.model.Attachment;
import org.example.backend.repository.AttachmentRepository;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;

    public AttachmentService(AttachmentRepository attachmentRepository) {
        this.attachmentRepository = attachmentRepository;
    }

    /* =========================
       CREATE
       ========================= */

    public Attachment createAttachment(String fileName, Long fileSize, String mimeType,
                                       String fileUrl, String ticketId, String uploadedBy) {
        Attachment attachment = new Attachment(
                fileName, fileSize, mimeType, fileUrl, ticketId, uploadedBy
        );
        return attachmentRepository.save(attachment);
    }

    public Attachment createAttachment(String fileName, Long fileSize, String mimeType,
                                       String fileUrl, String ticketId,
                                       String commentId, String uploadedBy) {
        Attachment attachment = new Attachment(
                fileName, fileSize, mimeType, fileUrl, ticketId, uploadedBy
        );
        attachment.setCommentId(commentId);
        return attachmentRepository.save(attachment);
    }

    /* =========================
       READ
       ========================= */

    public Attachment getAttachmentById(String attachmentId) {
        return attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Attachment not found"));
    }

    public List<Attachment> getTicketAttachments(String ticketId) {
        return attachmentRepository.findByTicketIdAndDeletedFalse(ticketId);
    }

    public List<Attachment> getCommentAttachments(String commentId) {
        return attachmentRepository.findByCommentIdAndDeletedFalse(commentId);
    }

    public List<Attachment> getUserAttachments(String userId) {
        return attachmentRepository.findByUploadedByAndDeletedFalse(userId);
    }

    /* =========================
       UPDATE
       ========================= */

    public Attachment updateAttachment(String attachmentId,
                                       String description,
                                       String thumbnailUrl) {
        Attachment attachment = getAttachmentById(attachmentId);

        if (attachment.isDeleted()) {
            throw new RuntimeException("Cannot update a deleted attachment");
        }

        if (description != null) {
            attachment.setDescription(description);
        }
        if (thumbnailUrl != null) {
            attachment.setThumbnailUrl(thumbnailUrl);
        }

        return attachmentRepository.save(attachment);
    }

    public Attachment setImageDimensions(String attachmentId,
                                         Integer width,
                                         Integer height) {
        Attachment attachment = getAttachmentById(attachmentId);

        attachment.setWidth(width);
        attachment.setHeight(height);
        attachment.setImage(true);

        return attachmentRepository.save(attachment);
    }

    /* =========================
       SOFT DELETE / RESTORE
       ========================= */

    public Attachment softDeleteAttachment(String attachmentId, String deletedBy) {
        Attachment attachment = getAttachmentById(attachmentId);

        if (attachment.isDeleted()) {
            throw new RuntimeException("Attachment already deleted");
        }

        attachment.setDeleted(true);
        attachment.setDeletedBy(deletedBy);
        attachment.setDeletedAt(new Date());

        return attachmentRepository.save(attachment);
    }

    public Attachment restoreAttachment(String attachmentId) {
        Attachment attachment = getAttachmentById(attachmentId);

        if (!attachment.isDeleted()) {
            throw new RuntimeException("Attachment is not deleted");
        }

        attachment.setDeleted(false);
        attachment.setDeletedBy(null);
        attachment.setDeletedAt(null);

        return attachmentRepository.save(attachment);
    }

    /* =========================
       VALIDATION & UTILS
       ========================= */

    public boolean isImage(String attachmentId) {
        return getAttachmentById(attachmentId).isImage();
    }

    public boolean isAttachmentInTicket(String attachmentId, String ticketId) {
        Attachment attachment = getAttachmentById(attachmentId);
        return !attachment.isDeleted()
                && ticketId.equals(attachment.getTicketId());
    }

    public boolean isAttachmentInComment(String attachmentId, String commentId) {
        Attachment attachment = getAttachmentById(attachmentId);
        return !attachment.isDeleted()
                && commentId.equals(attachment.getCommentId());
    }

    public long countTicketAttachments(String ticketId) {
        return attachmentRepository.countByTicketId(ticketId);
    }

    public long getTicketAttachmentsSize(String ticketId) {
        return getTicketAttachments(ticketId)
                .stream()
                .mapToLong(Attachment::getFileSize)
                .sum();
    }
}

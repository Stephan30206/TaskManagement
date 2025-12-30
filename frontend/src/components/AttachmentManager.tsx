import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Box, Button, Card, CardContent, Typography, IconButton,
    List, ListItem, ListItemText, ListItemSecondaryAction,
    CircularProgress, Chip, Alert
} from '@mui/material';
import {
    AttachFile, Delete, Download, Image, InsertDriveFile
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { attachmentApi } from '../services/api';

interface AttachmentManagerProps {
    ticketId: string;
    projectId: string;
}

const AttachmentManager: React.FC<AttachmentManagerProps> = ({ ticketId}) => {
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const { data: attachments, isLoading } = useQuery({
        queryKey: ['attachments', ticketId],
        queryFn: () => attachmentApi.getByTicket(ticketId),
        enabled: !!ticketId,
    });

    // Mutation pour supprimer
    const deleteMutation = useMutation({
        mutationFn: (attachmentId: string) => attachmentApi.delete(attachmentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attachments', ticketId] });
            enqueueSnackbar('Pièce jointe supprimée', { variant: 'success' });
        },
    });

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('ticketId', ticketId);

        setUploading(true);
        try {
            await attachmentApi.upload(file,  ticketId);
            queryClient.invalidateQueries({ queryKey: ['attachments', ticketId] });
            enqueueSnackbar('Fichier uploadé avec succès', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Erreur lors de l\'upload', { variant: 'error' });
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDownload = async (attachmentId: string, fileName: string) => {
        try {
            const response = await attachmentApi.getDownloadUrl(attachmentId);
            const downloadUrl = response.data.fileUrl;

            // Créer un lien temporaire pour le téléchargement
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            enqueueSnackbar('Erreur lors du téléchargement', { variant: 'error' });
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Card>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                        Pièces jointes ({attachments?.data?.length || 0})
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<AttachFile />}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        {uploading ? <CircularProgress size={24} /> : 'Ajouter un fichier'}
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        hidden
                        onChange={handleFileSelect}
                        disabled={uploading}
                    />
                </Box>

                {isLoading ? (
                    <CircularProgress />
                ) : attachments?.data?.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Aucune pièce jointe pour ce ticket
                    </Alert>
                ) : (
                    <List>
                        {attachments?.data?.map((attachment: any) => (
                            <ListItem key={attachment.id} divider>
                                <Box display="flex" alignItems="center" gap={2} sx={{ flex: 1 }}>
                                    {attachment.isImage ? (
                                        <Image color="primary" />
                                    ) : (
                                        <InsertDriveFile color="action" />
                                    )}
                                    <ListItemText
                                        primary={attachment.fileName}
                                        secondary={
                                            <>
                                                {formatFileSize(attachment.fileSize)}
                                                {attachment.uploadedAt && (
                                                    <span> • {new Date(attachment.uploadedAt).toLocaleDateString()}</span>
                                                )}
                                            </>
                                        }
                                    />
                                    {attachment.isImage && (
                                        <Chip label="Image" size="small" variant="outlined" />
                                    )}
                                </Box>
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleDownload(attachment.id, attachment.fileName)}
                                    >
                                        <Download />
                                    </IconButton>
                                    <IconButton
                                        edge="end"
                                        onClick={() => {
                                            if (window.confirm('Supprimer cette pièce jointe ?')) {
                                                deleteMutation.mutate(attachment.id);
                                            }
                                        }}
                                        disabled={deleteMutation.isPending}
                                    >
                                        <Delete />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                )}
            </CardContent>
        </Card>
    );
};

export default AttachmentManager;
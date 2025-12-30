import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box, Card, TextField, Button, CircularProgress,
    List, Divider, Typography, Avatar,
    IconButton, Tooltip, Stack
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ClearIcon from '@mui/icons-material/Clear';
import { commentApi } from '../services/api';
import type { Comment } from '../services/types';

interface CommentSectionProps {
    ticketId: string;
    projectId: string;
}

export default function CommentSection({ ticketId }: CommentSectionProps) {
    const [commentContent, setCommentContent] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState('');
    const queryClient = useQueryClient();

    const { data: commentsResponse, isLoading } = useQuery({
        queryKey: ['comments', ticketId],
        queryFn: () => commentApi.getWithAuthors(ticketId),
    });

    const comments: Comment[] = (() => {
        if (!commentsResponse) return [];

        if (Array.isArray(commentsResponse)) {
            return commentsResponse;
        }

        if (commentsResponse.data && Array.isArray(commentsResponse.data)) {
            return commentsResponse.data;
        }

        return [];
    })();

    const createMutation = useMutation({
        mutationFn: (content: string) =>
            commentApi.create({
                content,
                ticketId,
            }),
        onSuccess: () => {
            setCommentContent('');
            queryClient.invalidateQueries({ queryKey: ['comments', ticketId] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
            commentApi.update(commentId, content),
        onSuccess: () => {
            setEditingCommentId(null);
            setEditingContent('');
            queryClient.invalidateQueries({ queryKey: ['comments', ticketId] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (commentId: string) => commentApi.delete(commentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', ticketId] });
        },
    });

    const handleAddComment = async () => {
        if (commentContent.trim()) {
            await createMutation.mutateAsync(commentContent);
        }
    };

    const handleUpdateComment = async () => {
        if (editingCommentId && editingContent.trim()) {
            await updateMutation.mutateAsync({
                commentId: editingCommentId,
                content: editingContent,
            });
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
            await deleteMutation.mutateAsync(commentId);
        }
    };

    if (isLoading) {
        return <CircularProgress />;
    }

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                Commentaires ({comments.length})
            </Typography>

            <Card sx={{ mb: 3, p: 2, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Ajouter un commentaire..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    disabled={createMutation.isPending}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 1,
                        },
                    }}
                />
                <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        endIcon={<SendIcon />}
                        onClick={handleAddComment}
                        disabled={!commentContent.trim() || createMutation.isPending}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                        }}
                    >
                        Publier
                    </Button>
                </Box>
            </Card>

            {comments.length === 0 ? (
                <Card sx={{ p: 4, textAlign: 'center', borderRadius: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="body2" color="textSecondary">
                        Aucun commentaire pour le moment. Soyez le premier à commenter !
                    </Typography>
                </Card>
            ) : (
                <List sx={{ p: 0 }}>
                    {comments.map((comment: Comment, index: number) => (
                        <Box key={comment.id}>
                            {editingCommentId === comment.id ? (
                                <Card sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        value={editingContent}
                                        onChange={(e) => setEditingContent(e.target.value)}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 1,
                                            },
                                        }}
                                    />
                                    <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => setEditingCommentId(null)}
                                            startIcon={<ClearIcon />}
                                        >
                                            Annuler
                                        </Button>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={handleUpdateComment}
                                            disabled={updateMutation.isPending || !editingContent.trim()}
                                        >
                                            Enregistrer
                                        </Button>
                                    </Stack>
                                </Card>
                            ) : (
                                <Card sx={{ p: 2, mb: 2, borderRadius: 2, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                        <Avatar sx={{ width: 40, height: 40, flexShrink: 0 }}>
                                            {comment.author?.firstName?.charAt(0)?.toUpperCase()}
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                        {comment.author?.firstName} {comment.author?.lastName}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {new Date(comment.createdAt).toLocaleDateString('fr-FR', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 0.5, opacity: 0.7, transition: 'opacity 0.2s', '&:hover': { opacity: 1 } }}>
                                                    <Tooltip title="Modifier">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                setEditingCommentId(comment.id);
                                                                setEditingContent(comment.content);
                                                            }}
                                                            sx={{
                                                                color: 'info.main',
                                                                '&:hover': { bgcolor: 'info.lighter' }
                                                            }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Supprimer">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            sx={{
                                                                '&:hover': { bgcolor: 'error.lighter' }
                                                            }}
                                                            disabled={deleteMutation.isPending}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Box>
                                            <Typography variant="body2" sx={{ mt: 1.5, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                                {comment.content}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Card>
                            )}
                            {index < comments.length - 1 && <Divider sx={{ my: 1 }} />}
                        </Box>
                    ))}
                </List>
            )}
        </Box>
    );
}
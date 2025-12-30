import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
    Container,
    Typography,
    Box,
    Chip,
    Button,
    Card,
    CardContent,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Divider,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Alert,
    IconButton,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    ArrowBack,
    CalendarToday,
    AccessTime,
    Person,
    Assignment,
    Warning,
    Refresh,
} from '@mui/icons-material';
import { ticketApi, commentApi, userApi } from '../services/api';
import type { Ticket, User, Comment } from '../services/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LocalStorageUser {
    id: string;
    nom?: string;
    prenom?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    Role?: string;
    ROLE?: string;
    email?: string;
    telephone?: string;
    createdAt?: string;
}

interface CommentWithAuthor {
    comment: Comment;
    author?: User;
    authorName?: string;
}

interface TicketAssignee {
    id: string;
    firstName?: string;
    lastName?: string;
    prenom?: string;
    nom?: string;
}

const TicketDetailPage: React.FC = () => {
    const { ticketId } = useParams<{ ticketId: string }>();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [editedTicket, setEditedTicket] = useState({
        title: '',
        description: '',
        status: 'TODO' as 'TODO' | 'IN_PROGRESS' | 'IN_VALIDATION' | 'DONE',
        estimatedDate: '',
    });
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const [userHasEditPermission, setUserHasEditPermission] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [showDebugInfo] = useState(false);
    const [isCheckingPermissions, setIsCheckingPermissions] = useState(false);

    // Query pour récupérer l'utilisateur actuel depuis l'API
    const {
        data: currentUserData,
        isLoading: userLoading,
        error: userError,
    } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => userApi.getCurrentUser(),
        retry: 1,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const checkAuth = useCallback((): boolean => {
        const token = localStorage.getItem('token') ||
            localStorage.getItem('authToken') ||
            sessionStorage.getItem('token');

        if (!token) {
            console.warn("Aucun token d'authentification trouvé");
            return false;
        }

        return true;
    }, []);

    // Utiliser l'utilisateur récupéré depuis l'API
    useEffect(() => {
        if (currentUserData?.data) {
            console.log("User data loaded from API:", currentUserData.data);
            setCurrentUser(currentUserData.data);
            setCurrentUserId(currentUserData.data.id);

            // Optionnel : sauvegarder dans localStorage pour usage futur
            try {
                localStorage.setItem('user', JSON.stringify(currentUserData.data));
                console.log("User saved to localStorage");
            } catch (error) {
                console.error("Error saving user to localStorage:", error);
            }
        } else if (userError) {
            console.error("Error loading user from API:", userError);
        }
    }, [currentUserData, userError]);

    const getUserIdFromStorage = useCallback((): string | null => {
        try {
            // Essayer différentes clés possibles
            const userKeys = ['user', 'currentUser', 'authUser', 'userData'];

            for (const key of userKeys) {
                const userString = localStorage.getItem(key);
                if (userString) {
                    console.log(`User found in localStorage with key: ${key}`, userString);
                    const user = JSON.parse(userString);

                    // Chercher l'ID dans différentes propriétés possibles
                    const userId = user?.id || user?._id || user?.userId || user?.ID;

                    if (userId) {
                        console.log("User ID found in localStorage:", userId);
                        return String(userId);
                    }
                }
            }

            // Si pas trouvé, utiliser l'utilisateur depuis l'API
            if (currentUser?.id) {
                console.log("Using user ID from API data:", currentUser.id);
                return currentUser.id;
            }

            console.warn("Aucun utilisateur trouvé");
            return null;
        } catch (error) {
            console.error("Erreur de parsing user storage:", error);
            return null;
        }
    }, [currentUser]);

    const checkUserPermissions = useCallback(async (userId: string | null, ticketData: Ticket): Promise<boolean> => {
        try {
            if (!userId) {
                console.warn("No user ID provided for permission check");
                return false;
            }

            const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            if (isDevelopment) {
                console.log("DEV MODE: Forcing permissions for testing");
                return true;
            }

            console.log("Checking permissions for user:", userId, "on ticket:", ticketData.id);

            const currentUserStringId = String(userId);

            const creatorId = ticketData.creator?.id ? String(ticketData.creator.id) : null;
            const isCreator = creatorId === currentUserStringId;

            let isAdmin = false;
            try {
                // Vérifier le rôle depuis l'utilisateur récupéré de l'API
                if (currentUser) {
                    const userRole = currentUser.role || currentUser.role;
                    if (userRole && (userRole.toUpperCase() === 'ADMIN' || userRole === 'admin')) {
                        isAdmin = true;
                        console.log("User is admin from API data:", userRole);
                    }
                }

                // Vérifier aussi dans localStorage au cas où
                if (!isAdmin) {
                    const userString = localStorage.getItem('user');
                    if (userString) {
                        const user: LocalStorageUser = JSON.parse(userString);
                        const userRole = user?.role || user?.Role || user?.ROLE;
                        if (userRole && (userRole.toUpperCase() === 'ADMIN' || userRole === 'admin')) {
                            isAdmin = true;
                            console.log("User is admin from localStorage:", userRole);
                        }
                    }
                }
            } catch (error) {
                console.error("Erreur vérification admin:", error);
            }

            let isAssignee = false;
            if (ticketData.assignees && ticketData.assignees.length > 0) {
                isAssignee = ticketData.assignees.some((assignee: TicketAssignee) => {
                    const assigneeId = assignee.id ? String(assignee.id) : null;
                    const isAssigned = assigneeId === currentUserStringId;
                    if (isAssigned) {
                        console.log("User is assignee - Match found:", { assigneeId, currentUserStringId });
                    }
                    return isAssigned;
                });
            }

            console.log("Final permission check results:", {
                userId: currentUserStringId,
                creatorId: creatorId,
                isCreator, isAdmin, isAssignee,
                hasPermission: !!(isCreator || isAdmin || isAssignee)
            });

            return !!(isCreator || isAdmin || isAssignee);

        } catch (error) {
            console.error("Erreur lors de la vérification des permissions:", error);
            return false;
        }
    }, [currentUser]);

    const {
        data: ticket,
        isLoading: ticketLoading,
        error: ticketError,
    } = useQuery({
        queryKey: ['ticket', ticketId],
        queryFn: () => ticketApi.getById(ticketId!),
        enabled: !!ticketId,
    });

    const {
        data: comments,
        isLoading: commentsLoading,
    } = useQuery({
        queryKey: ['ticket-comments', ticketId],
        queryFn: () => commentApi.getWithAuthors(ticketId!),
        enabled: !!ticketId,
    });

    useEffect(() => {
        const verifyPermissions = async () => {
            if (ticket?.data && currentUserId) {
                console.log("Ticket loaded, checking permissions...");
                setIsCheckingPermissions(true);
                const hasPermission = await checkUserPermissions(currentUserId, ticket.data);
                setUserHasEditPermission(hasPermission);

                if (!hasPermission) {
                    setPermissionError("Vous n'avez pas les permissions nécessaires pour modifier ce ticket. Seul le créateur, un administrateur ou un assigné peut modifier ce ticket.");
                } else {
                    setPermissionError(null);
                }
                setIsCheckingPermissions(false);
            }
        };

        verifyPermissions();
    }, [ticket, currentUserId, checkUserPermissions]);

    useEffect(() => {
        // Vérifier d'abord si l'utilisateur est authentifié
        const isAuthenticated = checkAuth();

        if (!isAuthenticated) {
            console.warn("Utilisateur non authentifié");
            // Optionnel : rediriger vers login
            // navigate('/login');
        }

        // Si l'utilisateur n'est pas encore chargé via l'API, essayer localStorage
        if (!currentUserId) {
            const userId = getUserIdFromStorage();
            if (userId) {
                console.log("User ID loaded from storage:", userId);
                setCurrentUserId(userId);
            }
        }
    }, [checkAuth, getUserIdFromStorage, currentUserId]);

    const updateMutation = useMutation({
        mutationFn: (data: Partial<Ticket>) => ticketApi.update(ticketId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
            enqueueSnackbar('Ticket mis à jour avec succès', { variant: 'success' });
            setIsEditModalOpen(false);
            setPermissionError(null);
        },
        onError: (error: any) => {
            const status = error.response?.status;
            const message = error.response?.data?.message || 'Erreur lors de la mise à jour';

            if (status === 403) {
                setPermissionError("Accès refusé : Vous n'avez pas les permissions nécessaires pour modifier ce ticket.");
                enqueueSnackbar("Permission refusée pour la modification", { variant: 'warning' });
                setUserHasEditPermission(false);
            } else {
                enqueueSnackbar(message, { variant: 'error' });
            }
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => ticketApi.delete(ticketId!),
        onSuccess: () => {
            enqueueSnackbar('Ticket supprimé avec succès', { variant: 'success' });
            navigate(-1);
        },
        onError: (error: any) => {
            const status = error.response?.status;
            const message = error.response?.data?.message || 'Erreur lors de la suppression';

            if (status === 403) {
                enqueueSnackbar("Permission refusée pour la suppression", { variant: 'warning' });
            } else {
                enqueueSnackbar(message, { variant: 'error' });
            }
            setIsDeleteDialogOpen(false);
        },
    });

    const createCommentMutation = useMutation({
        mutationFn: (content: string) => {
            console.log("Creating comment with content:", content);

            // Utiliser l'ID utilisateur actuel
            let authorId = currentUserId;

            if (!authorId && currentUser?.id) {
                authorId = currentUser.id;
            }

            if (!authorId) {
                // Dernier recours : essayer localStorage
                const userString = localStorage.getItem('user');
                if (userString) {
                    try {
                        const user = JSON.parse(userString);
                        authorId = user?.id || user?._id;
                    } catch (e) {
                        console.error("Error parsing user from localStorage:", e);
                    }
                }
            }

            console.log("Author ID for comment:", authorId);

            return commentApi.create({
                content,
                ticketId: ticketId!,
                authorId: authorId || undefined
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ticket-comments', ticketId] });
            setNewComment('');
            enqueueSnackbar('Commentaire ajouté', { variant: 'success' });
        },
        onError: (error: any) => {
            const status = error.response?.status;
            const message = error.response?.data?.message || 'Erreur lors de l\'ajout du commentaire';

            if (status === 403) {
                enqueueSnackbar("Permission refusée pour ajouter un commentaire", { variant: 'warning' });
            } else {
                enqueueSnackbar(message, { variant: 'error' });
            }
        },
    });

    const handleEditSubmit = () => {
        if (!userHasEditPermission) {
            enqueueSnackbar("Vous n'avez pas les permissions pour modifier ce ticket", { variant: 'warning' });
            return;
        }

        const updateData = {
            ...editedTicket,
            estimatedDate: editedTicket.estimatedDate ? new Date(editedTicket.estimatedDate) : undefined,
        };
        updateMutation.mutate(updateData);
    };

    const handleDelete = () => {
        deleteMutation.mutate();
    };

    const handleAddComment = () => {
        if (newComment.trim()) {
            createCommentMutation.mutate(newComment);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'TODO':
                return 'default';
            case 'IN_PROGRESS':
                return 'warning';
            case 'IN_VALIDATION':
                return 'info';
            case 'DONE':
                return 'success';
            default:
                return 'default';
        }
    };

    const formatDate = (date: Date | string | null | undefined): string => {
        if (!date) return 'Date non disponible';
        try {
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) return 'Date invalide';
            return format(dateObj, 'dd MMMM yyyy', { locale: fr });
        } catch (error) {
            return 'Erreur de format';
        }
    };

    const formatDateTime = (date: Date | string | null | undefined): string => {
        if (!date) return 'Date non disponible';
        try {
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) return 'Date invalide';
            return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: fr });
        } catch (error) {
            return 'Erreur de format';
        }
    };
    if (ticketLoading || isCheckingPermissions || userLoading) {
        return (
            <Container sx={{ mt: 4 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                    {ticketLoading ? 'Chargement du ticket...' :
                        userLoading ? 'Chargement des informations utilisateur...' :
                            'Vérification des permissions...'}
                </Typography>
            </Container>
        );
    }

    if (ticketError || !ticket?.data) {
        const errorStatus = (ticketError as any)?.response?.status;

        if (errorStatus === 403) {
            return (
                <Container sx={{ mt: 4, textAlign: 'center' }}>
                    <Alert
                        severity="error"
                        sx={{ mb: 3 }}
                        action={
                            <Button color="inherit" size="small" onClick={() => navigate(-1)}>
                                Retour
                            </Button>
                        }
                    >
                        <Typography variant="h6" gutterBottom>
                            Accès refusé
                        </Typography>
                        <Typography variant="body2">
                            Vous n'avez pas les permissions nécessaires pour accéder à ce ticket.
                        </Typography>
                    </Alert>
                    <Button
                        startIcon={<ArrowBack />}
                        onClick={() => navigate(-1)}
                        variant="outlined"
                    >
                        Retour à la liste
                    </Button>
                </Container>
            );
        }

        return (
            <Container sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="h5" color="error" gutterBottom>
                    Ticket non trouvé
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Le ticket que vous essayez d'accéder n'existe pas ou a été supprimé.
                </Typography>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate(-1)}
                    variant="contained"
                >
                    Retour
                </Button>
            </Container>
        );
    }

    const ticketData: Ticket = ticket.data;
    const commentsData: CommentWithAuthor[] = comments?.data || [];

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {permissionError && (
                <Alert
                    severity="warning"
                    sx={{ mb: 3 }}
                    action={
                        <IconButton size="small" onClick={() => setPermissionError(null)}>
                            <Refresh fontSize="small" />
                        </IconButton>
                    }
                >
                    <Box display="flex" alignItems="center" gap={1}>
                        <Warning fontSize="small" />
                        <Typography variant="body2">
                            {permissionError}
                        </Typography>
                    </Box>
                </Alert>
            )}

            <Box sx={{ mb: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Button
                        startIcon={<ArrowBack />}
                        onClick={() => navigate(-1)}
                        variant="outlined"
                        size="small"
                    >
                        Retour
                    </Button>
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2} flexWrap="wrap">
                    <Box sx={{ flex: 1 }}>
                        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap" sx={{ mb: 1 }}>
                            <Typography variant="h4" component="h1">
                                {ticketData.title}
                            </Typography>
                            <Chip
                                label={ticketData.status}
                                color={getStatusColor(ticketData.status) as any}
                                variant="outlined"
                                size="medium"
                            />
                        </Box>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                            {ticketData.description}
                        </Typography>
                    </Box>

                    <Box display="flex" gap={1}>
                        <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => {
                                if (!userHasEditPermission) {
                                    enqueueSnackbar("Vous n'avez pas les permissions pour modifier ce ticket", {
                                        variant: 'warning'
                                    });
                                    return;
                                }
                                setEditedTicket({
                                    title: ticketData.title,
                                    description: ticketData.description,
                                    status: ticketData.status,
                                    estimatedDate: ticketData.estimatedDate
                                        ? format(new Date(ticketData.estimatedDate), 'yyyy-MM-dd')
                                        : '',
                                });
                                setIsEditModalOpen(true);
                            }}
                            disabled={!userHasEditPermission}
                            title={!userHasEditPermission ? "Permission de modification refusée" : ""}
                        >
                            Modifier
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => setIsDeleteDialogOpen(true)}
                            disabled={!userHasEditPermission}
                            title={!userHasEditPermission ? "Permission de suppression refusée" : ""}
                        >
                            Supprimer
                        </Button>
                    </Box>
                </Box>

                <Box display="flex" alignItems="center" gap={4} sx={{ mt: 3 }} flexWrap="wrap">
                    <Box display="flex" alignItems="center" gap={1}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                            Créé le {formatDate(ticketData.createdAt)}
                        </Typography>
                    </Box>
                    {ticketData.estimatedDate && (
                        <Box display="flex" alignItems="center" gap={1}>
                            <AccessTime fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                                Échéance: {formatDate(ticketData.estimatedDate)}
                            </Typography>
                        </Box>
                    )}
                    {ticketData.updatedAt && ticketData.updatedAt !== ticketData.createdAt && (
                        <Box display="flex" alignItems="center" gap={1}>
                            <AccessTime fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                                Modifié le {formatDate(ticketData.updatedAt)}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                        <Assignment sx={{ mr: 1 }} />
                        Informations du ticket
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Créateur
                        </Typography>
                        {ticketData.creator ? (
                            <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                                <Avatar>
                                    {ticketData.creator.firstName?.charAt(0) || (ticketData.creator as any).prenom?.charAt(0) || '?'}
                                    {ticketData.creator.lastName?.charAt(0) || (ticketData.creator as any).nom?.charAt(0) || '?'}
                                </Avatar>
                                <Box>
                                    <Typography>
                                        {ticketData.creator.firstName || (ticketData.creator as any).prenom || 'Inconnu'} {ticketData.creator.lastName || (ticketData.creator as any).nom || ''}
                                    </Typography>
                                    {showDebugInfo && (
                                        <Typography variant="caption" color="text.secondary">
                                            ID: {ticketData.creator.id}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        ) : (
                            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                                Information non disponible
                            </Typography>
                        )}
                    </Box>

                    {ticketData.assignees && ticketData.assignees.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Assigné à
                            </Typography>
                            <Box display="flex" gap={1} sx={{ mt: 1 }} flexWrap="wrap">
                                {ticketData.assignees.map((assignee: TicketAssignee) => (
                                    <Chip
                                        key={assignee.id}
                                        icon={<Person />}
                                        label={`${assignee.firstName || assignee.prenom || 'Inconnu'} ${assignee.lastName || assignee.nom || ''}`}
                                        variant="outlined"
                                        size="small"
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Commentaires ({commentsData.length})
                    </Typography>

                    <Box sx={{ mt: 3, mb: 3 }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Ajouter un commentaire..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            variant="outlined"
                        />
                        <Button
                            variant="contained"
                            onClick={handleAddComment}
                            disabled={!newComment.trim() || createCommentMutation.isPending}
                            sx={{ mt: 1 }}
                        >
                            {createCommentMutation.isPending ? 'Ajout...' : 'Ajouter un commentaire'}
                        </Button>
                    </Box>

                    <Divider />

                    {commentsLoading ? (
                        <Box sx={{ mt: 2 }}>
                            <LinearProgress />
                            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                                Chargement des commentaires...
                            </Typography>
                        </Box>
                    ) : commentsData.length === 0 ? (
                        <Typography color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
                            Aucun commentaire
                        </Typography>
                    ) : (
                        <List>
                            {commentsData.map((commentWrapper: CommentWithAuthor, index: number) => {
                                const comment = commentWrapper.comment || commentWrapper;
                                const author = commentWrapper.author || (comment as any).author;
                                const authorName = commentWrapper.authorName ||
                                    (author
                                        ? `${author.firstName || (author as any).prenom || ''} ${author.lastName || (author as any).nom || ''}`.trim()
                                        : 'Anonyme');
                                const nameParts = authorName.split(' ');
                                const initials = nameParts.length >= 2
                                    ? `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`
                                    : authorName.charAt(0);

                                const commentKey = comment.id || (comment as any)._id || `comment-${index}`;
                                const commentDate = comment.createdAt || (comment as any).created_at;
                                const commentContent = comment.content || 'Pas de contenu';

                                return (
                                    <ListItem
                                        key={commentKey}
                                        alignItems="flex-start"
                                        divider
                                    >
                                        <ListItemAvatar>
                                            <Avatar>
                                                {initials}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="subtitle2" component="span">
                                                        {authorName}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" component="span">
                                                        {formatDateTime(commentDate)}
                                                    </Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <Typography variant="body2" component="span" sx={{ mt: 1, display: 'block' }}>
                                                    {commentContent}
                                                </Typography>
                                            }
                                            primaryTypographyProps={{
                                                component: 'div'
                                            }}
                                            secondaryTypographyProps={{
                                                component: 'div'
                                            }}
                                        />
                                    </ListItem>
                                );
                            })}
                        </List>
                    )}
                </CardContent>
            </Card>

            <Dialog
                open={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Modifier le ticket</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Titre"
                        fullWidth
                        value={editedTicket.title}
                        onChange={(e) => setEditedTicket({ ...editedTicket, title: e.target.value })}
                        sx={{ mt: 2 }}
                        disabled={updateMutation.isPending}
                    />
                    <TextField
                        margin="dense"
                        label="Description"
                        fullWidth
                        multiline
                        rows={4}
                        value={editedTicket.description}
                        onChange={(e) => setEditedTicket({ ...editedTicket, description: e.target.value })}
                        sx={{ mt: 2 }}
                        disabled={updateMutation.isPending}
                    />
                    <TextField
                        select
                        margin="dense"
                        label="Statut"
                        fullWidth
                        value={editedTicket.status}
                        onChange={(e) => setEditedTicket({
                            ...editedTicket,
                            status: e.target.value as any
                        })}
                        sx={{ mt: 2 }}
                        disabled={updateMutation.isPending}
                    >
                        <MenuItem value="TODO">À faire</MenuItem>
                        <MenuItem value="IN_PROGRESS">En cours</MenuItem>
                        <MenuItem value="IN_VALIDATION">En validation</MenuItem>
                        <MenuItem value="DONE">Terminé</MenuItem>
                    </TextField>
                    <TextField
                        margin="dense"
                        label="Date estimée"
                        type="date"
                        fullWidth
                        value={editedTicket.estimatedDate}
                        onChange={(e) => setEditedTicket({ ...editedTicket, estimatedDate: e.target.value })}
                        sx={{ mt: 2 }}
                        InputLabelProps={{ shrink: true }}
                        disabled={updateMutation.isPending}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setIsEditModalOpen(false)}
                        disabled={updateMutation.isPending}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleEditSubmit}
                        variant="contained"
                        disabled={updateMutation.isPending}
                    >
                        {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
            >
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogContent>
                    <Typography>
                        Êtes-vous sûr de vouloir supprimer ce ticket ? Cette action est irréversible.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDeleteDialogOpen(false)}>Annuler</Button>
                    <Button
                        onClick={handleDelete}
                        color="error"
                        variant="contained"
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default TicketDetailPage;
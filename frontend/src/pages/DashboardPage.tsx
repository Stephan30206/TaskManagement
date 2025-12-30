import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
    Container,
    Typography,
    Box,
    Button,
    TextField,
    InputAdornment,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
    LinearProgress,
    Chip,
    Alert,
    IconButton,
    Badge,
    Menu,
    Divider,
    CircularProgress,
} from '@mui/material';
import {
    Search as SearchIcon,
    Add as AddIcon,
    TrendingUp,
    CheckCircle,
    Cancel,
    Archive,
    Refresh as RefreshIcon,
    Notifications as NotificationsIcon,
    Person as PersonIcon, // ICÔNE PROFIL AJOUTÉE
} from '@mui/icons-material';
import { projectsApi, notificationApi } from '../services/api';
import ProjectDetail from '../pages/ProjectDetail';
import type { Project, Notification } from '../services/types';

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [newProject, setNewProject] = useState({
        name: '',
        description: '',
        status: 'ACTIVE' as const,
    });
    const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const {
        data: projectsResponse,
        isLoading: projectsLoading,
        error: projectsError,
        refetch: refetchProjects,
    } = useQuery({
        queryKey: ['projects'],
        queryFn: () => projectsApi.getAll(),
        refetchOnWindowFocus: true,
    });

    const {
        data: unreadNotificationsResponse,
        isLoading: notificationsLoading,
        refetch: refetchNotifications
    } = useQuery({
        queryKey: ['unreadNotifications'],
        queryFn: () => notificationApi.getUnread(),
        refetchInterval: 30000,
    });

    useEffect(() => {
        if (unreadNotificationsResponse?.data) {
            const responseData = unreadNotificationsResponse.data;

            console.log('Réponse notifications:', responseData);

            let notificationsArray: Notification[] = [];

            if (responseData && typeof responseData === 'object') {
                if (responseData.data && Array.isArray(responseData.data)) {
                    notificationsArray = responseData.data;
                }
                else if (Array.isArray(responseData)) {
                    notificationsArray = responseData;
                }
                else if (Array.isArray((responseData as any).notifications)) {
                    notificationsArray = (responseData as any).notifications;
                }
                else if (Array.isArray((responseData as any).items)) {
                    notificationsArray = (responseData as any).items;
                }
            }

            console.log('Notifications extraites:', notificationsArray);

            if (Array.isArray(notificationsArray)) {
                setNotifications(notificationsArray.slice(0, 5));
            } else {
                setNotifications([]);
            }
        }
    }, [unreadNotificationsResponse]);

    const projects = projectsResponse?.data || [];

    const unreadCount = (() => {
        if (!unreadNotificationsResponse?.data) return 0;

        const responseData = unreadNotificationsResponse.data;

        console.log('Calcul unreadCount depuis:', responseData);

        if (Array.isArray(responseData)) {
            return responseData.filter((n: Notification) => !n.isRead).length;
        }

        if (responseData && typeof responseData === 'object') {
            if ((responseData as any).count !== undefined) {
                return (responseData as any).count;
            }
            if ((responseData as any).unreadCount !== undefined) {
                return (responseData as any).unreadCount;
            }
            if (Array.isArray((responseData as any).data)) {
                return (responseData as any).data.filter((n: Notification) => !n.isRead).length;
            }
            if (Array.isArray((responseData as any).notifications)) {
                return (responseData as any).notifications.filter((n: Notification) => !n.isRead).length;
            }
        }

        return 0;
    })();

    const calculateStats = () => {
        const totalProjects = projects.length;
        const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
        const inactiveProjects = projects.filter(p => p.status === 'INACTIVE').length;
        const archivedProjects = projects.filter(p => p.status === 'ARCHIVED').length;

        return {
            totalProjects,
            activeProjects,
            inactiveProjects,
            archivedProjects,
        };
    };

    const stats = calculateStats();

    const markAsReadMutation = useMutation({
        mutationFn: (notificationId: string) => notificationApi.markAsRead(notificationId),
        onSuccess: () => {
            refetchNotifications();
            enqueueSnackbar('Notification marquée comme lue', { variant: 'success' });
        },
        onError: (error: any) => {
            enqueueSnackbar(
                error.response?.data?.message || 'Erreur lors de la mise à jour',
                { variant: 'error' }
            );
        },
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: () => notificationApi.markAllAsRead(),
        onSuccess: () => {
            refetchNotifications();
            enqueueSnackbar('Toutes les notifications marquées comme lues', { variant: 'success' });
            handleNotificationClose();
        },
        onError: (error: any) => {
            enqueueSnackbar(
                error.response?.data?.message || 'Erreur lors de la mise à jour',
                { variant: 'error' }
            );
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => projectsApi.create(data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });

            setTimeout(() => {
                refetchProjects();
            }, 500);

            enqueueSnackbar('Projet créé avec succès', {
                variant: 'success',
                autoHideDuration: 3000,
            });

            setIsCreateModalOpen(false);
            setNewProject({ name: '', description: '', status: 'ACTIVE' });

            if (response?.data?.id) {
                setTimeout(() => {
                    navigate(`/project/${response.data.id}`);
                }, 1000);
            }
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                'Erreur lors de la création';
            enqueueSnackbar(errorMessage, {
                variant: 'error',
                autoHideDuration: 5000,
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => projectsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            refetchProjects();
            enqueueSnackbar('Projet supprimé avec succès', {
                variant: 'success',
                autoHideDuration: 3000,
            });
            setProjectToDelete(null);
        },
        onError: (error: any) => {
            enqueueSnackbar(
                error.response?.data?.message || 'Erreur lors de la suppression',
                { variant: 'error' }
            );
        },
    });

    const archiveMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            projectsApi.updateStatus(id, status),
        onSuccess: (_, { status }) => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            refetchProjects();
            enqueueSnackbar(
                `Projet ${status === 'ARCHIVED' ? 'archivé' : 'réactivé'} avec succès`,
                { variant: 'success' }
            );
        },
        onError: (error: any) => {
            enqueueSnackbar(
                error.response?.data?.message || 'Erreur lors de la modification',
                { variant: 'error' }
            );
        },
    });

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (project: Project) => {
        navigate(`/project/${project.id}/edit`);
    };

    const handleDelete = (project: Project) => {
        setProjectToDelete(project);
    };

    const handleArchive = (project: Project) => {
        const newStatus = project.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED';
        archiveMutation.mutate({ id: project.id, status: newStatus });
    };

    const handleViewDetails = (project: Project) => {
        navigate(`/project/${project.id}`);
    };

    const handleCreateSubmit = () => {
        if (!newProject.name.trim()) {
            enqueueSnackbar('Le nom du projet est requis', {
                variant: 'error',
                autoHideDuration: 3000,
            });
            return;
        }
        createMutation.mutate(newProject);
    };

    const handleRefresh = () => {
        refetchProjects();
        refetchNotifications();
        enqueueSnackbar('Tableau de bord rafraîchi', {
            variant: 'info',
            autoHideDuration: 2000,
        });
    };

    const handleProfileClick = () => {
        navigate('/profile');
    };

    const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
        setNotificationAnchor(event.currentTarget);
    };

    const handleNotificationClose = () => {
        setNotificationAnchor(null);
    };

    const handleNotificationItemClick = (notification: Notification) => {
        markAsReadMutation.mutate(notification.id);
        if (notification.actionUrl) {
            navigate(notification.actionUrl);
        } else if (notification.entityType === 'TICKET' && notification.projectId) {
            navigate(`/project/${notification.projectId}/tickets/${notification.entityId}`);
        } else if (notification.entityType === 'PROJECT' && notification.entityId) {
            navigate(`/project/${notification.entityId}`);
        }
        handleNotificationClose();
    };

    const handleMarkAllAsRead = () => {
        markAllAsReadMutation.mutate();
    };

    const getNotificationTypeColor = (type: string) => {
        switch (type) {
            case 'TICKET_ASSIGNED': return 'primary.main';
            case 'TICKET_COMMENTED': return 'info.main';
            case 'STATUS_CHANGED': return 'warning.main';
            case 'CHECKLIST_COMPLETED': return 'success.main';
            default: return 'text.primary';
        }
    };

    useEffect(() => {
        console.log('Projets chargés:', projects.length);
        console.log('Statistiques calculées:', stats);
        console.log('Notifications chargées:', notifications.length);
        console.log('Notifications non lues:', unreadCount);
    }, [projects, stats, notifications, unreadCount]);

    if (projectsLoading) {
        return (
            <Container sx={{ mt: 4 }}>
                <LinearProgress />
                <Typography sx={{ mt: 2, textAlign: 'center' }}>
                    Chargement des projets...
                </Typography>
            </Container>
        );
    }

    if (projectsError) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                    Erreur lors du chargement des projets: {projectsError.message}
                </Alert>
                <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={() => refetchProjects()}
                >
                    Réessayer
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                        Tableau de bord
                    </Typography>
                    <Box display="flex" gap={2} alignItems="center">
                        {/* BOUTON PROFIL AJOUTÉ */}
                        <IconButton
                            color="primary"
                            onClick={handleProfileClick}
                            sx={{
                                position: 'relative',
                                '&:hover': {
                                    bgcolor: 'action.hover',
                                },
                            }}
                            aria-label="Profil"
                        >
                            <PersonIcon />
                        </IconButton>

                        {/* Bouton de notifications */}
                        <IconButton
                            color="primary"
                            onClick={handleNotificationClick}
                            sx={{
                                position: 'relative',
                                '&:hover': {
                                    bgcolor: 'action.hover',
                                },
                            }}
                            aria-label={`Notifications (${unreadCount} non lues)`}
                            disabled={notificationsLoading}
                        >
                            <Badge
                                badgeContent={unreadCount}
                                color="error"
                                max={99}
                                sx={{
                                    '& .MuiBadge-badge': {
                                        fontSize: '0.75rem',
                                        height: '20px',
                                        minWidth: '20px',
                                    }
                                }}
                            >
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>

                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={handleRefresh}
                            disabled={projectsLoading}
                        >
                            Actualiser
                        </Button>
                    </Box>
                </Box>

                {/* Menu des notifications */}
                <Menu
                    anchorEl={notificationAnchor}
                    open={Boolean(notificationAnchor)}
                    onClose={handleNotificationClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    sx={{
                        '& .MuiPaper-root': {
                            minWidth: 350,
                            maxWidth: 400,
                            maxHeight: 400,
                            borderRadius: 2,
                        }
                    }}
                >
                    <Box sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Notifications ({unreadCount})
                            </Typography>
                            {unreadCount > 0 && (
                                <Button
                                    size="small"
                                    onClick={handleMarkAllAsRead}
                                    disabled={markAllAsReadMutation.isPending}
                                    sx={{ textTransform: 'none' }}
                                >
                                    {markAllAsReadMutation.isPending ? 'En cours...' : 'Tout marquer comme lu'}
                                </Button>
                            )}
                        </Box>
                        <Divider />
                    </Box>

                    {notificationsLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : notifications.length === 0 ? (
                        <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="textSecondary">
                                Aucune notification non lue
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                Vous êtes à jour !
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            {notifications.map((notification: Notification, index: number) => (
                                <Box key={notification.id}>
                                    <Box
                                        onClick={() => handleNotificationItemClick(notification)}
                                        sx={{
                                            px: 2,
                                            py: 1.5,
                                            cursor: 'pointer',
                                            bgcolor: notification.isRead ? 'inherit' : 'action.hover',
                                            '&:hover': {
                                                bgcolor: 'action.selected',
                                            },
                                            display: 'flex',
                                            flexDirection: 'column',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <Box
                                                sx={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    bgcolor: getNotificationTypeColor(notification.type),
                                                    opacity: notification.isRead ? 0.5 : 1
                                                }}
                                            />
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    fontWeight: 600,
                                                    color: getNotificationTypeColor(notification.type)
                                                }}
                                            >
                                                {notification.type?.replace(/_/g, ' ') || 'Notification'}
                                            </Typography>
                                        </Box>

                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            {notification.title || 'Sans titre'}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                                            {notification.message || 'Pas de message'}
                                        </Typography>

                                        {notification.senderName && (
                                            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                                                Par {notification.senderName}
                                            </Typography>
                                        )}

                                        <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                                            {notification.createdAt ?
                                                new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) :
                                                'Date inconnue'
                                            }
                                        </Typography>
                                    </Box>
                                    {index < notifications.length - 1 && <Divider />}
                                </Box>
                            ))}

                            {notifications.length > 0 && (
                                <>
                                    <Divider />
                                    <Box
                                        sx={{
                                            px: 2,
                                            py: 1.5,
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: 'action.hover' }
                                        }}
                                        onClick={() => {
                                            navigate('/notifications');
                                            handleNotificationClose();
                                        }}
                                    >
                                        <Typography variant="body2" color="primary">
                                            Voir toutes les notifications
                                        </Typography>
                                    </Box>
                                </>
                            )}
                        </>
                    )}
                </Menu>

                <Box display="flex" gap={2} sx={{ mb: 3 }} flexWrap="wrap">
                    <TextField
                        placeholder="Rechercher un projet..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ flex: 1, minWidth: 300 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setIsCreateModalOpen(true)}
                        disabled={createMutation.isPending}
                    >
                        {createMutation.isPending ? 'Création...' : 'Nouveau projet'}
                    </Button>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
                <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <TrendingUp fontSize="large" color="primary" />
                                <Box>
                                    <Typography color="text.secondary" gutterBottom>
                                        Projets totaux
                                    </Typography>
                                    <Typography variant="h4">
                                        {stats.totalProjects}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <CheckCircle fontSize="large" color="success" />
                                <Box>
                                    <Typography color="text.secondary" gutterBottom>
                                        Projets actifs
                                    </Typography>
                                    <Typography variant="h4">
                                        {stats.activeProjects}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Cancel fontSize="large" color="warning" />
                                <Box>
                                    <Typography color="text.secondary" gutterBottom>
                                        Projets inactifs
                                    </Typography>
                                    <Typography variant="h4">
                                        {stats.inactiveProjects}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Archive fontSize="large" color="action" />
                                <Box>
                                    <Typography color="text.secondary" gutterBottom>
                                        Projets archivés
                                    </Typography>
                                    <Typography variant="h4">
                                        {stats.archivedProjects}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h5" component="h2">
                        Mes projets
                    </Typography>
                    <Box display="flex" gap={1} alignItems="center">
                        <Chip
                            label={`${filteredProjects.length} projet(s)`}
                            color="primary"
                            variant="outlined"
                        />
                        <Chip
                            label={`Total: ${projects.length}`}
                            size="small"
                            variant="outlined"
                        />
                    </Box>
                </Box>

                {filteredProjects.length === 0 ? (
                    <Box textAlign="center" py={8} border={1} borderColor="divider" borderRadius={2}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            {searchTerm ? 'Aucun projet ne correspond à votre recherche' : 'Aucun projet'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Essayez de créer votre premier projet ou vérifiez votre connexion.
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setIsCreateModalOpen(true)}
                            sx={{ mt: 2, mr: 1 }}
                        >
                            Créer un projet
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={handleRefresh}
                            sx={{ mt: 2 }}
                        >
                            Rafraîchir
                        </Button>
                    </Box>
                ) : (
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: 3
                    }}>
                        {filteredProjects.map((project) => (
                            <ProjectDetail
                                key={project.id}
                                project={project}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onArchive={handleArchive}
                                onViewDetails={handleViewDetails}
                            />
                        ))}
                    </Box>
                )}
            </Box>

            <Dialog
                open={isCreateModalOpen}
                onClose={() => !createMutation.isPending && setIsCreateModalOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Nouveau projet</DialogTitle>
                <DialogContent>
                    {createMutation.isError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {createMutation.error?.response?.data?.message ||
                                createMutation.error?.message ||
                                'Erreur inconnue'}
                        </Alert>
                    )}
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Nom du projet"
                        fullWidth
                        value={newProject.name}
                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                        disabled={createMutation.isPending}
                        sx={{ mt: 2 }}
                        required
                        error={createMutation.isError}
                    />
                    <TextField
                        margin="dense"
                        label="Description"
                        fullWidth
                        multiline
                        rows={4}
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        disabled={createMutation.isPending}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        select
                        margin="dense"
                        label="Statut"
                        fullWidth
                        value={newProject.status}
                        onChange={(e) => setNewProject({ ...newProject, status: e.target.value as any })}
                        disabled={createMutation.isPending}
                        sx={{ mt: 2 }}
                    >
                        <MenuItem value="ACTIVE">Actif</MenuItem>
                        <MenuItem value="INACTIVE">Inactif</MenuItem>
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setIsCreateModalOpen(false)}
                        disabled={createMutation.isPending}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleCreateSubmit}
                        variant="contained"
                        disabled={createMutation.isPending || !newProject.name.trim()}
                    >
                        {createMutation.isPending ? 'Création en cours...' : 'Créer le projet'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={!!projectToDelete}
                onClose={() => !deleteMutation.isPending && setProjectToDelete(null)}
            >
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogContent>
                    <Typography>
                        Êtes-vous sûr de vouloir supprimer le projet "{projectToDelete?.name}" ?
                        Cette action est irréversible et supprimera également tous les tickets associés.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setProjectToDelete(null)}
                        disabled={deleteMutation.isPending}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={() => projectToDelete && deleteMutation.mutate(projectToDelete.id)}
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

export default DashboardPage;
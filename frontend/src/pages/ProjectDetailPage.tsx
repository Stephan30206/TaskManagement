import React, { useState } from 'react';
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    LinearProgress,
    Tabs,
    Tab,
    Fab,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    ArrowBack,
    CalendarToday,
    AccessTime,
    Archive,
    Unarchive,
    Group,
    ViewKanban as KanbanIcon,
    CalendarMonth as CalendarIcon,
    List as ListIcon,
    Assessment as AuditIcon,
    Label as LabelIcon,
    Attachment as AttachmentIcon,
} from '@mui/icons-material';
import { projectsApi, ticketsApi, userApi } from '../services/api';
import CreateTicketModal from '../components/CreateTicketModal';
import KanbanBoard from '../components/KanbanBoard';
import CalendarView from '../components/CalendarView';
import LabelsManager from '../components/LabelsManager';
import AuditLogViewer from '../components/AuditLogViewer';
import type { Ticket, Project } from '../services/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
    return (
        <div hidden={value !== index}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
};

const ProjectDetailPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const [currentTab, setCurrentTab] = useState(0);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editedProject, setEditedProject] = useState({
        name: '',
        description: '',
        status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
    });

    const {
        data: project,
        isLoading: projectLoading,
        error: projectError,
    } = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => projectsApi.getById(projectId!),
        enabled: !!projectId,
    });

    const {
        data: tickets,
    } = useQuery({
        queryKey: ['project-tickets', projectId],
        queryFn: () => ticketsApi.getByProject(projectId!),
        enabled: !!projectId,
    });

    useQuery({
        queryKey: ['all-users'],
        queryFn: () => userApi.getAllUsers(),
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => projectsApi.update(projectId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            enqueueSnackbar('Projet mis à jour avec succès', { variant: 'success' });
            setIsEditModalOpen(false);
        },
        onError: (error: any) => {
            enqueueSnackbar(
                error.response?.data?.message || 'Erreur lors de la mise à jour',
                { variant: 'error' }
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => projectsApi.delete(projectId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            enqueueSnackbar('Projet supprimé avec succès', { variant: 'success' });
            navigate('/dashboard');
        },
        onError: (error: any) => {
            enqueueSnackbar(
                error.response?.data?.message || 'Erreur lors de la suppression',
                { variant: 'error' }
            );
            setIsDeleteDialogOpen(false);
        },
    });

    const archiveMutation = useMutation({
        mutationFn: (status: 'ACTIVE' | 'ARCHIVED') =>
            projectsApi.updateStatus(projectId!, status),
        onSuccess: (_, status) => {
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
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

    React.useEffect(() => {
        if (project?.data) {
            setEditedProject({
                name: project.data.name,
                description: project.data.description,
                status: project.data.status,
            });
        }
    }, [project]);

    const handleEditSubmit = () => {
        updateMutation.mutate(editedProject);
    };

    const handleDelete = () => {
        deleteMutation.mutate();
    };

    const handleArchiveToggle = () => {
        if (project?.data) {
            archiveMutation.mutate(project.data.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'success';
            case 'INACTIVE':
                return 'warning';
            case 'ARCHIVED':
                return 'default';
            default:
                return 'default';
        }
    };

    const countTicketsByStatus = (status: string) => {
        if (!tickets?.data) return 0;
        return tickets.data.filter((ticket: Ticket) => ticket.status === status).length;
    };

    const formatDate = (date: Date) => {
        return format(new Date(date), 'dd MMMM yyyy', { locale: fr });
    };

    if (projectLoading) {
        return (
            <Container sx={{ mt: 4 }}>
                <LinearProgress />
            </Container>
        );
    }

    if (projectError || !project?.data) {
        return (
            <Container sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="h5" color="error">
                    Projet non trouvé
                </Typography>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/dashboard')}
                    sx={{ mt: 2 }}
                >
                    Retour au tableau de bord
                </Button>
            </Container>
        );
    }

    const projectData: Project = project.data;
    const ticketsData: Ticket[] = tickets?.data || [];

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/dashboard')}
                    sx={{ mb: 2 }}
                >
                    Retour
                </Button>

                <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                    <Box sx={{ flex: 1 }}>
                        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                            <Typography variant="h3" component="h1">
                                {projectData.name}
                            </Typography>
                            <Chip
                                label={projectData.status}
                                color={getStatusColor(projectData.status)}
                                variant="outlined"
                            />
                        </Box>
                        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
                            {projectData.description}
                        </Typography>
                    </Box>

                    <Box display="flex" gap={1} flexWrap="wrap">
                        <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => setIsEditModalOpen(true)}
                        >
                            Modifier
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={projectData.status === 'ARCHIVED' ? <Unarchive /> : <Archive />}
                            onClick={handleArchiveToggle}
                            disabled={archiveMutation.isPending}
                        >
                            {projectData.status === 'ARCHIVED' ? 'Désarchiver' : 'Archiver'}
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => setIsDeleteDialogOpen(true)}
                        >
                            Supprimer
                        </Button>
                    </Box>
                </Box>

                <Box display="flex" alignItems="center" gap={4} sx={{ mt: 3 }} flexWrap="wrap">
                    <Box display="flex" alignItems="center" gap={1}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                            Créé le {formatDate(projectData.createdAt)}
                        </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                        <AccessTime fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                            Dernière mise à jour le {formatDate(projectData.updatedAt)}
                        </Typography>
                    </Box>
                    {projectData.teamIds && projectData.teamIds.length > 0 && (
                        <Box display="flex" alignItems="center" gap={1}>
                            <Group fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                                {projectData.teamIds.length} membre(s)
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
                    <Card sx={{
                        flex: '1 1 200px',
                        minWidth: 200,
                        background: 'linear-gradient(135deg, #4facfe 0%, #00c6fb 100%)',
                        color: 'white'
                    }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <Typography variant="subtitle2">
                                    Total Tickets
                                </Typography>
                            </Box>
                            <Typography variant="h3" fontWeight="bold">
                                {ticketsData.length}
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom variant="subtitle2">
                                À faire
                            </Typography>
                            <Typography variant="h3" fontWeight="bold" color="#94a3b8">
                                {countTicketsByStatus('TODO')}
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom variant="subtitle2">
                                En cours
                            </Typography>
                            <Typography variant="h3" fontWeight="bold" color="#f59e0b">
                                {countTicketsByStatus('IN_PROGRESS')}
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom variant="subtitle2">
                                Terminés
                            </Typography>
                            <Typography variant="h3" fontWeight="bold" color="#10b981">
                                {countTicketsByStatus('DONE')}
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>

                <Card sx={{
                    background: 'linear-gradient(135deg, #FFEB3B 0%, #00BCD4 100%)',
                    color: 'white',
                }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            Actions rapides
                        </Typography>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            gap: 2,
                            mt: 2
                        }}>
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                startIcon={<AddIcon />}
                                onClick={() => setIsTicketModalOpen(true)}
                                sx={{
                                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                    backdropFilter: 'blur(10px)',
                                    '&:hover': {
                                        bgcolor: 'rgba(255, 255, 255, 0.3)',
                                    },
                                    py: 1.5,
                                    fontWeight: 'bold',
                                    flex: 1
                                }}
                            >
                                Créer un nouveau ticket
                            </Button>
                            <Button
                                fullWidth
                                variant="outlined"
                                size="large"
                                startIcon={<Group />}
                                onClick={() => navigate(`/project/${projectId}/members`)}
                                sx={{
                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                    color: 'white',
                                    '&:hover': {
                                        borderColor: 'white',
                                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                                    },
                                    py: 1.5,
                                    fontWeight: 'bold',
                                    flex: 1
                                }}
                            >
                                Gérer les membres ({projectData.teamIds?.length || 0})
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={currentTab}
                    onChange={(_, newValue) => setCurrentTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab icon={<KanbanIcon />} label="Tableau Kanban" iconPosition="start" />
                    <Tab icon={<CalendarIcon />} label="Calendrier" iconPosition="start" />
                    <Tab icon={<ListIcon />} label="Liste" iconPosition="start" />
                    <Tab icon={<LabelIcon />} label="Labels" iconPosition="start" />
                    <Tab icon={<AttachmentIcon />} label="Fichiers" iconPosition="start" />
                    <Tab icon={<AuditIcon />} label="Audit" iconPosition="start" />
                </Tabs>
            </Box>

            <TabPanel value={currentTab} index={0}>
                <KanbanBoard />
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
                <CalendarView />
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Tous les tickets ({ticketsData.length})
                        </Typography>
                        {ticketsData.map((ticket: Ticket) => (
                            <Box
                                key={ticket.id}
                                onClick={() => navigate(`/ticket/${ticket.id}`)}
                                sx={{
                                    p: 2,
                                    mb: 1,
                                    borderRadius: 1,
                                    border: 1,
                                    borderColor: 'divider',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: 'grey.50',
                                    },
                                }}
                            >
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="medium">
                                            {ticket.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {ticket.description?.substring(0, 100)}...
                                        </Typography>
                                    </Box>
                                    <Chip label={ticket.status} size="small" />
                                </Box>
                            </Box>
                        ))}
                    </CardContent>
                </Card>
            </TabPanel>

            <TabPanel value={currentTab} index={3}>
                {projectId && <LabelsManager projectId={projectId} />}
            </TabPanel>

            <TabPanel value={currentTab} index={4}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Fichiers du projet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Les fichiers sont associés aux tickets individuels.
                            Naviguez vers un ticket spécifique pour voir et gérer ses fichiers.
                        </Typography>
                        <Box display="flex" flexDirection="column" gap={2}>
                            {ticketsData.slice(0, 5).map((ticket: Ticket) => (
                                <Button
                                    key={ticket.id}
                                    variant="outlined"
                                    onClick={() => navigate(`/ticket/${ticket.id}`)}
                                    sx={{ justifyContent: 'space-between' }}
                                >
                                    <Typography variant="body2">
                                        {ticket.title}
                                    </Typography>
                                    <Chip
                                        label="Voir fichiers"
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                </Button>
                            ))}
                        </Box>
                    </CardContent>
                </Card>
            </TabPanel>

            <TabPanel value={currentTab} index={5}>
                {projectId && <AuditLogViewer projectId={projectId} />}
            </TabPanel>

            <Fab
                color="primary"
                aria-label="add ticket"
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                }}
                onClick={() => setIsTicketModalOpen(true)}
            >
                <AddIcon />
            </Fab>

            <Dialog open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Modifier le projet</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Nom du projet"
                        fullWidth
                        value={editedProject.name}
                        onChange={(e) => setEditedProject({ ...editedProject, name: e.target.value })}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="Description"
                        fullWidth
                        multiline
                        rows={4}
                        value={editedProject.description}
                        onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        select
                        margin="dense"
                        label="Statut"
                        fullWidth
                        value={editedProject.status}
                        onChange={(e) => setEditedProject({
                            ...editedProject,
                            status: e.target.value as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
                        })}
                        sx={{ mt: 2 }}
                    >
                        <MenuItem value="ACTIVE">Actif</MenuItem>
                        <MenuItem value="INACTIVE">Inactif</MenuItem>
                        <MenuItem value="ARCHIVED">Archivé</MenuItem>
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsEditModalOpen(false)}>Annuler</Button>
                    <Button
                        onClick={handleEditSubmit}
                        variant="contained"
                        disabled={updateMutation.isPending}
                    >
                        {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogContent>
                    <Typography>
                        Êtes-vous sûr de vouloir supprimer le projet "{projectData.name}" ?
                        Cette action est irréversible et supprimera également tous les tickets associés.
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

            {projectId && (
                <CreateTicketModal
                    open={isTicketModalOpen}
                    onClose={() => setIsTicketModalOpen(false)}
                    projectId={projectId}
                    projectName={projectData.name}
                />
            )}
        </Container>
    );
};

export default ProjectDetailPage;
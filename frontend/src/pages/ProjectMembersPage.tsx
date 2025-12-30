import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
    Container,
    Typography,
    Box,
    Button,
    Card,
    CardContent,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    TextField,
    Autocomplete,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    LinearProgress,
} from '@mui/material';
import {
    ArrowBack,
    Delete as DeleteIcon,
    PersonAdd as PersonAddIcon,
    AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { projectsApi, userApi } from '../services/api';
import type { User, Project } from '../services/types';

const ProjectMembersPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [memberType, setMemberType] = useState<'admin' | 'team'>('team');

    const { data: project, isLoading: projectLoading } = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => projectsApi.getById(projectId!),
        enabled: !!projectId,
    });

    const { data: members, isLoading: membersLoading } = useQuery({
        queryKey: ['project-members', projectId],
        queryFn: () => projectsApi.getMembers(projectId!),
        enabled: !!projectId,
    });

    const { data: allUsers } = useQuery({
        queryKey: ['all-users'],
        queryFn: () => userApi.getAllUsers(),
    });

    const addTeamMemberMutation = useMutation({
        mutationFn: (memberId: string) => projectsApi.addTeamMember(projectId!, memberId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
            enqueueSnackbar('Membre ajouté avec succès', { variant: 'success' });
            setIsAddMemberDialogOpen(false);
            setSelectedUser(null);
        },
        onError: (error: any) => {
            enqueueSnackbar(
                error.response?.data?.message || 'Erreur lors de l\'ajout du membre',
                { variant: 'error' }
            );
        },
    });

    const addAdminMutation = useMutation({
        mutationFn: (adminId: string) => projectsApi.addAdmin(projectId!, adminId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
            enqueueSnackbar('Administrateur ajouté avec succès', { variant: 'success' });
            setIsAddMemberDialogOpen(false);
            setSelectedUser(null);
        },
        onError: (error: any) => {
            enqueueSnackbar(
                error.response?.data?.message || 'Erreur lors de l\'ajout de l\'administrateur',
                { variant: 'error' }
            );
        },
    });

    const removeTeamMemberMutation = useMutation({
        mutationFn: (memberId: string) => projectsApi.removeTeamMember(projectId!, memberId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
            enqueueSnackbar('Membre retiré avec succès', { variant: 'success' });
        },
        onError: (error: any) => {
            enqueueSnackbar(
                error.response?.data?.message || 'Erreur lors du retrait du membre',
                { variant: 'error' }
            );
        },
    });

    const removeAdminMutation = useMutation({
        mutationFn: (adminId: string) => projectsApi.removeAdmin(projectId!, adminId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
            enqueueSnackbar('Administrateur retiré avec succès', { variant: 'success' });
        },
        onError: (error: any) => {
            enqueueSnackbar(
                error.response?.data?.message || 'Erreur lors du retrait de l\'administrateur',
                { variant: 'error' }
            );
        },
    });

    const handleAddMember = () => {
        if (selectedUser) {
            if (memberType === 'admin') {
                addAdminMutation.mutate(selectedUser.id);
            } else {
                addTeamMemberMutation.mutate(selectedUser.id);
            }
        }
    };

    const handleRemoveMember = (memberId: string, isAdmin: boolean) => {
        if (isAdmin) {
            removeAdminMutation.mutate(memberId);
        } else {
            removeTeamMemberMutation.mutate(memberId);
        }
    };

    const isUserAdmin = (userId: string) => {
        return project?.data?.adminIds?.includes(userId) || false;
    };

    const isUserOwner = (userId: string) => {
        return project?.data?.ownerId === userId;
    };

    if (projectLoading || membersLoading) {
        return (
            <Container sx={{ mt: 4 }}>
                <LinearProgress />
            </Container>
        );
    }

    const projectData: Project = project?.data!;
    const membersData: User[] = members?.data || [];
    const usersData: User[] = allUsers?.data || [];

    const availableUsers = usersData.filter(
        user => !membersData.some(member => member.id === user.id)
    );

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate(`/project/${projectId}`)}
                    sx={{ mb: 2 }}
                >
                    Retour au projet
                </Button>

                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                    <Typography variant="h4" component="h1">
                        Gestion des membres - {projectData?.name}
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<PersonAddIcon />}
                        onClick={() => setIsAddMemberDialogOpen(true)}
                    >
                        Ajouter un membre
                    </Button>
                </Box>
            </Box>

            {projectData?.owner && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Propriétaire du projet
                        </Typography>
                        <List>
                            <ListItem>
                                <ListItemAvatar>
                                    <Avatar>
                                        {projectData.owner.firstName?.charAt(0)}
                                        {projectData.owner.lastName?.charAt(0)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={`${projectData.owner.firstName} ${projectData.owner.lastName}`}
                                    secondary={projectData.owner.email}
                                />
                                <Chip label="Propriétaire" color="primary" />
                            </ListItem>
                        </List>
                    </CardContent>
                </Card>
            )}

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Administrateurs ({projectData?.adminIds?.length || 0})
                    </Typography>
                    <List>
                        {membersData
                            .filter(member => isUserAdmin(member.id) && !isUserOwner(member.id))
                            .map(admin => (
                                <ListItem key={admin.id}>
                                    <ListItemAvatar>
                                        <Avatar>
                                            {admin.firstName?.charAt(0)}
                                            {admin.lastName?.charAt(0)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={`${admin.firstName} ${admin.lastName}`}
                                        secondary={admin.email}
                                    />
                                    <Chip
                                        icon={<AdminIcon />}
                                        label="Admin"
                                        color="secondary"
                                        size="small"
                                        sx={{ mr: 1 }}
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleRemoveMember(admin.id, true)}
                                            disabled={removeAdminMutation.isPending}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        {(!projectData?.adminIds || projectData.adminIds.length === 0) && (
                            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                                Aucun administrateur supplémentaire
                            </Typography>
                        )}
                    </List>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Membres de l'équipe ({membersData.length})
                    </Typography>
                    <List>
                        {membersData.map(member => (
                            <ListItem key={member.id}>
                                <ListItemAvatar>
                                    <Avatar>
                                        {member.firstName?.charAt(0)}
                                        {member.lastName?.charAt(0)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={`${member.firstName} ${member.lastName}`}
                                    secondary={member.email}
                                />
                                {isUserAdmin(member.id) && (
                                    <Chip
                                        icon={<AdminIcon />}
                                        label="Admin"
                                        color="secondary"
                                        size="small"
                                        sx={{ mr: 1 }}
                                    />
                                )}
                                {isUserOwner(member.id) && (
                                    <Chip
                                        label="Propriétaire"
                                        color="primary"
                                        size="small"
                                        sx={{ mr: 1 }}
                                    />
                                )}
                                <ListItemSecondaryAction>
                                    {!isUserOwner(member.id) && (
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleRemoveMember(member.id, false)}
                                            disabled={removeTeamMemberMutation.isPending}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    )}
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                </CardContent>
            </Card>

            <Dialog
                open={isAddMemberDialogOpen}
                onClose={() => setIsAddMemberDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Ajouter un membre</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Autocomplete
                            options={availableUsers}
                            getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
                            value={selectedUser}
                            onChange={(_, newValue) => setSelectedUser(newValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Sélectionner un utilisateur"
                                    placeholder="Rechercher..."
                                />
                            )}
                        />

                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Type de membre
                            </Typography>
                            <Box display="flex" gap={1}>
                                <Chip
                                    label="Membre de l'équipe"
                                    onClick={() => setMemberType('team')}
                                    color={memberType === 'team' ? 'primary' : 'default'}
                                    variant={memberType === 'team' ? 'filled' : 'outlined'}
                                />
                                <Chip
                                    label="Administrateur"
                                    icon={<AdminIcon />}
                                    onClick={() => setMemberType('admin')}
                                    color={memberType === 'admin' ? 'secondary' : 'default'}
                                    variant={memberType === 'admin' ? 'filled' : 'outlined'}
                                />
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setIsAddMemberDialogOpen(false);
                        setSelectedUser(null);
                    }}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleAddMember}
                        variant="contained"
                        disabled={
                            !selectedUser ||
                            addTeamMemberMutation.isPending ||
                            addAdminMutation.isPending
                        }
                    >
                        {(addTeamMemberMutation.isPending || addAdminMutation.isPending)
                            ? 'Ajout...'
                            : 'Ajouter'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default ProjectMembersPage;
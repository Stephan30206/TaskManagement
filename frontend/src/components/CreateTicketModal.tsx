import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    MenuItem,
    Box,
    Chip,
    Autocomplete,
    CircularProgress,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { ticketApi, userApi } from '../services/api';
import type { User } from '../services/types';

interface CreateTicketModalProps {
    open: boolean;
    onClose: () => void;
    projectId: string;
    projectName: string;
}

interface TicketFormData {
    title: string;
    description: string;
    status: 'TODO' | 'IN_PROGRESS' | 'IN_VALIDATION' | 'DONE';
    estimatedDate: string;
    assigneeIds: string[];
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
                                                                 open,
                                                                 onClose,
                                                                 projectId,
                                                                 projectName,
                                                             }) => {
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<TicketFormData>({
        title: '',
        description: '',
        status: 'TODO',
        estimatedDate: '',
        assigneeIds: [],
    });

    const { data: usersResponse, isLoading: usersLoading } = useQuery({
        queryKey: ['all-users'],
        queryFn: () => userApi.getAllUsers(),
    });

    const users = usersResponse?.data || [];

    const createMutation = useMutation({
        mutationFn: (data: any) => ticketApi.create(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-tickets', projectId] });
            enqueueSnackbar('Ticket créé avec succès', { variant: 'success' });
            handleClose();
        },
        onError: (error: any) => {
            enqueueSnackbar(
                error.response?.data?.message || 'Erreur lors de la création du ticket',
                { variant: 'error' }
            );
        },
    });

    const handleClose = () => {
        setFormData({
            title: '',
            description: '',
            status: 'TODO',
            estimatedDate: '',
            assigneeIds: [],
        });
        onClose();
    };

    const handleSubmit = () => {
        if (!formData.title.trim()) {
            enqueueSnackbar('Le titre est requis', { variant: 'error' });
            return;
        }

        const ticketData = {
            ...formData,
            projectId,
            estimatedDate: formData.estimatedDate ? new Date(formData.estimatedDate) : undefined,
        };

        createMutation.mutate(ticketData);
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Nouveau ticket - {projectName}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2 }}>
                    <TextField
                        fullWidth
                        label="Titre du ticket"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        margin="normal"
                        required
                    />

                    <TextField
                        fullWidth
                        label="Description"
                        multiline
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        margin="normal"
                    />

                    <TextField
                        select
                        fullWidth
                        label="Statut"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        margin="normal"
                    >
                        <MenuItem value="TODO">À faire</MenuItem>
                        <MenuItem value="IN_PROGRESS">En cours</MenuItem>
                        <MenuItem value="IN_VALIDATION">En validation</MenuItem>
                        <MenuItem value="DONE">Terminé</MenuItem>
                    </TextField>

                    <TextField
                        fullWidth
                        label="Date estimée"
                        type="date"
                        value={formData.estimatedDate}
                        onChange={(e) => setFormData({ ...formData, estimatedDate: e.target.value })}
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                    />

                    <Autocomplete
                        multiple
                        options={users}
                        loading={usersLoading}
                        getOptionLabel={(option: User) => `${option.firstName} ${option.lastName}`}
                        value={users.filter(user => formData.assigneeIds.includes(user.id))}
                        onChange={(_, newValue) => {
                            setFormData({
                                ...formData,
                                assigneeIds: newValue.map(user => user.id),
                            });
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Assigner à"
                                margin="normal"
                                placeholder="Rechercher des utilisateurs..."
                            />
                        )}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => {
                                const { key, ...chipProps } = getTagProps({ index });
                                return (
                                    <Chip
                                        key={key}
                                        label={`${option.firstName} ${option.lastName}`}
                                        {...chipProps}
                                        size="small"
                                    />
                                );
                            })
                        }
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Annuler</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={createMutation.isPending}
                >
                    {createMutation.isPending ? (
                        <CircularProgress size={24} />
                    ) : (
                        'Créer le ticket'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateTicketModal;
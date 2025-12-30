import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box, Button, Card, CardContent, Chip, CircularProgress, Dialog,
    DialogActions, DialogContent, DialogTitle, TextField, Typography,
    Grid, Stack, IconButton, Tooltip, Alert, AlertTitle
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useSnackbar } from 'notistack';
import { labelApi } from '../services/api';
import type { TicketLabel, CreateLabelData, UpdateLabelData } from '../services/types';

interface LabelManagerProps {
    projectId: string;
}

export default function LabelsManager({ projectId }: LabelManagerProps) {
    const [openDialog, setOpenDialog] = useState(false);
    const [editingLabel, setEditingLabel] = useState<TicketLabel | null>(null);
    const [labelName, setLabelName] = useState('');
    const [labelColor, setLabelColor] = useState('#1976D2');
    const [labelDescription, setLabelDescription] = useState('');
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const { data: labelsResponse, isLoading, isError, error } = useQuery({
        queryKey: ['labels', projectId],
        queryFn: () => labelApi.getByProject(projectId),
    });

    const labels = labelsResponse?.data ?? [];

    const createMutation = useMutation({
        mutationFn: (data: CreateLabelData) => labelApi.create(projectId, data),
        onSuccess: () => {
            enqueueSnackbar('Label créé avec succès!', { variant: 'success' });
            resetForm();
            setOpenDialog(false);
            queryClient.invalidateQueries({ queryKey: ['labels', projectId] });
        },
        onError: (error: any) => {
            const status = error.response?.status;
            if (status === 403) {
                enqueueSnackbar('Vous n\'avez pas les permissions pour créer un label', { variant: 'error' });
            } else {
                enqueueSnackbar('Erreur lors de la création du label', { variant: 'error' });
            }
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: UpdateLabelData) => labelApi.update(editingLabel!.id, data),
        onSuccess: () => {
            enqueueSnackbar('Label mis à jour avec succès!', { variant: 'success' });
            resetForm();
            setOpenDialog(false);
            queryClient.invalidateQueries({ queryKey: ['labels', projectId] });
        },
        onError: (error: any) => {
            const status = error.response?.status;
            if (status === 403) {
                enqueueSnackbar('Vous n\'avez pas les permissions pour modifier ce label', { variant: 'error' });
            } else {
                enqueueSnackbar('Erreur lors de la mise à jour du label', { variant: 'error' });
            }
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (labelId: string) => labelApi.delete(labelId),
        onSuccess: () => {
            enqueueSnackbar('Label supprimé avec succès!', { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['labels', projectId] });
        },
        onError: (error: any) => {
            const status = error.response?.status;
            if (status === 403) {
                enqueueSnackbar('Vous n\'avez pas les permissions pour supprimer ce label', { variant: 'error' });
            } else {
                enqueueSnackbar('Erreur lors de la suppression du label', { variant: 'error' });
            }
        },
    });

    const resetForm = () => {
        setLabelName('');
        setLabelColor('#1976D2');
        setLabelDescription('');
        setEditingLabel(null);
    };

    const handleCreateClick = () => {
        resetForm();
        setOpenDialog(true);
    };

    const handleEditClick = (label: TicketLabel) => {
        setEditingLabel(label);
        setLabelName(label.name);
        setLabelColor(label.color);
        setLabelDescription(label.description || '');
        setOpenDialog(true);
    };

    const handleSave = async () => {
        if (!labelName.trim()) {
            enqueueSnackbar('Le nom du label est requis', { variant: 'warning' });
            return;
        }

        const data = {
            name: labelName,
            color: labelColor,
            description: labelDescription,
        };

        if (editingLabel) {
            await updateMutation.mutateAsync(data as UpdateLabelData);
        } else {
            await createMutation.mutateAsync(data as CreateLabelData);
        }
    };

    const handleDelete = (labelId: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce label?')) {
            deleteMutation.mutate(labelId);
        }
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                <CircularProgress />
            </Box>
        );
    }

    if (isError) {
        return (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
                <AlertTitle sx={{ fontWeight: 600 }}>Erreur d'accès</AlertTitle>
                {error instanceof Error && error.message === 'Request failed with status code 403' ? (
                    <>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Vous n'avez pas les permissions pour accéder aux labels de ce projet.
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            Contactez un administrateur du projet pour obtenir les permissions appropriées.
                        </Typography>
                    </>
                ) : (
                    <Typography variant="body2">
                        {error instanceof Error ? error.message : 'Erreur inconnue'}
                    </Typography>
                )}
            </Alert>
        );
    }

    const colorOptions = [
        '#1976D2', '#D32F2F', '#388E3C', '#F57C00',
        '#7B1FA2', '#00BCD4', '#FBC02D', '#FF5722',
        '#00ACC1', '#C62828', '#558B2F', '#E91E63'
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        🏷️ Labels du projet
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        {labels.length} label{labels.length !== 1 ? 's' : ''} créé{labels.length !== 1 ? 's' : ''}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateClick}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                    Nouveau label
                </Button>
            </Box>

            {labels.length === 0 ? (
                <Card sx={{ borderRadius: 2, p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                        <ErrorOutlineIcon sx={{ fontSize: 40, color: 'action.disabled' }} />
                        <Typography variant="body2" color="textSecondary">
                            Aucun label créé pour le moment.
                        </Typography>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={handleCreateClick}
                        >
                            Créer le premier label
                        </Button>
                    </Box>
                </Card>
            ) : (
                <Grid container spacing={2}>
                    {labels.map((label: TicketLabel) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={label.id} component="div">
                            <Card
                                sx={{
                                    borderRadius: 2,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    }
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Chip
                                                label={label.name}
                                                style={{
                                                    backgroundColor: label.color,
                                                    color: 'white',
                                                    fontWeight: 600,
                                                    height: 32,
                                                    fontSize: '0.9rem',
                                                }}
                                            />
                                            {label.description && (
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        mt: 1,
                                                        display: 'block',
                                                        color: 'text.secondary',
                                                        wordBreak: 'break-word'
                                                    }}
                                                >
                                                    {label.description}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Stack direction="row" spacing={0.5}>
                                            <Tooltip title="Modifier">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEditClick(label)}
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
                                                    onClick={() => handleDelete(label.id)}
                                                    disabled={deleteMutation.isPending}
                                                    sx={{
                                                        '&:hover': { bgcolor: 'error.lighter' }
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
                    {editingLabel ? '✏️ Modifier le label' : '➕ Créer un nouveau label'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {/* Label Name Input */}
                        <TextField
                            autoFocus
                            fullWidth
                            label="Nom du label *"
                            placeholder="ex: Important, Urgent, Documentation..."
                            value={labelName}
                            onChange={(e) => setLabelName(e.target.value)}
                            disabled={createMutation.isPending || updateMutation.isPending}
                            variant="outlined"
                            size="small"
                        />

                        <TextField
                            fullWidth
                            label="Description (optionnel)"
                            placeholder="Décrivez l'utilisation de ce label..."
                            multiline
                            rows={2}
                            value={labelDescription}
                            onChange={(e) => setLabelDescription(e.target.value)}
                            disabled={createMutation.isPending || updateMutation.isPending}
                            variant="outlined"
                            size="small"
                        />

                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                                Couleur du label
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1 }}>
                                {colorOptions.map((color) => (
                                    <Tooltip key={color} title="Sélectionner">
                                        <Box
                                            onClick={() => setLabelColor(color)}
                                            sx={{
                                                width: '100%',
                                                aspectRatio: '1',
                                                bgcolor: color,
                                                borderRadius: 1,
                                                cursor: 'pointer',
                                                border: labelColor === color ? '3px solid' : '2px solid',
                                                borderColor: labelColor === color ? '#000' : 'transparent',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    transform: 'scale(1.05)',
                                                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                                                },
                                            }}
                                        />
                                    </Tooltip>
                                ))}
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                Aperçu
                            </Typography>
                            <Chip
                                label={labelName || 'Aperçu du label'}
                                style={{
                                    backgroundColor: labelColor,
                                    color: 'white',
                                    fontWeight: 600,
                                    height: 36,
                                    fontSize: '1rem'
                                }}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button
                        onClick={() => setOpenDialog(false)}
                        variant="outlined"
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={
                            !labelName.trim() ||
                            createMutation.isPending ||
                            updateMutation.isPending
                        }
                    >
                        {editingLabel ? 'Mettre à jour' : 'Créer'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
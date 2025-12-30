import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box, Card, CardContent, Typography, Button, List,
    ListItem, ListItemText, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, Alert, LinearProgress
} from '@mui/material';
import {
    Add, Link, Warning, CheckCircle
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { dependencyApi } from '../services/api';

interface DependencyManagerProps {
    ticketId: string;
    projectId: string;
}

const DependencyManager: React.FC<DependencyManagerProps> = ({ ticketId, projectId }) => {
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dependsOnTicketId, setDependsOnTicketId] = useState('');
    const [relationshipType, setRelationshipType] = useState('BLOCKING');

    const { data: dependencies, isLoading } = useQuery({
        queryKey: ['dependencies', ticketId],
        queryFn: () => dependencyApi.getByTicket(ticketId),
        enabled: !!ticketId,
    });

    const { data: blockedBy } = useQuery({
        queryKey: ['blocked-by', ticketId],
        queryFn: () => dependencyApi.getBlockedBy(ticketId),
        enabled: !!ticketId,
    });

    const { data: canCompleteData } = useQuery({
        queryKey: ['can-complete', ticketId],
        queryFn: () => dependencyApi.canBeCompleted(ticketId),
        enabled: !!ticketId,
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => dependencyApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dependencies', ticketId] });
            queryClient.invalidateQueries({ queryKey: ['blocked-by', ticketId] });
            queryClient.invalidateQueries({ queryKey: ['can-complete', ticketId] });
            setIsDialogOpen(false);
            setDependsOnTicketId('');
            enqueueSnackbar('Dépendance créée', { variant: 'success' });
        },
    });

    const handleCreateDependency = () => {
        if (!dependsOnTicketId.trim()) {
            enqueueSnackbar('Veuillez saisir l\'ID du ticket', { variant: 'error' });
            return;
        }

        createMutation.mutate({
            dependentTicketId: ticketId,
            dependsOnTicketId,
            projectId,
            relationshipType,
        });
    };

    return (
        <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
                Dépendances
            </Typography>

            {canCompleteData?.data && (
                <Alert
                    severity={canCompleteData.data.canComplete ? 'success' : 'warning'}
                    sx={{ mb: 3 }}
                    icon={canCompleteData.data.canComplete ? <CheckCircle /> : <Warning />}
                >
                    {canCompleteData.data.canComplete
                        ? 'Ce ticket peut être complété'
                        : `Impossible de compléter: ${canCompleteData.data.blockingReason}`}
                </Alert>
            )}

            <Box display="flex" gap={2}>
                <Card sx={{ flex: 1 }}>
                    <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="subtitle1" fontWeight="bold">
                                Dépend de
                            </Typography>
                            <Button
                                size="small"
                                startIcon={<Add />}
                                onClick={() => setIsDialogOpen(true)}
                            >
                                Ajouter
                            </Button>
                        </Box>

                        {isLoading ? (
                            <LinearProgress />
                        ) : dependencies?.data?.data?.length === 0 ? (
                            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                                Aucune dépendance
                            </Typography>
                        ) : (
                            <List dense>
                                {dependencies?.data?.data?.map((dep: any) => (
                                    <ListItem key={dep.id} divider>
                                        <ListItemText
                                            primary={`Ticket #${dep.dependsOnTicketId.substring(0, 8)}`}
                                            secondary={
                                                <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
                                                    <Chip
                                                        label={dep.relationshipType}
                                                        size="small"
                                                        variant="outlined"
                                                        icon={<Link fontSize="small" />}
                                                    />
                                                    {dep.description && (
                                                        <Typography variant="caption">
                                                            {dep.description}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </CardContent>
                </Card>

                <Card sx={{ flex: 1 }}>
                    <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                            Bloque
                        </Typography>

                        {blockedBy?.data?.data?.length === 0 ? (
                            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                                Aucun ticket bloqué
                            </Typography>
                        ) : (
                            <List dense>
                                {blockedBy?.data?.data?.map((dep: any) => (
                                    <ListItem key={dep.id} divider>
                                        <ListItemText
                                            primary={`Ticket #${dep.dependentTicketId.substring(0, 8)}`}
                                            secondary={
                                                <Chip
                                                    label={dep.relationshipType}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ mt: 0.5 }}
                                                />
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </CardContent>
                </Card>
            </Box>

            <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Ajouter une dépendance</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            fullWidth
                            label="ID du ticket requis"
                            value={dependsOnTicketId}
                            onChange={(e) => setDependsOnTicketId(e.target.value)}
                            placeholder="Saisir l'ID du ticket..."
                            helperText="Le ticket courant dépendra de celui-ci"
                        />
                        <TextField
                            select
                            fullWidth
                            label="Type de relation"
                            value={relationshipType}
                            onChange={(e) => setRelationshipType(e.target.value)}
                        >
                            <MenuItem value="BLOCKING">Bloquant</MenuItem>
                            <MenuItem value="RELATED_TO">Lié à</MenuItem>
                            <MenuItem value="BLOCKED_BY">Bloqué par</MenuItem>
                        </TextField>
                        {dependsOnTicketId === ticketId && (
                            <Alert severity="error">
                                Un ticket ne peut pas dépendre de lui-même !
                            </Alert>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                    <Button
                        onClick={handleCreateDependency}
                        variant="contained"
                        disabled={
                            !dependsOnTicketId.trim() ||
                            dependsOnTicketId === ticketId ||
                            createMutation.isPending
                        }
                    >
                        {createMutation.isPending ? 'Création...' : 'Créer'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DependencyManager;
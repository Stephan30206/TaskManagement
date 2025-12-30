import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box, Card, CardContent, Typography, TextField, Button,
    List, ListItem, ListItemIcon, ListItemText, Checkbox, LinearProgress, Chip,
    CircularProgress
} from '@mui/material';
import {
    Add, CheckCircle, RadioButtonUnchecked
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { checklistApi } from '../services/api';

interface ChecklistManagerProps {
    ticketId: string;
    projectId: string;
}

const ChecklistManager: React.FC<ChecklistManagerProps> = ({ ticketId}) => {
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const [newItem, setNewItem] = useState('');
    const [newChecklist, setNewChecklist] = useState({ title: '', description: '' });

    const { data: checklists, isLoading } = useQuery({
        queryKey: ['checklists', ticketId],
        queryFn: () => checklistApi.getByTicket(ticketId),
        enabled: !!ticketId,
    });

    const createChecklistMutation = useMutation({
        mutationFn: () => checklistApi.create(ticketId, newChecklist),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checklists', ticketId] });
            setNewChecklist({ title: '', description: '' });
            enqueueSnackbar('Checklist créée', { variant: 'success' });
        },
    });

    const addItemMutation = useMutation({
        mutationFn: ({ checklistId, title }: { checklistId: string; title: string }) =>
            checklistApi.addItem(checklistId, { title }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checklists', ticketId] });
            setNewItem('');
            enqueueSnackbar('Item ajouté', { variant: 'success' });
        },
    });

    const toggleItemMutation = useMutation({
        mutationFn: ({ checklistId, itemId, completed }: {
            checklistId: string;
            itemId: string;
            completed: boolean;
        }) => completed
            ? checklistApi.uncompleteItem(checklistId, itemId)
            : checklistApi.completeItem(checklistId, itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checklists', ticketId] });
        },
    });

    const calculateProgress = (items: any[]) => {
        if (!items || items.length === 0) return 0;
        const completed = items.filter(item => item.completed).length;
        return Math.round((completed / items.length) * 100);
    };

    const handleAddItem = (checklistId: string) => {
        if (newItem.trim()) {
            addItemMutation.mutate({ checklistId, title: newItem });
        }
    };

    return (
        <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
                Checklists
            </Typography>

            {/* Créer une nouvelle checklist */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                        Nouvelle Checklist
                    </Typography>
                    <TextField
                        fullWidth
                        label="Titre"
                        value={newChecklist.title}
                        onChange={(e) => setNewChecklist({ ...newChecklist, title: e.target.value })}
                        margin="normal"
                        size="small"
                    />
                    <TextField
                        fullWidth
                        label="Description (optionnel)"
                        value={newChecklist.description}
                        onChange={(e) => setNewChecklist({ ...newChecklist, description: e.target.value })}
                        margin="normal"
                        size="small"
                        multiline
                        rows={2}
                    />
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => createChecklistMutation.mutate()}
                        disabled={!newChecklist.title.trim() || createChecklistMutation.isPending}
                        sx={{ mt: 2 }}
                    >
                        Créer Checklist
                    </Button>
                </CardContent>
            </Card>

            {isLoading ? (
                <CircularProgress />
            ) : checklists?.data?.length === 0 ? (
                <Typography color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
                    Aucune checklist pour ce ticket
                </Typography>
            ) : (
                checklists?.data?.map((checklist: any) => {
                    const progress = calculateProgress(checklist.items);

                    return (
                        <Card key={checklist.id} sx={{ mb: 3 }}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        {checklist.title}
                                    </Typography>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Chip
                                            label={`${checklist.items?.filter((i: any) => i.completed).length}/${checklist.items?.length}`}
                                            size="small"
                                            variant="outlined"
                                        />
                                        <Chip
                                            label={`${progress}%`}
                                            color={progress === 100 ? 'success' : 'primary'}
                                            size="small"
                                        />
                                    </Box>
                                </Box>

                                {checklist.description && (
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                        {checklist.description}
                                    </Typography>
                                )}

                                <Box sx={{ mb: 2 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={progress}
                                        sx={{
                                            height: 8,
                                            borderRadius: 4,
                                            bgcolor: 'grey.200',
                                            '& .MuiLinearProgress-bar': {
                                                bgcolor: progress === 100 ? 'success.main' : 'primary.main',
                                            },
                                        }}
                                    />
                                </Box>

                                <List>
                                    {checklist.items?.map((item: any) => (
                                        <ListItem
                                            key={item.id}
                                            sx={{
                                                bgcolor: item.completed ? 'success.50' : 'transparent',
                                                borderRadius: 1,
                                            }}
                                        >
                                            <ListItemIcon>
                                                <Checkbox
                                                    edge="start"
                                                    checked={item.completed}
                                                    onChange={() => toggleItemMutation.mutate({
                                                        checklistId: checklist.id,
                                                        itemId: item.id,
                                                        completed: item.completed,
                                                    })}
                                                    icon={<RadioButtonUnchecked />}
                                                    checkedIcon={<CheckCircle color="success" />}
                                                />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Typography
                                                        sx={{
                                                            textDecoration: item.completed ? 'line-through' : 'none',
                                                            color: item.completed ? 'text.secondary' : 'text.primary',
                                                        }}
                                                    >
                                                        {item.title}
                                                    </Typography>
                                                }
                                                secondary={
                                                    item.description && (
                                                        <Typography variant="caption" color="textSecondary">
                                                            {item.description}
                                                        </Typography>
                                                    )
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>

                                <Box display="flex" gap={1} sx={{ mt: 2 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Ajouter un nouvel item..."
                                        value={newItem}
                                        onChange={(e) => setNewItem(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && newItem.trim()) {
                                                handleAddItem(checklist.id);
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={() => handleAddItem(checklist.id)}
                                        disabled={!newItem.trim() || addItemMutation.isPending}
                                    >
                                        <Add />
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    );
                })
            )}
        </Box>
    );
};

export default ChecklistManager;
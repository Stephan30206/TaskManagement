import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Button, CircularProgress, Box
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { projectApi } from '../services/api';
import type { Project } from '../services/types';

interface CreateProjectModalProps {
    open: boolean;
    onClose: () => void;
}

export default function CreateProjectModal({ open, onClose }: CreateProjectModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: (projectData: Omit<Project, 'id' | 'ownerId' | 'adminIds' | 'teamIds' | 'createdAt' | 'updatedAt'>) =>
            projectApi.create(projectData),
        onSuccess: () => {
            enqueueSnackbar('Project created successfully!', { variant: 'success' });
            setName('');
            setDescription('');
            onClose();
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
        onError: (error: any) => {
            enqueueSnackbar(
                error.response?.data?.message || 'Failed to create project',
                { variant: 'error' }
            );
        },
    });

    const handleCreate = async () => {
        if (!name.trim()) {
            enqueueSnackbar('Project name is required', { variant: 'warning' });
            return;
        }

        await createMutation.mutateAsync({
            name,
            description,
            status: 'ACTIVE',
        } as any);
    };

    const handleClose = () => {
        setName('');
        setDescription('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        fullWidth
                        label="Project Name"
                        placeholder="Enter project name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={createMutation.isPending}
                        required
                    />
                    <TextField
                        fullWidth
                        label="Description"
                        placeholder="Enter project description"
                        multiline
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={createMutation.isPending}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={createMutation.isPending}>
                    Cancel
                </Button>
                <Button
                    onClick={handleCreate}
                    variant="contained"
                    disabled={createMutation.isPending || !name.trim()}
                >
                    {createMutation.isPending ? <CircularProgress size={24} /> : 'Create'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

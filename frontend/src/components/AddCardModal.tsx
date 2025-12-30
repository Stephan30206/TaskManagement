import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '../services/api';
import { useSnackbar } from 'notistack';

interface AddCardModalProps {
    open: boolean;
    onClose: () => void;
    projectId: string;
    initialStatus?: string;
}

const AddCardModal: React.FC<AddCardModalProps> = ({ open, onClose, projectId, initialStatus }) => {
    const [title, setTitle] = useState('');
    const queryClient = useQueryClient();
    const { enqueueSnackbar } = useSnackbar();

    const mutation = useMutation({
        mutationFn: () =>
            ticketsApi.create(projectId, {
                title,
                status: initialStatus || 'TODO',
                description: '',
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-tickets', projectId] });
            enqueueSnackbar('Carte ajoutée', { variant: 'success' });
            onClose();
        },
    });

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Ajouter une carte</DialogTitle>
            <DialogContent>
                <TextField
                    label="Titre"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    fullWidth
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button variant="contained" onClick={() => mutation.mutate()} disabled={!title.trim()}>
                    Ajouter
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddCardModal;
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { motion } from 'framer-motion';
import {
    Box,
    Card,
    Typography,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Menu,
    MenuItem,
    Chip,
    Avatar,
    AvatarGroup,
} from '@mui/material';
import {
    Add as AddIcon,
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    DragIndicator as DragIcon,
} from '@mui/icons-material';
import { ticketsApi } from '../services/api';
import type { Ticket } from '../services/types';

interface Column {
    id: string;
    title: string;
    status: string;
    color: string;
    order: number;
}

const DEFAULT_COLUMNS: Column[] = [
    { id: '1', title: 'À faire', status: 'TODO', color: '#94a3b8', order: 0 },
    { id: '2', title: 'En cours', status: 'IN_PROGRESS', color: '#f59e0b', order: 1 },
    { id: '3', title: 'En validation', status: 'IN_VALIDATION', color: '#3b82f6', order: 2 },
    { id: '4', title: 'Terminé', status: 'DONE', color: '#10b981', order: 3 },
];

const KanbanBoard: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS);
    const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
    const [isEditColumnOpen, setIsEditColumnOpen] = useState(false);
    const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);
    const [newColumnTitle, setNewColumnTitle] = useState('');
    const [newColumnColor, setNewColumnColor] = useState('#94a3b8');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [draggedTicket, setDraggedTicket] = useState<Ticket | null>(null);

    const { data: ticketsResponse, isLoading } = useQuery({
        queryKey: ['project-tickets', projectId],
        queryFn: () => ticketsApi.getByProject(projectId!),
        enabled: !!projectId,
    });

    const ticketsData: Ticket[] = (() => {
        if (!ticketsResponse) return [];

        if (Array.isArray(ticketsResponse)) {
            return ticketsResponse;
        }

        if (ticketsResponse.data && Array.isArray(ticketsResponse.data)) {
            return ticketsResponse.data;
        }

        return [];
    })();

    const updateStatusMutation = useMutation({
        mutationFn: ({ ticketId, status }: { ticketId: string; status: string }) =>
            ticketsApi.updateStatus(ticketId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-tickets', projectId] });
            enqueueSnackbar('Ticket déplacé avec succès', { variant: 'success' });
        },
        onError: () => {
            enqueueSnackbar('Erreur lors du déplacement', { variant: 'error' });
        },
    });

    const handleAddColumn = () => {
        if (!newColumnTitle.trim()) return;
        const newColumn: Column = {
            id: Date.now().toString(),
            title: newColumnTitle,
            status: newColumnTitle.toUpperCase().replace(/\s+/g, '_'),
            color: newColumnColor,
            order: columns.length,
        };
        setColumns([...columns, newColumn]);
        setNewColumnTitle('');
        setNewColumnColor('#94a3b8');
        setIsAddColumnOpen(false);
        enqueueSnackbar('Liste ajoutée', { variant: 'success' });
    };

    const handleEditColumn = () => {
        if (!selectedColumn || !newColumnTitle.trim()) return;
        setColumns(
            columns.map((col) =>
                col.id === selectedColumn.id
                    ? { ...col, title: newColumnTitle, color: newColumnColor }
                    : col
            )
        );
        setIsEditColumnOpen(false);
        setSelectedColumn(null);
        setNewColumnTitle('');
        enqueueSnackbar('Liste modifiée', { variant: 'success' });
    };

    const handleDeleteColumn = (columnId: string) => {
        const ticketsInColumn = getTicketsByStatus(
            columns.find((c) => c.id === columnId)?.status || ''
        );
        if (ticketsInColumn.length > 0) {
            enqueueSnackbar('Impossible de supprimer une liste contenant des tickets', {
                variant: 'warning',
            });
            return;
        }
        setColumns(columns.filter((col) => col.id !== columnId));
        setAnchorEl(null);
        enqueueSnackbar('Liste supprimée', { variant: 'success' });
    };

    const openEditDialog = (column: Column) => {
        setSelectedColumn(column);
        setNewColumnTitle(column.title);
        setNewColumnColor(column.color);
        setIsEditColumnOpen(true);
        setAnchorEl(null);
    };

    const handleDragStart = (e: React.DragEvent, ticket: Ticket) => {
        e.stopPropagation();
        setDraggedTicket(ticket);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, status: string) => {
        e.preventDefault();
        if (!draggedTicket || draggedTicket.status === status) return;
        updateStatusMutation.mutate({ ticketId: draggedTicket.id, status });
        setDraggedTicket(null);
    };

    const getTicketsByStatus = (status: string) => {
        return ticketsData.filter((ticket) => ticket.status === status);
    };

    if (isLoading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="60vh"
            >
                <Typography variant="h6" color="text.secondary">
                    Chargement des tickets...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
            <Box
                sx={{
                    display: 'flex',
                    gap: 3,
                    overflowX: 'auto',
                    pb: 4,
                    px: 3,
                    pt: 3,
                    '&::-webkit-scrollbar': { height: 8 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: 'action.hover', borderRadius: 4 },
                }}
            >
                {columns.map((column) => {
                    const columnTickets = getTicketsByStatus(column.status);

                    return (
                        <motion.div
                            key={column.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Box
                                sx={{
                                    minWidth: 340,
                                    maxWidth: 380,
                                    bgcolor: 'background.paper',
                                    borderRadius: 3,
                                    boxShadow: 3,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: 'fit-content',
                                }}
                            >
                                {/* Header */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        p: 2,
                                        pb: 1.5,
                                        bgcolor: column.color + '20',
                                        borderBottom: `4px solid ${column.color}`,
                                        borderRadius: '12px 12px 0 0',
                                    }}
                                >
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <Typography
                                            variant="h6"
                                            sx={{ fontWeight: 700, fontSize: '1.1rem' }}
                                        >
                                            {column.title}
                                        </Typography>
                                        <Chip
                                            label={columnTickets.length}
                                            size="small"
                                            sx={{
                                                bgcolor: column.color,
                                                color: 'white',
                                                fontWeight: 'bold',
                                                height: 26,
                                            }}
                                        />
                                    </Box>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            setSelectedColumn(column);
                                            setAnchorEl(e.currentTarget);
                                        }}
                                    >
                                        <MoreVertIcon />
                                    </IconButton>
                                </Box>

                                {/* Drop Zone */}
                                <Box
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, column.status)}
                                    sx={{
                                        flex: 1,
                                        minHeight: 500,
                                        p: 2,
                                        bgcolor: draggedTicket ? 'action.hover' : 'transparent',
                                        borderRadius: '0 0 12px 12px',
                                        transition: 'background 0.2s',
                                    }}
                                >
                                    {columnTickets.map((ticket) => (
                                        <motion.div
                                            key={ticket.id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <Card
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, ticket)}
                                                onClick={() =>
                                                    navigate(`/ticket/${ticket.id}`)
                                                }
                                                sx={{
                                                    mb: 2,
                                                    p: 2,
                                                    borderRadius: 2.5,
                                                    boxShadow: 2,
                                                    cursor: 'pointer',
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        boxShadow: 6,
                                                        borderColor: column.color,
                                                        transform: 'translateY(-4px)',
                                                    },
                                                }}
                                            >
                                                <Box display="flex" alignItems="flex-start" gap={1.5}>
                                                    <DragIcon
                                                        sx={{
                                                            color: 'text.secondary',
                                                            cursor: 'grab',
                                                            mt: 0.5,
                                                        }}
                                                    />
                                                    <Box flex={1}>
                                                        <Typography
                                                            variant="subtitle1"
                                                            sx={{
                                                                fontWeight: 600,
                                                                mb: 1,
                                                                wordBreak: 'break-word',
                                                            }}
                                                        >
                                                            {ticket.title}
                                                        </Typography>
                                                        {ticket.description && (
                                                            <Typography
                                                                variant="body2"
                                                                color="text.secondary"
                                                                sx={{
                                                                    mb: 1.5,
                                                                    display: '-webkit-box',
                                                                    WebkitLineClamp: 3,
                                                                    WebkitBoxOrient: 'vertical',
                                                                    overflow: 'hidden',
                                                                }}
                                                            >
                                                                {ticket.description}
                                                            </Typography>
                                                        )}

                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                mt: 2,
                                                            }}
                                                        >
                                                            <AvatarGroup max={4}>
                                                                {ticket.assignees?.map((assignee) => (
                                                                    <Avatar
                                                                        key={assignee.id}
                                                                        sx={{ width: 32, height: 32 }}
                                                                        src={assignee.avatar}
                                                                        alt={assignee.firstName}
                                                                    >
                                                                        {assignee.firstName?.[0]}
                                                                    </Avatar>
                                                                ))}
                                                            </AvatarGroup>

                                                            {ticket.estimatedDate && (
                                                                <Chip
                                                                    size="small"
                                                                    label={new Date(ticket.estimatedDate).toLocaleDateString(
                                                                        'fr-FR'
                                                                    )}
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </Card>
                                        </motion.div>
                                    ))}

                                    {columnTickets.length === 0 && (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            textAlign="center"
                                            py={8}
                                            sx={{ fontStyle: 'italic' }}
                                        >
                                            Aucun ticket
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </motion.div>
                    );
                })}

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <Box
                        sx={{
                            minWidth: 340,
                            display: 'flex',
                            alignItems: 'flex-start',
                            pt: 8,
                        }}
                    >
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => setIsAddColumnOpen(true)}
                            sx={{
                                height: 56,
                                borderStyle: 'dashed',
                                borderWidth: 2,
                                borderRadius: 3,
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '1rem',
                                '&:hover': { bgcolor: 'action.hover' },
                            }}
                        >
                            Ajouter une liste
                        </Button>
                    </Box>
                </motion.div>
            </Box>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{ sx: { borderRadius: 2, boxShadow: 4 } }}
            >
                <MenuItem onClick={() => selectedColumn && openEditDialog(selectedColumn)}>
                    <EditIcon fontSize="small" sx={{ mr: 1.5 }} />
                    Modifier
                </MenuItem>
                <MenuItem
                    onClick={() => selectedColumn && handleDeleteColumn(selectedColumn.id)}
                    sx={{ color: 'error.main' }}
                >
                    <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} />
                    Supprimer
                </MenuItem>
            </Menu>

            <Dialog
                open={isAddColumnOpen}
                onClose={() => setIsAddColumnOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Ajouter une liste</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Nom de la liste"
                        fullWidth
                        value={newColumnTitle}
                        onChange={(e) => setNewColumnTitle(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                            Couleur
                        </Typography>
                        <Box display="flex" gap={2} flexWrap="wrap">
                            {[
                                '#94a3b8',
                                '#f59e0b',
                                '#3b82f6',
                                '#10b981',
                                '#8b5cf6',
                                '#ec4899',
                                '#ef4444',
                                '#6366f1',
                            ].map((color) => (
                                <Box
                                    key={color}
                                    onClick={() => setNewColumnColor(color)}
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        bgcolor: color,
                                        borderRadius: 2,
                                        cursor: 'pointer',
                                        border: newColumnColor === color ? '4px solid black' : 'none',
                                        boxShadow:
                                            newColumnColor === color
                                                ? '0 0 0 3px white'
                                                : '0 2px 6px rgba(0,0,0,0.1)',
                                        transition: 'all 0.2s ease',
                                        '&:hover': { transform: 'scale(1.1)' },
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setIsAddColumnOpen(false)}>Annuler</Button>
                    <Button
                        onClick={handleAddColumn}
                        variant="contained"
                        disabled={!newColumnTitle.trim()}
                    >
                        Ajouter
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={isEditColumnOpen}
                onClose={() => setIsEditColumnOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Modifier la liste</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Nom de la liste"
                        fullWidth
                        value={newColumnTitle}
                        onChange={(e) => setNewColumnTitle(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                            Couleur
                        </Typography>
                        <Box display="flex" gap={2} flexWrap="wrap">
                            {[
                                '#94a3b8',
                                '#f59e0b',
                                '#3b82f6',
                                '#10b981',
                                '#8b5cf6',
                                '#ec4899',
                                '#ef4444',
                                '#6366f1',
                            ].map((color) => (
                                <Box
                                    key={color}
                                    onClick={() => setNewColumnColor(color)}
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        bgcolor: color,
                                        borderRadius: 2,
                                        cursor: 'pointer',
                                        border: newColumnColor === color ? '4px solid black' : 'none',
                                        boxShadow:
                                            newColumnColor === color
                                                ? '0 0 0 3px white'
                                                : '0 2px 6px rgba(0,0,0,0.1)',
                                        transition: 'all 0.2s ease',
                                        '&:hover': { transform: 'scale(1.1)' },
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setIsEditColumnOpen(false)}>Annuler</Button>
                    <Button
                        onClick={handleEditColumn}
                        variant="contained"
                        disabled={!newColumnTitle.trim()}
                    >
                        Enregistrer
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default KanbanBoard;
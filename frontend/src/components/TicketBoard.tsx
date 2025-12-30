import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Chip, Box, Typography, CircularProgress, TablePagination, IconButton, Tooltip,
    Alert, AlertTitle
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { ticketApi } from '../services/api';
import type { Ticket } from '../services/types';

interface TicketBoardProps {
    projectId: string;
    filter?: {
        status?: string;
        assigneeId?: string;
    };
}

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    'TODO': 'default',
    'IN_PROGRESS': 'info',
    'IN_VALIDATION': 'warning',
    'DONE': 'success',
};

const priorityColors: Record<string, string> = {
    'LOW': '#4CAF50',
    'MEDIUM': '#2196F3',
    'HIGH': '#FF9800',
    'CRITICAL': '#F44336',
};

export default function TicketBoard({ projectId, filter }: TicketBoardProps) {
    const navigate = useNavigate();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const { data: ticketsResponse, isLoading, isError, error } = useQuery({
        queryKey: ['tickets', projectId, filter],
        queryFn: () =>
            filter && (filter.status || filter.assigneeId)
                ? ticketApi.filter({ projectId, ...filter })
                : ticketApi.getByProject(projectId),
    });

    const tickets = ticketsResponse?.data ?? [];

    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (isError) {
        return (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
                <AlertTitle sx={{ fontWeight: 600 }}>Erreur d'accès aux tickets</AlertTitle>
                {error instanceof Error && error.message.includes('403') ? (
                    <Typography variant="body2">
                        Vous n'avez pas les permissions pour accéder aux tickets de ce projet.
                    </Typography>
                ) : (
                    <Typography variant="body2">
                        {error instanceof Error ? error.message : 'Erreur lors du chargement des tickets'}
                    </Typography>
                )}
            </Alert>
        );
    }

    const paginatedData = tickets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box>
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Titre</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>Statut</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>Priorité</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Assignés</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>Date limite</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                    <Box display="flex" flexDirection="column" alignItems="center" gap={1.5}>
                                        <ErrorOutlineIcon sx={{ fontSize: 40, color: 'action.disabled' }} />
                                        <Typography color="textSecondary" sx={{ fontWeight: 500 }}>
                                            Aucun ticket trouvé
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {filter ? 'Essayez de modifier vos filtres' : 'Créez votre premier ticket'}
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedData.map((ticket: Ticket) => (
                                <TableRow 
                                    key={ticket.id} 
                                    hover
                                    sx={{ 
                                        '&:hover': { backgroundColor: '#fafafa' },
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    <TableCell>
                                        <Box
                                            sx={{
                                                cursor: 'pointer',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                color: 'primary.main',
                                                fontWeight: 500,
                                                '&:hover': { 
                                                    textDecoration: 'underline',
                                                    color: 'primary.dark'
                                                },
                                                transition: 'all 0.2s'
                                            }}
                                            onClick={() => navigate(`/projects/${projectId}/tickets/${ticket.id}`)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    navigate(`/projects/${projectId}/tickets/${ticket.id}`);
                                                }
                                            }}
                                        >
                                            {ticket.title}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={ticket.status}
                                            color={statusColors[ticket.status] || 'default'}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontWeight: 600 }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        {ticket.priority && (
                                            <Chip
                                                label={ticket.priority}
                                                size="small"
                                                sx={{
                                                    backgroundColor: priorityColors[ticket.priority],
                                                    color: 'white',
                                                    fontWeight: 600,
                                                }}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                            {ticket.assignees && ticket.assignees.length > 0
                                                ? ticket.assignees.slice(0, 3).map((assignee) => (
                                                    <Tooltip key={assignee.id} title={`${assignee.firstName} ${assignee.lastName}`}>
                                                        <Chip
                                                            label={assignee.firstName?.charAt(0)}
                                                            size="small"
                                                            variant="filled"
                                                            sx={{ fontWeight: 600 }}
                                                        />
                                                    </Tooltip>
                                                ))
                                                : <Typography variant="caption" color="textSecondary">Non assigné</Typography>
                                            }
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                        {ticket.dueDate ? (
                                            <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                                {new Date(ticket.dueDate).toLocaleDateString('fr-FR')}
                                            </Typography>
                                        ) : (
                                            <Typography variant="caption" color="textSecondary">-</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Ouvrir le ticket">
                                            <IconButton
                                                size="small"
                                                onClick={() => navigate(`/projects/${projectId}/tickets/${ticket.id}`)}
                                                sx={{
                                                    '&:hover': { 
                                                        backgroundColor: 'primary.lighter',
                                                        color: 'primary.main'
                                                    },
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <OpenInNewIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {tickets.length > 0 && (
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={tickets.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Lignes par page:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
                    sx={{ borderTop: '1px solid #eee', mt: 2 }}
                />
            )}
        </Box>
    );
}

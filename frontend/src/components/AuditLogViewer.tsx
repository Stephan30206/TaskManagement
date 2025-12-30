import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Box, Card, CardContent, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip, TextField, InputAdornment, MenuItem, Select, Button, Alert,
    CircularProgress
} from '@mui/material';
import {
    Search, Download, Visibility, Person, CalendarToday, ErrorOutline
} from '@mui/icons-material';
import { auditApi } from '../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { AuditLog } from '../services/types';

interface AuditLogViewerProps {
    projectId: string;
}

interface AuditLogResponse {
    data: AuditLog[];
    total: number;
}

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ projectId }) => {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [actionFilter, setActionFilter] = useState<string>('');

    const { data: auditLogsData, isLoading, isError, error } = useQuery({
        queryKey: ['audit-logs', projectId, page, actionFilter],
        queryFn: () => auditApi.getByProject(projectId, page, 20),
        enabled: !!projectId,
    });

    const auditLogs: AuditLogResponse | undefined = auditLogsData?.data;
    const logs = auditLogs?.data ?? [];
    const totalLogs = auditLogs?.total ?? 0;

    const getActionColor = (action: string): any => {
        const colors: Record<string, any> = {
            'CREATE': 'success',
            'UPDATE': 'info',
            'DELETE': 'error',
            'ASSIGN': 'warning',
            'STATUS_CHANGE': 'primary',
        };
        return colors[action] || 'default';
    };

    const formatDate = (date: string) => {
        try {
            return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr });
        } catch {
            return 'Date invalide';
        }
    };

    const handleExport = async () => {
        try {
            const response = await auditApi.export(projectId);
            const exportData = response.data?.data ?? [];
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `audit-logs-${projectId}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erreur export:', error);
        }
    };

    const filteredLogs = logs
        .filter((log) => {
            const matchesSearch = search === '' ||
                (log.description?.toLowerCase() ?? '').includes(search.toLowerCase()) ||
                (log.userName?.toLowerCase() ?? '').includes(search.toLowerCase());
            const matchesAction = actionFilter === '' || log.action === actionFilter;
            return matchesSearch && matchesAction;
        });

    // @ts-ignore
    return (
        <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 3 }}>
                {/* En-tête avec titre et action */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            📊 Journal d'audit
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {totalLogs} enregistrement{totalLogs !== 1 ? 's' : ''}
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={handleExport}
                        disabled={isLoading || logs.length === 0}
                        sx={{ textTransform: 'none', fontWeight: 500 }}
                    >
                        Exporter JSON
                    </Button>
                </Box>

                {isError && error && (
                    <Alert severity="error" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ErrorOutline fontSize="small" />
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Accès refusé (403)
                            </Typography>
                            <Typography variant="caption">
                                Vous n'avez pas les permissions pour consulter le journal d'audit. Contactez un administrateur.
                            </Typography>
                        </Box>
                    </Alert>
                )}

                {!isError && (
                    <Box display="flex" gap={2} mb={3} sx={{ flexWrap: 'wrap' }}>
                        <TextField
                            placeholder="Rechercher par utilisateur ou description..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            size="small"
                            sx={{ 
                                flex: 1, 
                                minWidth: 250,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1,
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search sx={{ color: 'action.active' }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Select
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            size="small"
                            sx={{ 
                                minWidth: 180,
                                borderRadius: 1,
                            }}
                            displayEmpty
                        >
                            <MenuItem value="">Toutes les actions</MenuItem>
                            <MenuItem value="CREATE">
                                <Chip label="CREATE" color="success" size="small" variant="outlined" />
                            </MenuItem>
                            <MenuItem value="UPDATE">
                                <Chip label="UPDATE" color="info" size="small" variant="outlined" />
                            </MenuItem>
                            <MenuItem value="DELETE">
                                <Chip label="DELETE" color="error" size="small" variant="outlined" />
                            </MenuItem>
                            <MenuItem value="ASSIGN">
                                <Chip label="ASSIGN" color="warning" size="small" variant="outlined" />
                            </MenuItem>
                            <MenuItem value="STATUS_CHANGE">
                                <Chip label="STATUS_CHANGE" color="primary" size="small" variant="outlined" />
                            </MenuItem>
                        </Select>
                    </Box>
                )}

                {isLoading && (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                        <CircularProgress />
                    </Box>
                )}

                {!isLoading && !isError && (
                    <TableContainer component={Paper} sx={{ maxHeight: 600, borderRadius: 1 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Utilisateur</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Entité</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                            <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                                                <Visibility sx={{ fontSize: 40, color: 'action.disabled' }} />
                                                <Typography color="textSecondary">
                                                    Aucun log d'audit trouvé
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLogs.map((log) => <TableRow key={log.id} hover sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Chip
                                                label={log.action}
                                                color={getActionColor(log.action)}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontWeight: 500 }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Person fontSize="small" color="action" />
                                                <Typography variant="body2">
                                                    {log.userName || 'Utilisateur inconnu'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {log.entityType}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 300 }}>
                                                {log.description}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Box display="flex" alignItems="center" gap={0.5}>
                                                <CalendarToday fontSize="small" color="action" />
                                                <Typography variant="body2">
                                                    {formatDate(log.createdAt.toString())}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>)
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {!isLoading && !isError && totalLogs > 0 && (
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
                        <Typography variant="body2" color="textSecondary">
                            Page {page + 1} sur {Math.ceil(totalLogs / 20)} ({filteredLogs.length} résultats affichés)
                        </Typography>
                        <Box display="flex" gap={1}>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                            >
                                ← Précédent
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => setPage(p => p + 1)}
                                disabled={(page + 1) * 20 >= totalLogs}
                            >
                                Suivant →
                            </Button>
                        </Box>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default AuditLogViewer;

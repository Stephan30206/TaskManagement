import React, { useState } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Card,
    CardContent,
    Stack,
    Chip,
    IconButton,
    Button,
    CircularProgress,
    Menu,
    MenuItem,
    Tabs,
    Tab,
    Alert,
    Divider,
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Delete as DeleteIcon,
    Check as CheckIcon,
    Clear as ClearIcon,
    Refresh as RefreshIcon,
    MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { notificationApi } from '../services/api';
import Navbar from '../components/Navbar';
import type { Notification } from '../services/types';

interface NotificationsResponse {
    data: Notification[];
    total: number;
    unreadCount: number;
}

const NotificationsPage: React.FC = () => {
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

    const {
        data: notificationsResponse,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['notifications', filter],
        queryFn: () => notificationApi.getAll(0, 50),
    });

    const notificationsData = notificationsResponse?.data as NotificationsResponse;
    const notifications: Notification[] = notificationsData?.data || [];
    const totalCount = notificationsData?.total || 0;
    const unreadCount = notificationsData?.unreadCount || 0;

    const markAsReadMutation = useMutation({
        mutationFn: (notificationId: string) => notificationApi.markAsRead(notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
            enqueueSnackbar('Notification marked as read', { variant: 'success' });
        },
        onError: (error: any) => {
            enqueueSnackbar(
                error.response?.data?.message || 'Erreur lors de la mise à jour',
                { variant: 'error' }
            );
        },
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: () => notificationApi.markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
            enqueueSnackbar('All notifications marked as read', { variant: 'success' });
        },
        onError: (error: any) => {
            enqueueSnackbar(
                error.response?.data?.message || 'Erreur lors de la mise à jour',
                { variant: 'error' }
            );
        },
    });

    const dismissMutation = useMutation({
        mutationFn: (notificationId: string) => notificationApi.dismiss(notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            enqueueSnackbar('Notification dismissed', { variant: 'info' });
        },
        onError: (error: any) => {
            enqueueSnackbar(
                error.response?.data?.message || 'Erreur lors du rejet',
                { variant: 'error' }
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (notificationId: string) => notificationApi.delete(notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            enqueueSnackbar('Notification deleted', { variant: 'success' });
        },
        onError: (error: any) => {
            enqueueSnackbar(
                error.response?.data?.message || 'Erreur lors de la suppression',
                { variant: 'error' }
            );
        },
    });

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'TICKET_ASSIGNED': return 'primary';
            case 'TICKET_COMMENTED': return 'info';
            case 'STATUS_CHANGED': return 'warning';
            case 'CHECKLIST_COMPLETED': return 'success';
            case 'MEMBER_ADDED': return 'secondary';
            case 'MENTION_IN_COMMENT': return 'error';
            default: return 'default';
        }
    };

    const filteredNotifications = notifications.filter(notification => {
        if (filter === 'UNREAD') return !notification.isRead;
        if (filter === 'READ') return notification.isRead;
        return true;
    });

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, notification: Notification) => {
        setAnchorEl(event.currentTarget);
        setSelectedNotification(notification);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedNotification(null);
    };

    const handleRefresh = () => {
        refetch();
        enqueueSnackbar('Notifications refreshed', { variant: 'info' });
    };

    const handleNotificationClick = (notification: Notification) => {
        if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
        } else if (notification.entityType === 'TICKET' && notification.projectId) {
            window.location.href = `/project/${notification.projectId}/tickets/${notification.entityId}`;
        } else if (notification.entityType === 'PROJECT' && notification.entityId) {
            window.location.href = `/project/${notification.entityId}`;
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Navbar />
                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <CircularProgress />
                </Box>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Navbar />
                <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
                    <Alert severity="error" sx={{ mb: 3 }}>
                        Error loading notifications: {(error as any).message}
                    </Alert>
                    <Button
                        variant="contained"
                        startIcon={<RefreshIcon />}
                        onClick={() => refetch()}
                    >
                        Retry
                    </Button>
                </Container>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <Navbar />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <NotificationsIcon fontSize="large" color="primary" />
                            <Typography variant="h4" fontWeight="bold">
                                Notifications
                            </Typography>
                            <Chip
                                label={`${unreadCount} unread`}
                                color={unreadCount > 0 ? 'error' : 'default'}
                                variant="outlined"
                            />
                            <Chip
                                label={`${totalCount} total`}
                                color="default"
                                variant="outlined"
                                size="small"
                            />
                        </Box>

                        <Box display="flex" gap={1}>
                            <Button
                                variant="outlined"
                                startIcon={<RefreshIcon />}
                                onClick={handleRefresh}
                                disabled={isLoading}
                            >
                                Refresh
                            </Button>
                            {unreadCount > 0 && (
                                <Button
                                    variant="contained"
                                    startIcon={<CheckIcon />}
                                    onClick={() => markAllAsReadMutation.mutate()}
                                    disabled={markAllAsReadMutation.isPending || isLoading}
                                >
                                    {markAllAsReadMutation.isPending ? 'Processing...' : 'Mark all as read'}
                                </Button>
                            )}
                        </Box>
                    </Box>

                    <Tabs
                        value={filter}
                        onChange={(_, newValue) => setFilter(newValue)}
                        sx={{ mb: 3 }}
                    >
                        <Tab label={`All (${totalCount})`} value="ALL" />
                        <Tab label={`Unread (${unreadCount})`} value="UNREAD" />
                        <Tab label={`Read (${totalCount - unreadCount})`} value="READ" />
                    </Tabs>

                    {filteredNotifications.length === 0 ? (
                        <Box textAlign="center" py={8}>
                            <NotificationsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">
                                {filter === 'UNREAD' ? 'No unread notifications' : 'No notifications'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                You're all caught up!
                            </Typography>
                        </Box>
                    ) : (
                        <Stack spacing={2}>
                            {filteredNotifications.map((notification) => (
                                <Card
                                    key={notification.id}
                                    variant="outlined"
                                    sx={{
                                        bgcolor: notification.isRead ? 'inherit' : 'action.hover',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            boxShadow: 3,
                                            transform: 'translateY(-2px)',
                                            cursor: 'pointer',
                                        }
                                    }}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                            <Box sx={{ flex: 1 }}>
                                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                    <Chip
                                                        label={notification.type?.replace(/_/g, ' ') || 'Notification'}
                                                        size="small"
                                                        color={getTypeColor(notification.type) as any}
                                                        variant="outlined"
                                                    />
                                                    {!notification.isRead && (
                                                        <Chip
                                                            label="NEW"
                                                            size="small"
                                                            color="error"
                                                        />
                                                    )}
                                                    {notification.dismissed && (
                                                        <Chip
                                                            label="DISMISSED"
                                                            size="small"
                                                            color="default"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </Box>

                                                <Typography variant="h6" gutterBottom>
                                                    {notification.title || 'No title'}
                                                </Typography>

                                                <Typography variant="body1" color="text.secondary" paragraph>
                                                    {notification.message || 'No message'}
                                                </Typography>

                                                <Box display="flex" alignItems="center" gap={2} mt={2}>
                                                    {notification.senderName && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            By {notification.senderName}
                                                        </Typography>
                                                    )}
                                                    <Typography variant="caption" color="text.secondary">
                                                        {notification.createdAt ?
                                                            new Date(notification.createdAt).toLocaleString('fr-FR', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            }) :
                                                            'Unknown date'
                                                        }
                                                    </Typography>
                                                    {notification.projectId && (
                                                        <Chip
                                                            label="Project"
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </Box>
                                            </Box>

                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMenuOpen(e, notification);
                                                }}
                                            >
                                                <MoreVertIcon />
                                            </IconButton>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>
                    )}
                </Paper>
            </Container>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                onClick={(e) => e.stopPropagation()}
            >
                {selectedNotification && !selectedNotification.isRead && (
                    <MenuItem
                        onClick={() => {
                            markAsReadMutation.mutate(selectedNotification.id);
                            handleMenuClose();
                        }}
                        disabled={markAsReadMutation.isPending}
                    >
                        <CheckIcon sx={{ mr: 1 }} />
                        {markAsReadMutation.isPending ? 'Marking...' : 'Mark as read'}
                    </MenuItem>
                )}
                {selectedNotification && !selectedNotification.dismissed && (
                    <MenuItem
                        onClick={() => {
                            dismissMutation.mutate(selectedNotification.id);
                            handleMenuClose();
                        }}
                        disabled={dismissMutation.isPending}
                    >
                        <ClearIcon sx={{ mr: 1 }} />
                        {dismissMutation.isPending ? 'Dismissing...' : 'Dismiss'}
                    </MenuItem>
                )}
                <Divider />
                <MenuItem
                    onClick={() => {
                        if (selectedNotification) {
                            deleteMutation.mutate(selectedNotification.id);
                            handleMenuClose();
                        }
                    }}
                    disabled={deleteMutation.isPending}
                    sx={{ color: 'error.main' }}
                >
                    <DeleteIcon sx={{ mr: 1 }} />
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default NotificationsPage;
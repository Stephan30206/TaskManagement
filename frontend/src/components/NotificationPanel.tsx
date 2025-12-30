import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box, Card, CardContent, CircularProgress,
    Typography, Chip, Stack, IconButton, Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import { notificationApi } from '../services/api';
import type { Notification } from '../services/types';

interface NotificationPanelProps {
    limit?: number;
}

export default function NotificationPanel({ limit = 5 }: NotificationPanelProps) {
    useQueryClient();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const { data: unreadData, isLoading, refetch } = useQuery({
        queryKey: ['unreadNotifications'],
        queryFn: () => notificationApi.getUnread(),
        refetchInterval: 30000,
    });

    const markAsReadMutation = useMutation({
        mutationFn: (notificationId: string) => notificationApi.markAsRead(notificationId),
        onSuccess: () => {
            refetch();
        },
    });

    const dismissMutation = useMutation({
        mutationFn: (notificationId: string) => notificationApi.dismiss(notificationId),
        onSuccess: () => {
            refetch();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (notificationId: string) => notificationApi.delete(notificationId),
        onSuccess: () => {
            refetch();
        },
    });

    useEffect(() => {
        if (unreadData?.data) {
            setNotifications(unreadData.data.slice(0, limit));
        }
    }, [unreadData, limit]);

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'TICKET_ASSIGNED':
                return 'primary';
            case 'TICKET_COMMENTED':
                return 'info';
            case 'STATUS_CHANGED':
                return 'warning';
            case 'CHECKLIST_COMPLETED':
                return 'success';
            default:
                return 'default';
        }
    };

    if (isLoading) {
        return <CircularProgress />;
    }

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Notifications ({unreadData?.data?.count || 0})
            </Typography>

            {notifications.length === 0 ? (
                <Card>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="textSecondary">
                            No unread notifications
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Stack spacing={1}>
                    {notifications.map((notification: Notification) => (
                        <Card key={notification.id} variant="outlined">
                            <CardContent sx={{ pb: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                                            <Chip
                                                label={notification.type}
                                                size="small"
                                                color={getTypeColor(notification.type) as any}
                                                variant="outlined"
                                            />
                                            <Typography variant="caption" color="textSecondary">
                                                {new Date(notification.createdAt).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                            {notification.title}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {notification.message}
                                        </Typography>
                                        {notification.senderName && (
                                            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                                                By {notification.senderName}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Stack direction="row" spacing={0.5}>
                                        <Tooltip title="Mark as read">
                                            <IconButton
                                                size="small"
                                                onClick={() => markAsReadMutation.mutate(notification.id)}
                                                disabled={markAsReadMutation.isPending}
                                            >
                                                <CheckIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Dismiss">
                                            <IconButton
                                                size="small"
                                                onClick={() => dismissMutation.mutate(notification.id)}
                                                disabled={dismissMutation.isPending}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => deleteMutation.mutate(notification.id)}
                                                disabled={deleteMutation.isPending}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            )}
        </Box>
    );
}

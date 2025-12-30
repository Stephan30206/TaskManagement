import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    AppBar, Toolbar, Typography, Button, Box, Avatar, Menu, MenuItem,
    Badge, IconButton, TextField, InputAdornment, CircularProgress, Divider
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../services/api';
import type { Notification } from '../services/types';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);

    // Requête pour les notifications
    const { data: unreadResponse, isLoading: notificationsLoading } = useQuery({
        queryKey: ['unreadNotifications'],
        queryFn: () => notificationApi.getUnread(),
        refetchInterval: 30000,
    });

    const notifications: Notification[] = (() => {
        if (!unreadResponse?.data) return [];

        const responseData = unreadResponse.data;

        if (responseData.data && Array.isArray(responseData.data)) {
            return responseData.data;
        }

        if (Array.isArray(responseData)) {
            return responseData;
        }

        if ((responseData as any).notifications && Array.isArray((responseData as any).notifications)) {
            return (responseData as any).notifications;
        }

        return [];
    })();

    const unreadCount = (() => {
        if (!unreadResponse?.data) return 0;

        const responseData = unreadResponse.data;

        if ((responseData as any).count !== undefined) {
            return (responseData as any).count;
        }

        if (Array.isArray(responseData)) {
            return responseData.filter((n: Notification) => !n.isRead).length;
        }

        if (responseData.data && Array.isArray(responseData.data)) {
            return responseData.data.filter((n: Notification) => !n.isRead).length;
        }

        return 0;
    })();

    const markAsReadMutation = useMutation({
        mutationFn: (notificationId: string) => notificationApi.markAsRead(notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
        },
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: () => notificationApi.markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
            handleNotificationClose();
        },
    });

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleProfileClick = () => {
        navigate('/profile');
        handleMenuClose();
    };

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
            setSearchQuery('');
        }
    };

    const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
        setNotificationAnchor(event.currentTarget);
    };

    const handleNotificationClose = () => {
        setNotificationAnchor(null);
    };

    const handleNotificationItemClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsReadMutation.mutate(notification.id);
        }

        // Navigation basée sur le type d'entité
        if (notification.entityType === 'TICKET' && notification.projectId) {
            navigate(`/project/${notification.projectId}/tickets/${notification.entityId}`);
        } else if (notification.entityType === 'PROJECT' && notification.entityId) {
            navigate(`/project/${notification.entityId}`);
        } else if (notification.actionUrl) {
            navigate(notification.actionUrl);
        }

        handleNotificationClose();
    };

    const handleMarkAllAsRead = () => {
        markAllAsReadMutation.mutate();
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'TICKET_ASSIGNED':
                return 'primary.main';
            case 'TICKET_COMMENTED':
                return 'info.main';
            case 'STATUS_CHANGED':
                return 'warning.main';
            case 'CHECKLIST_COMPLETED':
                return 'success.main';
            default:
                return 'text.primary';
        }
    };

    return (
        <AppBar position="sticky" sx={{ zIndex: 1100, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Toolbar sx={{ gap: 2 }}>
                <Typography
                    variant="h6"
                    sx={{
                        flexGrow: 1,
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '1.3rem',
                        letterSpacing: '0.5px'
                    }}
                    onClick={() => navigate('/dashboard')}
                >
                    Gestion de projet
                </Typography>

                <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Search projects & tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleSearch}
                    sx={{
                        width: 300,
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: 1,
                        '& .MuiOutlinedInput-root': {
                            color: 'white',
                            '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                            },
                            '&:hover fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.7)',
                            },
                        },
                        '& .MuiOutlinedInput-input::placeholder': {
                            color: 'rgba(255, 255, 255, 0.7)',
                            opacity: 1,
                        },
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: 'white' }} />
                            </InputAdornment>
                        ),
                    }}
                />

                <IconButton
                    color="inherit"
                    onClick={handleNotificationClick}
                    sx={{
                        position: 'relative',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.15)',
                        },
                        transition: 'all 0.2s ease',
                    }}
                    aria-label={`Notifications (${unreadCount} unread)`}
                >
                    <Badge
                        badgeContent={unreadCount}
                        color="error"
                        overlap="circular"
                        max={99}
                        sx={{
                            '& .MuiBadge-badge': {
                                fontSize: '0.75rem',
                                height: '20px',
                                minWidth: '20px',
                            }
                        }}
                    >
                        <NotificationsIcon sx={{
                            fontSize: 26,
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'scale(1.1)' }
                        }} />
                    </Badge>
                </IconButton>

                <Menu
                    anchorEl={notificationAnchor}
                    open={Boolean(notificationAnchor)}
                    onClose={handleNotificationClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    sx={{
                        '& .MuiPaper-root': {
                            minWidth: 400,
                            maxWidth: 450,
                            maxHeight: 500,
                            borderRadius: 2,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                        }
                    }}
                >
                    <Box sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Notifications ({unreadCount})
                            </Typography>
                            {unreadCount > 0 && (
                                <Button
                                    size="small"
                                    onClick={handleMarkAllAsRead}
                                    disabled={markAllAsReadMutation.isPending}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Tout marquer comme lu
                                </Button>
                            )}
                        </Box>
                        <Divider />
                    </Box>

                    {notificationsLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : notifications.length === 0 ? (
                        <MenuItem disabled sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <NotificationsIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                            <Typography variant="body2" color="textSecondary">
                                No unread notifications
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                You're all caught up!
                            </Typography>
                        </MenuItem>
                    ) : (
                        <>
                            {notifications.slice(0, 8).map((notification: Notification, index: number) => (
                                <Box key={notification.id}>
                                    <MenuItem
                                        onClick={() => handleNotificationItemClick(notification)}
                                        sx={{
                                            py: 2,
                                            px: 2,
                                            bgcolor: notification.isRead ? 'inherit' : 'action.hover',
                                            '&:hover': {
                                                bgcolor: 'action.selected',
                                            }
                                        }}
                                    >
                                        <Box sx={{ width: '100%' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Box
                                                    sx={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        bgcolor: getTypeColor(notification.type),
                                                        opacity: notification.isRead ? 0.5 : 1
                                                    }}
                                                />
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: getTypeColor(notification.type)
                                                    }}
                                                >
                                                    {notification.type.replace(/_/g, ' ')}
                                                </Typography>
                                            </Box>

                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                {notification.title}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                                                {notification.message}
                                            </Typography>

                                            {notification.senderName && (
                                                <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                                                    By {notification.senderName}
                                                </Typography>
                                            )}

                                            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                                                {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </Typography>
                                        </Box>
                                    </MenuItem>
                                    {index < notifications.length - 1 && <Divider />}
                                </Box>
                            ))}

                            {notifications.length > 8 && (
                                <>
                                    <Divider />
                                    <MenuItem
                                        onClick={() => {
                                            navigate('/notifications');
                                            handleNotificationClose();
                                        }}
                                        sx={{ justifyContent: 'center', py: 1.5 }}
                                    >
                                        <Typography variant="body2" color="primary">
                                            View all notifications
                                        </Typography>
                                    </MenuItem>
                                </>
                            )}
                        </>
                    )}
                </Menu>

                <Button
                    color="inherit"
                    onClick={handleMenuOpen}
                    sx={{
                        textTransform: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        padding: '6px 12px',
                        borderRadius: '8px',
                        '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                        },
                        transition: 'all 0.2s ease',
                    }}
                >
                    <Avatar
                        sx={{
                            width: 32,
                            height: 32,
                            bgcolor: 'rgba(255, 255, 255, 0.25)',
                            fontSize: '0.875rem'
                        }}
                    >
                        {user?.firstName?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2">{user?.firstName}</Typography>
                </Button>

                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    sx={{ '& .MuiPaper-root': { borderRadius: 2, mt: 1 } }}
                >
                    <MenuItem disabled sx={{ py: 1.5, px: 2 }}>
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {user?.firstName} {user?.lastName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {user?.email}
                            </Typography>
                        </Box>
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleProfileClick} sx={{ py: 1.5, px: 2 }}>
                        Profile
                    </MenuItem>
                    <MenuItem onClick={handleLogout} sx={{ color: 'error.main', py: 1.5, px: 2 }}>
                        <LogoutIcon sx={{ mr: 1, fontSize: 20 }} /> Logout
                    </MenuItem>
                </Menu>
            </Toolbar>
        </AppBar>
    );
}
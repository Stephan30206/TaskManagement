import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Typography,
    Box,
    Chip,
    CircularProgress,
    IconButton,
    Collapse,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Folder as FolderIcon,
    Assignment as AssignmentIcon,
    Settings as SettingsIcon,
    Analytics as AnalyticsIcon,
    ExpandLess,
    ExpandMore,
    LightMode as LightModeIcon,
    DarkMode as DarkModeIcon,
} from '@mui/icons-material';
import { projectApi } from '../services/api';
import type { Project } from '../services/types';
import { ThemeContext } from '../main';

const DRAWER_WIDTH = 300;

interface SidebarProps {
    open: boolean;
    onClose?: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
    const navigate = useNavigate();
    const { toggleTheme, mode } = useContext(ThemeContext);
    const [projectsOpen, setProjectsOpen] = useState(true);

    const { data: projectsResponse, isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: () => projectApi.getAll(),
    });

    const projects: Project[] = (() => {
        try {
            if (!projectsResponse) return [];

            if (Array.isArray(projectsResponse)) {
                return projectsResponse;
            }

            const response = projectsResponse as any;
            if (response.data && Array.isArray(response.data)) {
                return response.data;
            }

            return [];
        } catch (error) {
            console.error('Erreur lors du chargement des projets', error);
            return [];
        }
    })();

    const handleNavigate = (path: string) => {
        navigate(path);
        onClose?.();
    };

    return (
        <Drawer
            variant="temporary"
            open={open}
            onClose={onClose}
            ModalProps={{ keepMounted: true }}
            sx={{
                width: DRAWER_WIDTH,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: DRAWER_WIDTH,
                    boxSizing: 'border-box',
                    bgcolor: 'background.default',
                    borderRight: 'none',
                    boxShadow: 6,
                },
            }}
        >
            <Box
                sx={{
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Typography variant="h5" fontWeight="bold" color="primary">
                    TaskFlow
                </Typography>
                <IconButton onClick={toggleTheme}>
                    {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 2 }}>
                <List>
                    <ListItem disablePadding>
                        <ListItemButton
                            onClick={() => handleNavigate('/dashboard')}
                            sx={{ px: 3, py: 1.5, borderRadius: 2, mx: 2, my: 0.5, '&:hover': { bgcolor: 'action.hover' } }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <DashboardIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText primary="Dashboard" sx={{ fontWeight: 500 }} />
                        </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding>
                        <ListItemButton
                            onClick={() => handleNavigate('/tickets/my')}
                            sx={{ px: 3, py: 1.5, borderRadius: 2, mx: 2, my: 0.5, '&:hover': { bgcolor: 'action.hover' } }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <AssignmentIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText primary="Mes tickets" sx={{ fontWeight: 500 }} />
                        </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding>
                        <ListItemButton
                            onClick={() => handleNavigate('/analytics')}
                            sx={{ px: 3, py: 1.5, borderRadius: 2, mx: 2, my: 0.5, '&:hover': { bgcolor: 'action.hover' } }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <AnalyticsIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText primary="Statistiques" sx={{ fontWeight: 500 }} />
                        </ListItemButton>
                    </ListItem>
                </List>

                <Divider sx={{ my: 2, mx: 3 }} />

                <ListItemButton
                    onClick={() => setProjectsOpen(!projectsOpen)}
                    sx={{ px: 3, py: 1.5, borderRadius: 2, mx: 2 }}
                >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                        <FolderIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                        primary={`Boards (${projects.length})`}
                        primaryTypographyProps={{ fontWeight: 600 }}
                    />
                    {projectsOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>

                <Collapse in={projectsOpen} timeout="auto" unmountOnExit>
                    {isLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress size={28} />
                        </Box>
                    ) : projects.length > 0 ? (
                        <List sx={{ px: 2 }}>
                            {projects.map((project: Project) => (
                                <ListItem key={project.id} disablePadding sx={{ my: 0.5 }}>
                                    <ListItemButton
                                        onClick={() => handleNavigate(`/projects/${project.id}`)}
                                        sx={{
                                            borderRadius: 2,
                                            pl: 4,
                                            '&:hover': { bgcolor: 'action.hover' },
                                        }}
                                    >
                                        <ListItemText
                                            primary={project.name}
                                            primaryTypographyProps={{
                                                noWrap: true,
                                                variant: 'body2',
                                                fontWeight: 500,
                                            }}
                                        />
                                        <Chip
                                            label={project.status}
                                            size="small"
                                            color={
                                                project.status === 'ACTIVE'
                                                    ? 'success'
                                                    : project.status === 'INACTIVE'
                                                        ? 'warning'
                                                        : 'default'
                                            }
                                            variant="outlined"
                                            sx={{ height: 22, fontSize: '0.7rem' }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Box sx={{ px: 4, py: 2, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Aucun board
                            </Typography>
                        </Box>
                    )}
                </Collapse>

                <Divider sx={{ my: 2, mx: 3 }} />

                <List>
                    <ListItem disablePadding>
                        <ListItemButton
                            onClick={() => handleNavigate('/settings')}
                            sx={{ px: 3, py: 1.5, borderRadius: 2, mx: 2, my: 0.5, '&:hover': { bgcolor: 'action.hover' } }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <SettingsIcon color="action" />
                            </ListItemIcon>
                            <ListItemText primary="Paramètres" />
                        </ListItemButton>
                    </ListItem>
                </List>
            </Box>
        </Drawer>
    );
}
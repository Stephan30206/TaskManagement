import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    Button,
    Avatar,
    AvatarGroup,
    Tooltip,
    Divider,
    IconButton,
    Menu,
    MenuItem,
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    People as PeopleIcon,
    CalendarToday,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Archive as ArchiveIcon,
    Unarchive as UnarchiveIcon,
    ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import type { Project } from '../services/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProjectDetailProps {
    project: Project;
    onEdit?: (project: Project) => void;
    onDelete?: (project: Project) => void;
    onArchive?: (project: Project) => void;
    onViewDetails?: (project: Project) => void;
    compact?: boolean;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({
                                                         project,
                                                         onEdit,
                                                         onDelete,
                                                         onArchive,
                                                         onViewDetails,
                                                         compact = false,
                                                     }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleEdit = () => {
        handleMenuClose();
        onEdit?.(project);
    };

    const handleDelete = () => {
        handleMenuClose();
        onDelete?.(project);
    };

    const handleArchive = () => {
        handleMenuClose();
        onArchive?.(project);
    };

    const handleViewDetails = (e: React.MouseEvent) => {
        e.stopPropagation();
        onViewDetails?.(project);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'success';
            case 'INACTIVE':
                return 'warning';
            case 'ARCHIVED':
                return 'default';
            default:
                return 'default';
        }
    };

    const formatDate = (date: Date) => {
        return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'Actif';
            case 'INACTIVE':
                return 'Inactif';
            case 'ARCHIVED':
                return 'Archivé';
            default:
                return status;
        }
    };

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                    cursor: onViewDetails ? 'pointer' : 'default',
                },
            }}
            onClick={onViewDetails ? () => onViewDetails(project) : undefined}
        >
            <CardContent sx={{ flexGrow: 1, position: 'relative' }}>
                {(onEdit || onDelete || onArchive) && (
                    <>
                        <IconButton
                            size="small"
                            onClick={handleMenuClick}
                            sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                zIndex: 1,
                            }}
                        >
                            <MoreVertIcon />
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleMenuClose}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {onEdit && (
                                <MenuItem onClick={handleEdit}>
                                    <EditIcon fontSize="small" sx={{ mr: 1 }} />
                                    Modifier
                                </MenuItem>
                            )}
                            {onArchive && (
                                <MenuItem onClick={handleArchive}>
                                    {project.status === 'ARCHIVED' ? (
                                        <>
                                            <UnarchiveIcon fontSize="small" sx={{ mr: 1 }} />
                                            Désarchiver
                                        </>
                                    ) : (
                                        <>
                                            <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
                                            Archiver
                                        </>
                                    )}
                                </MenuItem>
                            )}
                            {onDelete && (
                                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                                    Supprimer
                                </MenuItem>
                            )}
                        </Menu>
                    </>
                )}

                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="h3" sx={{
                        fontWeight: 600,
                        flex: 1,
                        pr: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}>
                        {project.name}
                    </Typography>
                    <Chip
                        label={getStatusLabel(project.status)}
                        size="small"
                        color={getStatusColor(project.status)}
                        variant="outlined"
                        sx={{ ml: 1, flexShrink: 0 }}
                    />
                </Box>

                {!compact && project.description && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                        {project.description}
                    </Typography>
                )}

                <Box sx={{ mt: 'auto' }}>
                    {!compact && (
                        <>
                            <Divider sx={{ my: 2 }} />

                            {project.members && project.members.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                        Membres de l'équipe:
                                    </Typography>
                                    <AvatarGroup max={4} sx={{ justifyContent: 'flex-start' }}>
                                        {project.members.slice(0, 4).map((member) => (
                                            <Tooltip
                                                key={member.id}
                                                title={`${member.firstName} ${member.lastName}`}
                                            >
                                                <Avatar
                                                    sx={{ width: 32, height: 32 }}
                                                    alt={`${member.firstName} ${member.lastName}`}
                                                >
                                                    {member.firstName?.charAt(0)}
                                                    {member.lastName?.charAt(0)}
                                                </Avatar>
                                            </Tooltip>
                                        ))}
                                    </AvatarGroup>
                                </Box>
                            )}

                            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <PeopleIcon fontSize="small" color="action" />
                                    <Typography variant="caption" color="text.secondary">
                                        {project.teamIds?.length || 0} membre(s)
                                    </Typography>
                                </Box>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <CalendarToday fontSize="small" color="action" />
                                    <Typography variant="caption" color="text.secondary">
                                        {formatDate(project.createdAt)}
                                    </Typography>
                                </Box>
                            </Box>
                        </>
                    )}

                    {onViewDetails && (
                        <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            endIcon={<ArrowForwardIcon />}
                            onClick={handleViewDetails}
                            sx={{ mt: compact ? 1 : 2 }}
                        >
                            Voir les détails
                        </Button>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default ProjectDetail;
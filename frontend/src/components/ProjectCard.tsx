import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    Chip,
    Box,
    Avatar,
    AvatarGroup,
    IconButton,
} from '@mui/material';
import {
    People as PeopleIcon,
    Assignment as AssignmentIcon,
    MoreVert as MoreVertIcon,
    CalendarToday,
} from '@mui/icons-material';
import type {Project} from '../services/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProjectCardProps {
    project: Project;
    onEdit?: (project: Project) => void;
    onDelete?: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit}) => {
    const navigate = useNavigate();

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

    const handleCardClick = () => {
        navigate(`/project/${project.id}`);
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit?.(project);
    };
    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                },
            }}
            onClick={handleCardClick}
        >
            <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="h2" noWrap sx={{ maxWidth: '70%' }}>
                        {project.name}
                    </Typography>
                    <Chip
                        label={project.status}
                        size="small"
                        color={getStatusColor(project.status)}
                        variant="outlined"
                    />
                </Box>

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

                <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <PeopleIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                            {project.teamIds?.length || 0} membres
                        </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                            {formatDate(project.createdAt)}
                        </Typography>
                    </Box>
                </Box>

                {project.members && project.members.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                            Membres de l'équipe:
                        </Typography>
                        <AvatarGroup max={4}>
                            {project.members.slice(0, 4).map((member) => (
                                <Avatar key={member.id} alt={`${member.firstName} ${member.lastName}`}>
                                    {member.firstName?.charAt(0)}
                                    {member.lastName?.charAt(0)}
                                </Avatar>
                            ))}
                        </AvatarGroup>
                    </Box>
                )}
            </CardContent>

            <CardActions sx={{ justifyContent: 'space-between', p: 2, pt: 0 }}>
                <Button size="small" startIcon={<AssignmentIcon />}>
                    Voir les tickets
                </Button>
                <Box>
                    <IconButton size="small" onClick={handleEditClick}>
                        <MoreVertIcon />
                    </IconButton>
                </Box>
            </CardActions>
        </Card>
    );
};

export default ProjectCard;
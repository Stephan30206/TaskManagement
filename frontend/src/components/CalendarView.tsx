import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Box,
    Card,
    Typography,
    IconButton,
    Chip,
    Tooltip,
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    Today as TodayIcon,
} from '@mui/icons-material';
import { ticketsApi } from '../services/api.ts';
import type { Ticket } from '../services/types.ts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

const CalendarView: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());

    // Fetch tickets
    const { data: tickets } = useQuery({
        queryKey: ['project-tickets', projectId],
        queryFn: () => ticketsApi.getByProject(projectId!),
        enabled: !!projectId,
    });

    const ticketsData = tickets?.data || [];

    // Générer les jours du mois
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Récupérer les tickets pour une date donnée
    const getTicketsForDate = (date: Date) => {
        return ticketsData.filter((ticket: Ticket) => {
            if (!ticket.estimatedDate) return false;
            return isSameDay(new Date(ticket.estimatedDate), date);
        });
    };

    // Navigation
    const handlePreviousMonth = () => {
        setCurrentDate(subMonths(currentDate, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(addMonths(currentDate, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'TODO':
                return '#94a3b8';
            case 'IN_PROGRESS':
                return '#f59e0b';
            case 'IN_VALIDATION':
                return '#3b82f6';
            case 'DONE':
                return '#10b981';
            default:
                return '#94a3b8';
        }
    };

    // Jours de la semaine
    const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    // Calculer le premier jour de la semaine pour le calendrier
    const firstDayOfMonth = monthStart.getDay();
    const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Ajuster pour commencer lundi

    return (
        <Box>
            {/* En-tête du calendrier */}
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
                p={2}
                bgcolor="white"
                borderRadius={2}
                boxShadow={1}
            >
                <Typography variant="h5" fontWeight="bold">
                    {format(currentDate, 'MMMM yyyy', { locale: fr })}
                </Typography>
                <Box display="flex" gap={1}>
                    <IconButton onClick={handleToday} size="small">
                        <TodayIcon />
                    </IconButton>
                    <IconButton onClick={handlePreviousMonth} size="small">
                        <ChevronLeft />
                    </IconButton>
                    <IconButton onClick={handleNextMonth} size="small">
                        <ChevronRight />
                    </IconButton>
                </Box>
            </Box>

            {/* Calendrier */}
            <Card sx={{ p: 2 }}>
                {/* Jours de la semaine */}
                <Box
                    display="grid"
                    gridTemplateColumns="repeat(7, 1fr)"
                    gap={1}
                    mb={2}
                >
                    {weekDays.map((day) => (
                        <Box
                            key={day}
                            textAlign="center"
                            py={1}
                            fontWeight="bold"
                            color="text.secondary"
                        >
                            {day}
                        </Box>
                    ))}
                </Box>

                {/* Jours du mois */}
                <Box
                    display="grid"
                    gridTemplateColumns="repeat(7, 1fr)"
                    gap={1}
                    sx={{
                        '& > div': {
                            aspectRatio: '1',
                        },
                    }}
                >
                    {/* Cases vides avant le premier jour */}
                    {Array.from({ length: startDay }).map((_, index) => (
                        <Box key={`empty-${index}`} />
                    ))}

                    {/* Jours du mois */}
                    {daysInMonth.map((day) => {
                        const dayTickets = getTicketsForDate(day);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <Box
                                key={day.toISOString()}
                                sx={{
                                    border: 1,
                                    borderColor: isToday ? 'primary.main' : 'divider',
                                    borderRadius: 1,
                                    p: 1,
                                    bgcolor: isToday ? 'primary.50' : 'white',
                                    cursor: dayTickets.length > 0 ? 'pointer' : 'default',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        bgcolor: dayTickets.length > 0 ? 'grey.50' : 'white',
                                        boxShadow: dayTickets.length > 0 ? 2 : 0,
                                    },
                                }}
                            >
                                {/* Numéro du jour */}
                                <Box
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    mb={0.5}
                                >
                                    <Typography
                                        variant="body2"
                                        fontWeight={isToday ? 'bold' : 'normal'}
                                        color={isToday ? 'primary' : 'text.primary'}
                                    >
                                        {format(day, 'd')}
                                    </Typography>
                                    {dayTickets.length > 0 && (
                                        <Chip
                                            label={dayTickets.length}
                                            size="small"
                                            sx={{
                                                height: 18,
                                                fontSize: 10,
                                                bgcolor: 'primary.main',
                                                color: 'white',
                                            }}
                                        />
                                    )}
                                </Box>

                                {/* Tickets du jour */}
                                <Box display="flex" flexDirection="column" gap={0.5}>
                                    {dayTickets.slice(0, 3).map((ticket: Ticket) => (
                                        <Tooltip
                                            key={ticket.id}
                                            title={
                                                <Box>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {ticket.title}
                                                    </Typography>
                                                    {ticket.description && (
                                                        <Typography variant="caption">
                                                            {ticket.description.substring(0, 100)}...
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                            arrow
                                        >
                                            <Box
                                                onClick={() => navigate(`/ticket/${ticket.id}`)}
                                                sx={{
                                                    p: 0.5,
                                                    borderRadius: 0.5,
                                                    bgcolor: getStatusColor(ticket.status) + '20',
                                                    borderLeft: `3px solid ${getStatusColor(ticket.status)}`,
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        bgcolor: getStatusColor(ticket.status) + '40',
                                                    },
                                                }}
                                            >
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 1,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        fontSize: 10,
                                                    }}
                                                >
                                                    {ticket.title}
                                                </Typography>
                                            </Box>
                                        </Tooltip>
                                    ))}

                                    {dayTickets.length > 3 && (
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ fontSize: 9, textAlign: 'center' }}
                                        >
                                            +{dayTickets.length - 3} autre(s)
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Card>

            {/* Légende */}
            <Box display="flex" gap={2} mt={3} flexWrap="wrap">
                <Box display="flex" alignItems="center" gap={1}>
                    <Box
                        sx={{
                            width: 16,
                            height: 16,
                            bgcolor: '#94a3b8',
                            borderRadius: 0.5,
                        }}
                    />
                    <Typography variant="body2">À faire</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                    <Box
                        sx={{
                            width: 16,
                            height: 16,
                            bgcolor: '#f59e0b',
                            borderRadius: 0.5,
                        }}
                    />
                    <Typography variant="body2">En cours</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                    <Box
                        sx={{
                            width: 16,
                            height: 16,
                            bgcolor: '#3b82f6',
                            borderRadius: 0.5,
                        }}
                    />
                    <Typography variant="body2">En validation</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                    <Box
                        sx={{
                            width: 16,
                            height: 16,
                            bgcolor: '#10b981',
                            borderRadius: 0.5,
                        }}
                    />
                    <Typography variant="body2">Terminé</Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default CalendarView;
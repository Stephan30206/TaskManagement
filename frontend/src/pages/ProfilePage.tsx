import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Avatar,
    Divider,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    IconButton,
    InputAdornment,
} from '@mui/material';
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Visibility,
    VisibilityOff,
    ArrowBack,
    Person as PersonIcon, // Icône profil ajoutée
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { userApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import type { User } from '../services/types';

interface ProfileFormData {
    firstName: string;
    lastName: string;
    email: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
}

interface AuthContextType {
    user: User | null;
    updateUser: (user: User) => void;
}

const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth() as AuthContextType;
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState<ProfileFormData>({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const { data: currentUserResponse, isLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => userApi.getCurrentUser(),
        enabled: !!user,
    });

    const updateProfileMutation = useMutation({
        mutationFn: (data: Partial<ProfileFormData>) => userApi.updateProfile(data),
        onSuccess: (response) => {
            enqueueSnackbar('Profil mis à jour avec succès', { variant: 'success' });
            updateUser(response.data);
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            setIsEditing(false);
            setFormData({
                ...formData,
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        },
        onError: (error: any) => {
            enqueueSnackbar(
                error.response?.data?.message || 'Erreur lors de la mise à jour',
                { variant: 'error' }
            );
        },
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            enqueueSnackbar('Le prénom et le nom sont requis', { variant: 'error' });
            return;
        }

        if (formData.newPassword) {
            if (!formData.currentPassword) {
                enqueueSnackbar('Le mot de passe actuel est requis', { variant: 'error' });
                return;
            }
            if (formData.newPassword !== formData.confirmPassword) {
                enqueueSnackbar('Les mots de passe ne correspondent pas', { variant: 'error' });
                return;
            }
            if (formData.newPassword.length < 6) {
                enqueueSnackbar('Le mot de passe doit contenir au moins 6 caractères', {
                    variant: 'error',
                });
                return;
            }
        }

        const updateData: any = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
        };

        if (formData.newPassword) {
            updateData.currentPassword = formData.currentPassword;
            updateData.newPassword = formData.newPassword;
        }

        updateProfileMutation.mutate(updateData);
    };

    const handleCancel = () => {
        const userData = currentUserResponse?.data || user;
        setFormData({
            firstName: userData?.firstName || '',
            lastName: userData?.lastName || '',
            email: userData?.email || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
        setIsEditing(false);
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    const userData = currentUserResponse?.data || user;

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <Navbar />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 3 }}>
                    <Button
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/dashboard')}
                        sx={{ textTransform: 'none' }}
                    >
                        Retour au tableau de bord
                    </Button>
                </Box>

                <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <PersonIcon fontSize="large" color="primary" />
                            <Typography variant="h4" fontWeight="bold">
                                Mon Profil
                            </Typography>
                        </Box>
                        {!isEditing ? (
                            <Button
                                variant="contained"
                                startIcon={<EditIcon />}
                                onClick={() => setIsEditing(true)}
                                sx={{ textTransform: 'none' }}
                            >
                                Modifier
                            </Button>
                        ) : (
                            <Box display="flex" gap={2}>
                                <Button
                                    variant="outlined"
                                    startIcon={<CancelIcon />}
                                    onClick={handleCancel}
                                    disabled={updateProfileMutation.isPending}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    onClick={handleSubmit}
                                    disabled={updateProfileMutation.isPending}
                                    sx={{ textTransform: 'none' }}
                                >
                                    {updateProfileMutation.isPending ? (
                                        <CircularProgress size={24} />
                                    ) : (
                                        'Enregistrer'
                                    )}
                                </Button>
                            </Box>
                        )}
                    </Box>

                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 2fr' }} gap={4}>
                        <Card sx={{ textAlign: 'center', p: 3 }}>
                            <Avatar
                                sx={{
                                    width: 120,
                                    height: 120,
                                    margin: '0 auto 16px',
                                    bgcolor: 'primary.main',
                                    fontSize: '3rem',
                                }}
                            >
                                {userData?.firstName?.charAt(0)?.toUpperCase()}
                                {userData?.lastName?.charAt(0)?.toUpperCase()}
                            </Avatar>
                            <Typography variant="h6" fontWeight="bold">
                                {userData?.firstName} {userData?.lastName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {userData?.email}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                                Membre depuis {new Date(userData?.createdAt || '').toLocaleDateString('fr-FR')}
                            </Typography>
                        </Card>

                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Informations personnelles
                                </Typography>
                                <Divider sx={{ mb: 3 }} />

                                <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={3}>
                                    <TextField
                                        fullWidth
                                        label="Prénom"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        variant="outlined"
                                    />
                                    <TextField
                                        fullWidth
                                        label="Nom"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        variant="outlined"
                                    />
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        type="email"
                                        variant="outlined"
                                        sx={{ gridColumn: { xs: '1', sm: '1 / span 2' } }}
                                    />
                                </Box>

                                {isEditing && (
                                    <>
                                        <Divider sx={{ my: 4 }} />
                                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                                            Changer le mot de passe
                                        </Typography>
                                        <Alert severity="info" sx={{ mb: 3 }}>
                                            Laissez ces champs vides si vous ne souhaitez pas changer votre mot de passe
                                        </Alert>

                                        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={3}>
                                            <TextField
                                                fullWidth
                                                label="Mot de passe actuel"
                                                name="currentPassword"
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.currentPassword}
                                                onChange={handleInputChange}
                                                variant="outlined"
                                                sx={{ gridColumn: { xs: '1', sm: '1 / span 2' } }}
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                onClick={() => setShowPassword(!showPassword)}
                                                                edge="end"
                                                            >
                                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                            <TextField
                                                fullWidth
                                                label="Nouveau mot de passe"
                                                name="newPassword"
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.newPassword}
                                                onChange={handleInputChange}
                                                variant="outlined"
                                            />
                                            <TextField
                                                fullWidth
                                                label="Confirmer le mot de passe"
                                                name="confirmPassword"
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                                variant="outlined"
                                            />
                                        </Box>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default ProfilePage;
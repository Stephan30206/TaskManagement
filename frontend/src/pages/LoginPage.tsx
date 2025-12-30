import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Container,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    InputAdornment,
    IconButton,
    Grid,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Login as LoginIcon,
    Email as EmailIcon,
    Lock as LockIcon,

} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({
    email: z.string().email('Email invalide').min(1, 'Email requis'),
    password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const mutation = useMutation({
        mutationFn: (data: LoginFormData) => authApi.login(data),
        onSuccess: (response) => {
            login(response.data.token, response.data as any);
            enqueueSnackbar('Connexion réussie !', { variant: 'success' });
            navigate('/dashboard');
        },
        onError: (error: any) => {
            enqueueSnackbar(
                error.response?.data?.message || 'Email ou mot de passe incorrect',
                { variant: 'error' }
            );
        },
    });

    const onSubmit = (data: LoginFormData) => {
        mutation.mutate(data);
    };

    // @ts-ignore
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>
            {/* Header/Navigation */}
            <Box
                sx={{
                    bgcolor: 'white',
                    borderBottom: '1px solid #e2e8f0',
                    py: 2,
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
            >
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography
                            variant="h5"
                            fontWeight={700}
                            sx={{
                                background: 'linear-gradient(135deg, #5e72e4 0%, #825ee4 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '-0.5px',
                            }}
                        >
                            ProjecHub
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Nouveau sur ProjecHub ?
                            </Typography>
                            <Button
                                component={Link}
                                to="/register"
                                variant="outlined"
                                sx={{
                                    textTransform: 'none',
                                    borderRadius: 2,
                                    px: 3,
                                    borderColor: '#5e72e4',
                                    color: '#5e72e4',
                                    '&:hover': {
                                        borderColor: '#4c63d2',
                                        bgcolor: 'rgba(94, 114, 228, 0.04)',
                                    }
                                }}
                            >
                                Créer un compte
                            </Button>
                        </Box>
                    </Box>
                </Container>
            </Box>

            {/* Hero Section with Login Form */}
            <Container maxWidth="lg" sx={{ py: 8 }}>
                <Grid container spacing={6} alignItems="center">
                    {/* Left Side - Content */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box>
                            <Typography
                                variant="h2"
                                fontWeight={800}
                                sx={{
                                    mb: 3,
                                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                                    lineHeight: 1.2,
                                    color: '#1a202c',
                                    letterSpacing: '-1px',
                                }}
                            >
                                Gérez vos projets{' '}
                                <Box
                                    component="span"
                                    sx={{
                                        background: 'linear-gradient(135deg, #5e72e4 0%, #825ee4 100%)',
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    avec intelligence
                                </Box>
                            </Typography>
                            <Typography
                                variant="h6"
                                color="text.secondary"
                                sx={{ mb: 5, lineHeight: 1.7, fontWeight: 400 }}
                            >
                                ProjecHub centralise vos tâches, équipes et objectifs en une seule plateforme puissante. Simplifiez votre gestion de projet.
                            </Typography>
                        </Box>
                    </Grid>

                    {/* Right Side - Login Form */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box
                            sx={{
                                bgcolor: 'white',
                                borderRadius: 4,
                                p: 5,
                                boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                                border: '1px solid #e2e8f0',
                            }}
                        >
                            <Typography
                                variant="h4"
                                fontWeight={700}
                                gutterBottom
                                sx={{ mb: 1, color: '#1a202c' }}
                            >
                                Connexion
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                                Accédez à votre espace de travail
                            </Typography>

                            {mutation.isError && (
                                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                    Email ou mot de passe incorrect
                                </Alert>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)}>
                                <TextField
                                    fullWidth
                                    label="Adresse email"
                                    type="email"
                                    {...register('email')}
                                    error={!!errors.email}
                                    helperText={errors.email?.message}
                                    margin="normal"
                                    variant="outlined"
                                    sx={{
                                        mb: 2,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&:hover fieldset': {
                                                borderColor: '#5e72e4',
                                            },
                                        }
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailIcon sx={{ color: '#a0aec0' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <TextField
                                    fullWidth
                                    label="Mot de passe"
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('password')}
                                    error={!!errors.password}
                                    helperText={errors.password?.message}
                                    margin="normal"
                                    variant="outlined"
                                    sx={{
                                        mb: 1,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&:hover fieldset': {
                                                borderColor: '#5e72e4',
                                            },
                                        }
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockIcon sx={{ color: '#a0aec0' }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                    sx={{ color: '#a0aec0' }}
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <Box sx={{ textAlign: 'right', mb: 3 }}>
                                    <Link
                                        to="/forgot-password"
                                        style={{
                                            textDecoration: 'none',
                                            color: '#5e72e4',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                        }}
                                    >
                                        Mot de passe oublié ?
                                    </Link>
                                </Box>

                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    disabled={mutation.isPending}
                                    startIcon={!mutation.isPending && <LoginIcon />}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 2,
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                        background: 'linear-gradient(135deg, #5e72e4 0%, #825ee4 100%)',
                                        boxShadow: '0 4px 14px rgba(94, 114, 228, 0.4)',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #4c63d2 0%, #7049d0 100%)',
                                            boxShadow: '0 6px 20px rgba(94, 114, 228, 0.5)',
                                        },
                                        '&:disabled': {
                                            background: '#cbd5e0',
                                        }
                                    }}
                                >
                                    {mutation.isPending ? 'Connexion en cours...' : 'Se connecter'}
                                </Button>

                                <Box textAlign="center" mt={3}>
                                    <Typography variant="body2" color="text.secondary">
                                        Pas encore de compte ?{' '}
                                        <Link
                                            to="/register"
                                            style={{
                                                textDecoration: 'none',
                                                color: '#5e72e4',
                                                fontWeight: 600,
                                            }}
                                        >
                                            Commencer gratuitement
                                        </Link>
                                    </Typography>
                                </Box>
                            </form>
                        </Box>
                    </Grid>
                </Grid>
            </Container>

            {/* Footer */}
            <Box sx={{ bgcolor: '#1a202c', color: 'white', py: 4, mt: 8 }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            © 2025 ProjecHub — Plateforme de gestion de projet nouvelle génération
                        </Typography>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export default LoginPage;
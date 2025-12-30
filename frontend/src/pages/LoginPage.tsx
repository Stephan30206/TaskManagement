import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    InputAdornment,
    IconButton,
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
            enqueueSnackbar('Connexion réussie!', { variant: 'success' });
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

    const handleDemoLogin = () => {
        mutation.mutate({
            email: 'demo@example.com',
            password: 'demo123',
        });
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                }}
            >
                <Box textAlign="center" mb={3}>
                    <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
                        TaskFlow
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                        Gestion de projets et tickets collaboratifs
                    </Typography>
                </Box>

                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: 'white' }}>
                    <Typography variant="h5" component="h2" gutterBottom align="center" color="textPrimary">
                        Connexion
                    </Typography>

                    {mutation.isError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            Email ou mot de passe incorrect
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            {...register('email')}
                            error={!!errors.email}
                            helperText={errors.email?.message}
                            margin="normal"
                            variant="outlined"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailIcon color="action" />
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
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon color="action" />
                                    </InputAdornment>
                                ),
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

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={mutation.isPending}
                            startIcon={<LoginIcon />}
                            sx={{ mt: 3, mb: 2, py: 1.5 }}
                        >
                            {mutation.isPending ? 'Connexion...' : 'Se connecter'}
                        </Button>

                        <Box textAlign="center" mt={2}>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                Pas de compte?{' '}
                                <Link to="/register" style={{ textDecoration: 'none', color: '#1976d2' }}>
                                    S'inscrire
                                </Link>
                            </Typography>

                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={handleDemoLogin}
                                sx={{ mt: 2 }}
                                disabled={mutation.isPending}
                            >
                                Essayer la version démo
                            </Button>
                        </Box>
                    </form>
                </Paper>

                <Box mt={4} textAlign="center">
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        © 2024 TaskFlow - Gestion de tâches collaborative
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default LoginPage;
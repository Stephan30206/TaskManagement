import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { useMutation } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    CircularProgress,
    InputAdornment,
    IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

interface RegisterFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
}

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { enqueueSnackbar } = useSnackbar();

    const [formData, setFormData] = useState<RegisterFormData>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Partial<RegisterFormData>>({});

    const mutation = useMutation({
        mutationFn: (data: Omit<RegisterFormData, 'confirmPassword'>) =>
            authApi.register(data),
        onSuccess: (response) => {
            login(response.data.token, response.data as any);
            enqueueSnackbar('Inscription réussie!', { variant: 'success' });
            navigate('/dashboard');
        },
        onError: (error: any) => {
            enqueueSnackbar(
                error.response?.data?.message || "Erreur lors de l'inscription",
                { variant: 'error' }
            );
        },
    });

    const validateForm = (): boolean => {
        const errors: Partial<RegisterFormData> = {};

        if (!formData.firstName.trim()) {
            errors.firstName = 'Le prénom est requis';
        }

        if (!formData.lastName.trim()) {
            errors.lastName = 'Le nom est requis';
        }

        if (!formData.email) {
            errors.email = 'Email est requis';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = "Format d'email invalide";
        }

        if (!formData.phone.trim()) {
            errors.phone = 'Le téléphone est requis';
        } else if (!/^[\+]?[0-9\s\-\(\)]+$/.test(formData.phone)) {
            errors.phone = 'Format de téléphone invalide';
        }

        if (!formData.password) {
            errors.password = 'Le mot de passe est requis';
        } else if (formData.password.length < 6) {
            errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
        }

        if (!formData.confirmPassword) {
            errors.confirmPassword = 'Veuillez confirmer votre mot de passe';
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Les mots de passe ne correspondent pas';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));

        if (validationErrors[name as keyof RegisterFormData]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: undefined,
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const { confirmPassword, ...registerData } = formData;
        mutation.mutate(registerData);
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
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
                        Créez votre compte
                    </Typography>
                </Box>

                <Paper elevation={0} sx={{ p: 4, borderRadius: 2, bgcolor: 'white' }}>
                    <Typography variant="h5" component="h2" gutterBottom align="center" color="textPrimary">
                        Inscription
                    </Typography>

                    <form onSubmit={handleSubmit}>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <TextField
                                fullWidth
                                label="Prénom"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                error={!!validationErrors.firstName}
                                helperText={validationErrors.firstName}
                                disabled={mutation.isPending}
                                required
                                variant="outlined"
                            />
                            <TextField
                                fullWidth
                                label="Nom"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                error={!!validationErrors.lastName}
                                helperText={validationErrors.lastName}
                                disabled={mutation.isPending}
                                required
                                variant="outlined"
                            />
                        </Box>

                        <TextField
                            fullWidth
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            error={!!validationErrors.email}
                            helperText={validationErrors.email}
                            disabled={mutation.isPending}
                            margin="normal"
                            required
                            variant="outlined"
                        />

                        <TextField
                            fullWidth
                            label="Téléphone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            error={!!validationErrors.phone}
                            helperText={validationErrors.phone}
                            disabled={mutation.isPending}
                            margin="normal"
                            required
                            variant="outlined"
                            placeholder="+33 1 23 45 67 89"
                        />

                        <TextField
                            fullWidth
                            label="Mot de passe"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleChange}
                            error={!!validationErrors.password}
                            helperText={validationErrors.password}
                            disabled={mutation.isPending}
                            margin="normal"
                            required
                            variant="outlined"
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
                            label="Confirmer le mot de passe"
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            error={!!validationErrors.confirmPassword}
                            helperText={validationErrors.confirmPassword}
                            disabled={mutation.isPending}
                            margin="normal"
                            required
                            variant="outlined"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            edge="end"
                                        >
                                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                            sx={{ mt: 3, mb: 2, py: 1.5 }}
                        >
                            {mutation.isPending ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                "S'inscrire"
                            )}
                        </Button>

                        <Box textAlign="center" mt={2}>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                Déjà un compte?{' '}
                                <Link to="/login" style={{ textDecoration: 'none', color: '#1976d2' }}>
                                    Se connecter
                                </Link>
                            </Typography>
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

export default RegisterPage;
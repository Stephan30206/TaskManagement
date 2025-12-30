import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { useMutation } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
    Container,
    TextField,
    Button,
    Typography,
    Box,
    CircularProgress,
    InputAdornment,
    IconButton,
    Grid,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
} from '@mui/icons-material';

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
                            component={Link}
                            to="/login"
                            sx={{
                                background: 'linear-gradient(135deg, #5e72e4 0%, #825ee4 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '-0.5px',
                                textDecoration: 'none',
                            }}
                        >
                            ProjecHub
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Déjà inscrit ?
                            </Typography>
                            <Button
                                component={Link}
                                to="/login"
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
                                Se connecter
                            </Button>
                        </Box>
                    </Box>
                </Container>
            </Box>

            {/* Hero Section with Register Form */}
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
                                Commencez{' '}
                                <Box
                                    component="span"
                                    sx={{
                                        background: 'linear-gradient(135deg, #5e72e4 0%, #825ee4 100%)',
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    gratuitement
                                </Box>
                                {' '}aujourd'hui
                            </Typography>
                            <Typography
                                variant="h6"
                                color="text.secondary"
                                sx={{ mb: 5, lineHeight: 1.7, fontWeight: 400 }}
                            >
                                Rejoignez plus de 50 000 équipes qui utilisent ProjecHub pour transformer leur façon de travailler.
                            </Typography>
                        </Box>
                    </Grid>

                    {/* Right Side - Register Form */}
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
                                Créer un compte
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                                Démarrez votre essai gratuit maintenant
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
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '&:hover fieldset': {
                                                    borderColor: '#5e72e4',
                                                },
                                            }
                                        }}
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
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '&:hover fieldset': {
                                                    borderColor: '#5e72e4',
                                                },
                                            }
                                        }}
                                    />
                                </Box>

                                <TextField
                                    fullWidth
                                    label="Adresse email professionnelle"
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
                                    sx={{
                                        mb: 2,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&:hover fieldset': {
                                                borderColor: '#5e72e4',
                                            },
                                        }
                                    }}
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
                                    sx={{
                                        mb: 2,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&:hover fieldset': {
                                                borderColor: '#5e72e4',
                                            },
                                        }
                                    }}
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
                                    sx={{
                                        mb: 3,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&:hover fieldset': {
                                                borderColor: '#5e72e4',
                                            },
                                        }
                                    }}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    edge="end"
                                                    sx={{ color: '#a0aec0' }}
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
                                    {mutation.isPending ? (
                                        <CircularProgress size={24} color="inherit" />
                                    ) : (
                                        "Commencer gratuitement"
                                    )}
                                </Button>

                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
                                    En créant un compte, vous acceptez nos{' '}
                                    <Link to="/terms" style={{ color: '#5e72e4', textDecoration: 'none' }}>
                                        conditions d'utilisation
                                    </Link>
                                    {' '}et notre{' '}
                                    <Link to="/privacy" style={{ color: '#5e72e4', textDecoration: 'none' }}>
                                        politique de confidentialité
                                    </Link>
                                </Typography>

                                <Box textAlign="center" mt={3}>
                                    <Typography variant="body2" color="text.secondary">
                                        Vous avez déjà un compte ?{' '}
                                        <Link
                                            to="/login"
                                            style={{
                                                textDecoration: 'none',
                                                color: '#5e72e4',
                                                fontWeight: 600,
                                            }}
                                        >
                                            Connectez-vous
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

export default RegisterPage;
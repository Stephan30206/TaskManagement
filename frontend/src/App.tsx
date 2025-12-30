import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import TicketDetailPage from './pages/TicketDetailPage';
import ProjectMembersPage from './pages/ProjectMembersPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationsPage from './pages/NotificationsPage'


const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
    },
});

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

const App: React.FC = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <SnackbarProvider maxSnack={3}>
                    <AuthProvider>
                        <Router>
                            <Routes>
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/register" element={<RegisterPage />} />

                                <Route path="/dashboard" element={
                                    <ProtectedRoute>
                                        <DashboardPage />
                                    </ProtectedRoute>
                                } />

                                <Route path="/project/:projectId" element={
                                    <ProtectedRoute>
                                        <ProjectDetailPage />
                                    </ProtectedRoute>
                                } />

                                <Route path="/project/:projectId/members" element={
                                    <ProtectedRoute>
                                        <ProjectMembersPage />
                                    </ProtectedRoute>
                                } />

                                <Route path="/project/:projectId/edit" element={
                                    <ProtectedRoute>
                                        <ProjectDetailPage />
                                    </ProtectedRoute>
                                } />

                                <Route path="/ticket/:ticketId" element={
                                    <ProtectedRoute>
                                        <TicketDetailPage />
                                    </ProtectedRoute>
                                } />

                                <Route
                                    path="/profile"
                                    element={
                                        <ProtectedRoute>
                                            <ProfilePage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/notifications"
                                    element={
                                        <ProtectedRoute>
                                            <NotificationsPage />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                <Route path="*" element={<Navigate to="/dashboard" replace />} />
                            </Routes>
                        </Router>
                    </AuthProvider>
                </SnackbarProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
};

export default App;
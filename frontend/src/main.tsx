import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme, CssBaseline, useMediaQuery } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.tsx';

// Interface claire pour le contexte
interface ThemeContextType {
    toggleTheme: () => void;
    mode: 'light' | 'dark';
}

// Création du contexte avec type explicite
export const ThemeContext = React.createContext<ThemeContextType>({
    toggleTheme: () => {},
    mode: 'light',
});

const root = ReactDOM.createRoot(document.getElementById('root')!);

const MainApp = () => {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [mode, setMode] = useState<'light' | 'dark'>(prefersDarkMode ? 'dark' : 'light');

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                    primary: { main: '#6366f1' },
                    secondary: { main: '#0ea5e9' },
                    background: {
                        default: mode === 'dark' ? '#1f2937' : '#f9fafb',
                        paper: mode === 'dark' ? '#374151' : '#ffffff',
                    },
                    success: { main: '#10b981' },
                    warning: { main: '#f59e0b' },
                    error: { main: '#ef4444' },
                    text: {
                        primary: mode === 'dark' ? '#e5e7eb' : '#1f2937',
                    },
                },
                typography: {
                    fontFamily: ['Inter', 'sans-serif'].join(','),
                },
                components: {
                    MuiCard: {
                        styleOverrides: {
                            root: {
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                borderRadius: 12,
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'scale(1.02)' },
                            },
                        },
                    },
                    MuiButton: {
                        styleOverrides: {
                            root: { borderRadius: 8, textTransform: 'none' },
                        },
                    },
                },
            }),
        [mode]
    );

    const toggleTheme = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));

    return (
        <React.StrictMode>
            <QueryClientProvider client={new QueryClient()}>
                <ThemeContext.Provider value={{ toggleTheme, mode }}>
                    <ThemeProvider theme={theme}>
                        <CssBaseline />
                        <SnackbarProvider maxSnack={3}>
                            <AuthProvider>
                                <App />
                            </AuthProvider>
                        </SnackbarProvider>
                    </ThemeProvider>
                </ThemeContext.Provider>
            </QueryClientProvider>
        </React.StrictMode>
    );
};

root.render(<MainApp />);
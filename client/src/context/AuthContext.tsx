import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import axios from 'axios';
import { User, AuthState } from '../types';

axios.defaults.baseURL = 'http://localhost:5000';

// Define action types
type AuthAction =
    | { type: 'LOGIN_SUCCESS'; payload: { token: string; user: User } }
    | { type: 'REGISTER_SUCCESS'; payload: { token: string; user: User } }
    | { type: 'LOGOUT' }
    | { type: 'AUTH_ERROR'; payload: string }
    | { type: 'CLEAR_ERROR' }
    | { type: 'LOADING' }
    | { type: 'USER_LOADED'; payload: User };

// Initial state
const initialState: AuthState = {
    isAuthenticated: !!localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    loading: false, // Start as false, only true during actions
    error: null,
    authToken: localStorage.getItem('token'),
};

// Create context
interface AuthContextType {
    state: AuthState;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    clearError: () => void;
    updateProfile: (userData: Partial<User>) => Promise<void>;
    setAuthToken: (token: string | null) => void;
}

const defaultContextValue: AuthContextType = {
    state: initialState,
    login: async () => { throw new Error('AuthContext not initialized'); },
    register: async () => { throw new Error('AuthContext not initialized'); },
    logout: () => { throw new Error('AuthContext not initialized'); },
    clearError: () => { throw new Error('AuthContext not initialized'); },
    updateProfile: async () => { throw new Error('AuthContext not initialized'); },
    setAuthToken: () => { throw new Error('AuthContext not initialized'); },
};

const AuthContext = createContext<AuthContextType>(defaultContextValue);

// Reducer function
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case 'USER_LOADED':
            return {
                ...state,
                isAuthenticated: true,
                user: action.payload,
                loading: false,
            };
        case 'LOGIN_SUCCESS':
        case 'REGISTER_SUCCESS':
            localStorage.setItem('token', action.payload.token);
            localStorage.setItem('user', JSON.stringify(action.payload.user));
            console.log('Token saved to localStorage:', action.payload.token);
            return {
                ...state,
                isAuthenticated: true,
                user: action.payload.user,
                loading: false,
                error: null,
                authToken: action.payload.token,
            };
        case 'LOGOUT':
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            console.log('Token removed from localStorage');
            return {
                ...state,
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null,
                authToken: null,
            };
        case 'AUTH_ERROR':
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        case 'LOADING':
            return {
                ...state,
                loading: true,
            };
        case 'CLEAR_ERROR':
            return {
                ...state,
                error: null,
            };
        default:
            return state;
    }
};

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    const setAuthToken = (token: string | null) => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            console.log('Set axios default Authorization header:', `Bearer ${token}`);
        } else {
            delete axios.defaults.headers.common['Authorization'];
            console.log('Removed axios default Authorization header');
        }
    };

    const loadUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        console.log('Loading user with token from localStorage:', token);

        if (token && user && !state.isAuthenticated) {
            try {
                setAuthToken(token);
                const res = await axios.get('/api/auth/validate', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                dispatch({ type: 'USER_LOADED', payload: user });
                console.log('Token validated, user loaded:', res.data);
            } catch (err: any) {
                console.error('Token validation failed:', {
                    message: err.response?.data?.message || err.message,
                    status: err.response?.status,
                });
                // Don’t clear token here unless explicitly logging out
                dispatch({ type: 'AUTH_ERROR', payload: 'Session expired. Please log in again.' });
            }
        }
    }, [state.isAuthenticated]);

    useEffect(() => {
        if (!state.isAuthenticated) {
            loadUser();
        }
    }, [loadUser, state.isAuthenticated]);

    const login = async (email: string, password: string) => {
        try {
            console.log('Attempting login with:', { email: email.toLowerCase(), password });
            dispatch({ type: 'LOADING' });
            const res = await axios.post('/api/auth/login', { email: email.toLowerCase(), password });
            console.log('Login response:', res.data);
            if (!res.data.token || !res.data.user) {
                throw new Error('Invalid login response: token or user missing');
            }
            setAuthToken(res.data.token); // Set token for axios
            dispatch({ type: 'LOGIN_SUCCESS', payload: res.data });
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Login failed';
            console.error('Login error:', { message: errorMessage, status: err.response?.status });
            dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
            throw new Error(errorMessage);
        }
    };

    const register = async (username: string, email: string, password: string) => {
        try {
            console.log('Attempting register with:', { username, email: email.toLowerCase(), password });
            dispatch({ type: 'LOADING' });
            const res = await axios.post('/api/auth/register', {
                username,
                email: email.toLowerCase(),
                password,
            });
            console.log('Register response:', res.data);
            if (!res.data.token || !res.data.user) {
                throw new Error('Invalid register response: token or user missing');
            }
            setAuthToken(res.data.token);
            dispatch({ type: 'REGISTER_SUCCESS', payload: res.data });
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
            console.error('Register error:', { message: errorMessage, status: err.response?.status });
            dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
            throw new Error(errorMessage);
        }
    };

    const logout = () => {
        setAuthToken(null);
        dispatch({ type: 'LOGOUT' });
    };

    const clearError = useCallback(() => {
        dispatch({ type: 'CLEAR_ERROR' });
    }, []);

    const updateProfile = async (userData: Partial<User>) => {
        try {
            dispatch({ type: 'LOADING' });
            const res = await axios.put('/api/users/profile', userData, {
                headers: { Authorization: `Bearer ${state.authToken}` },
            });
            dispatch({ type: 'USER_LOADED', payload: res.data });
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Profile update failed';
            dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
            throw new Error(errorMessage);
        }
    };

    return (
        <AuthContext.Provider value={{ state, login, register, logout, clearError, updateProfile, setAuthToken }}>
            {children}
        </AuthContext.Provider>
    )
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === defaultContextValue) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { state } = useAuth();
    const location = useLocation();

    if (state.loading) {
        // You could render a loading spinner here
        return <div>Loading...</div>;
    }

    if (!state.isAuthenticated) {
        // Redirect to login page but save the current location they were trying to access
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute; 
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: (string | number)[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('token');
    const userProfile = localStorage.getItem('userProfile');
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && userProfile) {
        try {
            const user = JSON.parse(userProfile);
            const userRole = user.role;

            if (!allowedRoles.includes(userRole)) {
                // Redirect user to their own dashboard if they try to access unauthorized pages
                console.warn(`Access denied for role ${userRole}. Allowed: ${allowedRoles}`);

                if (userRole === 'admin' || userRole === 6) return <Navigate to="/admin" replace />;
                if (userRole === 'super_admin' || userRole === 1) return <Navigate to="/super-admin" replace />;
                if (userRole === 5) return <Navigate to="/rector" replace />;
                if (userRole === 4) return <Navigate to="/faculty" replace />;
                if (userRole === 2) return <Navigate to="/committee" replace />;

                return <Navigate to="/dashboard" replace />;
            }
        } catch (e) {
            console.error("Failed to parse user profile in ProtectedRoute", e);
            return <Navigate to="/login" replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;

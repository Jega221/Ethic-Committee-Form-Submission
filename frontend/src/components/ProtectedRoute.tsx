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

    // If no role restrictions, allow access
    if (!allowedRoles || allowedRoles.length === 0) {
        return <>{children}</>;
    }

    if (!userProfile) {
        // If no user profile but has token, redirect to login to refresh
        console.warn("Token exists but no user profile found");
        return <Navigate to="/login" replace />;
    }

    try {
        const user = JSON.parse(userProfile);
        let userRole = user.role;
        let userRoleId = user.role_id || userRole;

        // If role is null/undefined, try to decode from JWT token as fallback
        if ((userRole === null || userRole === undefined) && token) {
            try {
                // Decode JWT token (without verification, just to get the payload)
                const tokenParts = token.split('.');
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(atob(tokenParts[1]));
                    userRole = payload.role;
                    userRoleId = payload.role || userRoleId;
                    console.log('Decoded role from token:', userRole);
                }
            } catch (tokenError) {
                console.warn('Failed to decode token for role fallback:', tokenError);
            }
        }

        // If still no role, deny access and redirect to login
        if (userRole === null || userRole === undefined) {
            console.error('User role is missing from both profile and token. User profile:', user);
            localStorage.removeItem('token');
            localStorage.removeItem('userProfile');
            return <Navigate to="/login" replace />;
        }

        // Check both role and role_id, and handle type coercion (string vs number)
        const hasAccess = allowedRoles.some(allowedRole => {
            // Convert both to strings for comparison to handle type mismatches
            const userRoleStr = String(userRole);
            const userRoleIdStr = String(userRoleId);
            const allowedRoleStr = String(allowedRole);
            
            return userRoleStr === allowedRoleStr || userRoleIdStr === allowedRoleStr;
        });

        if (!hasAccess) {
            // Redirect user to their own dashboard if they try to access unauthorized pages
            console.warn(`Access denied for role ${userRole} (id: ${userRoleId}). Allowed: ${allowedRoles}`);

            if (userRole === 'admin' || userRole === 6 || userRoleId === 6) return <Navigate to="/admin" replace />;
            if (userRole === 'super_admin' || userRole === 1 || userRoleId === 1) return <Navigate to="/super-admin" replace />;
            if (userRole === 5 || userRoleId === 5) return <Navigate to="/rector" replace />;
            if (userRole === 4 || userRoleId === 4) return <Navigate to="/faculty" replace />;
            if (userRole === 2 || userRoleId === 2) return <Navigate to="/committee" replace />;

            return <Navigate to="/dashboard" replace />;
        }
    } catch (e) {
        console.error("Failed to parse user profile in ProtectedRoute", e);
        // Clear invalid data and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('userProfile');
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;

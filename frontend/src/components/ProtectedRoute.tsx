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
        let userRoles = user.roles || []; // Extract roles array

        // If role is null/undefined, try to decode from JWT token as fallback
        if ((userRole === null || userRole === undefined) && token) {
            try {
                // Decode JWT token (without verification, just to get the payload)
                const tokenParts = token.split('.');
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(atob(tokenParts[1]));
                    userRole = payload.role;
                    userRoleId = payload.role || userRoleId;
                    userRoles = Array.isArray(payload.roles) ? payload.roles : [];
                    console.log('Decoded role from token:', userRole, 'roles:', userRoles);
                }
            } catch (tokenError) {
                console.warn('Failed to decode token for role fallback:', tokenError);
            }
        }

        // If still no single role AND no roles-array, deny access and redirect to login
        const hasRolesArray = Array.isArray(userRoles) && userRoles.length > 0;
        if ((userRole === null || userRole === undefined) && !hasRolesArray) {
            console.error('User role is missing from both profile and token, and roles array is empty. User profile:', user);
            localStorage.removeItem('token');
            localStorage.removeItem('userProfile');
            return <Navigate to="/login" replace />;
        }

        // Check both single role and roles array (prefer string role names)
        // Normalize role strings for robust comparison
        const normalizeRole = (r: any) => {
            if (r === null || r === undefined) return '';
            try {
                return String(r).toLowerCase().replace(/[- ]+/g, '_').trim();
            } catch (e) {
                return String(r || '');
            }
        };

        const normalizedUserRoles = Array.isArray(userRoles) ? userRoles.map(r => normalizeRole(r)) : [];
        // Super-admin bypass: allow full access when user is super_admin (or variants like 'super-admin')
        if (normalizedUserRoles.includes('super_admin')) {
            console.debug('ProtectedRoute: super_admin detected — granting access');
            return <>{children}</>;
        }

        const userRoleStr = userRole !== null && userRole !== undefined ? normalizeRole(userRole) : '';
        const userRoleIdStr = userRoleId !== null && userRoleId !== undefined ? String(userRoleId) : '';

        const hasAccess = allowedRoles.some(allowedRole => {
            const allowedRoleStr = normalizeRole(allowedRole);

            // Prefer matching against roles array (normalized)
            if (normalizedUserRoles.includes(allowedRoleStr)) return true;

            // Fallback: match single role string (normalized)
            if (userRoleStr && userRoleStr === allowedRoleStr) return true;

            // As a last fallback, match role_id string (kept for compatibility)
            if (userRoleIdStr && userRoleIdStr === allowedRoleStr) return true;

            return false;
        });

        if (!hasAccess) {
            // Redirect user to their own dashboard if they try to access unauthorized pages
            console.warn(`Access denied for role ${userRole} (id: ${userRoleId}). Allowed: ${allowedRoles}`);

            // Redirect user to their own dashboard based on roles (string names preferred)
            if (normalizedUserRoles.includes('admin') || userRoleStr === 'admin') return <Navigate to="/admin" replace />;
            if (normalizedUserRoles.includes('super_admin') || userRoleStr === 'super_admin') return <Navigate to="/super-admin" replace />;
            if (normalizedUserRoles.includes('rector') || userRoleStr === 'rector') return <Navigate to="/rector" replace />;
            if (normalizedUserRoles.includes('faculty') || normalizedUserRoles.includes('faculty_admin') || userRoleStr === 'faculty' || userRoleStr === 'faculty_admin') return <Navigate to="/faculty" replace />;
            if (normalizedUserRoles.includes('committee') || normalizedUserRoles.includes('committee_member') || userRoleStr === 'committee' || userRoleStr === 'committee_member') return <Navigate to="/committee" replace />;

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

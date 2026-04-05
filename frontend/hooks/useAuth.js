'use client';
import { useAuthContext } from '../context/AuthContext';

/**
 * useAuth Hook
 * Now purely a consumer of the centralized AuthContext.
 * This prevents duplicate socket listeners and state update storms.
 */
export const useAuth = () => {
    const context = useAuthContext();
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

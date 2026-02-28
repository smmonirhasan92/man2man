'use client';

import React from 'react';
import { logger } from '../services/loggerService';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        logger.error('GlobalErrorBoundary caught an error:', { error, errorInfo });
    }

    handleRetry = async () => {
        this.setState({ hasError: false, error: null });

        // Nuclear Fallback: If the app crashes, it might be due to a zombie cache.
        // Clear all caches aggressively before reloading.
        try {
            if ('caches' in window) {
                const cacheNames = await window.caches.keys();
                await Promise.all(
                    cacheNames.map((cacheName) => window.caches.delete(cacheName))
                );
                console.log('Crash Fallback: Cleared old PWA caches.');
            }
        } catch (err) {
            console.error('Crash Fallback: Failed to clear caches:', err);
        }

        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-bg-deep p-6">
                    <div className="glass-panel p-8 rounded-3xl max-w-md w-full text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h2>
                        <p className="text-slate-500 mb-6 text-sm">
                            We encountered an unexpected error. Please try reloading the application.
                        </p>
                        <button
                            onClick={this.handleRetry}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>Reload Application</span>
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;

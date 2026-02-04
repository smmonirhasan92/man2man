'use client';
import AuthGuard from '../../components/AuthGuard';
import P2PDashboard from '../../components/p2p/P2PDashboard';

export default function P2PPage() {
    return (
        <AuthGuard>
            <P2PDashboard />
        </AuthGuard>
    );
}

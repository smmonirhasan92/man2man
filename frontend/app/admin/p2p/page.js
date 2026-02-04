'use client';
import AdminP2PManager from '../../../components/admin/AdminP2PManager';

export default function P2PPage() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-black text-white mb-8 tracking-tight">P2P Control Center</h1>
            <AdminP2PManager />
        </div>
    );
}

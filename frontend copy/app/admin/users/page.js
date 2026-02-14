"use client";
import AdminLayout from '../layout';
import UserManagement from '../../../components/UserManagement';

export default function AdminUsersPage() {
    return (
        <div className="min-h-screen bg-black text-white p-4 pb-24">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-6">
                User Database
            </h1>
            <UserManagement />
        </div>
    );
}

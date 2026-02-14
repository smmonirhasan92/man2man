'use client';
import { useEffect, useState } from 'react';
import TaskCenter from '../../components/dashboard/TaskCenter';
import taskService from '../../services/taskService';
import Loading from '../../components/Loading';

import { useRouter } from 'next/navigation';
import { ShieldAlert, Server, ArrowLeft } from 'lucide-react';

export default function TasksPage() {
    const [taskData, setTaskData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeServer, setActiveServer] = useState(null);
    const router = useRouter();

    useEffect(() => {
        // Check Server
        const serverId = localStorage.getItem('active_server_id');
        const serverName = localStorage.getItem('active_server_name');
        const serverPhone = localStorage.getItem('active_server_phone');

        if (!serverId) {
            setLoading(false);
            return;
        }

        setActiveServer({ id: serverId, name: serverName, phone: serverPhone });

        const loadData = async () => {
            try {
                const data = await taskService.getTaskStatus();
                setTaskData(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) return <Loading />;

    if (!activeServer) {
        return (
            <div className="min-h-screen bg-[#0A2540] p-6 flex flex-col items-center justify-center text-center">
                <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 max-w-sm">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-black text-white mb-2">Secure Connection Required</h2>
                    <p className="text-slate-400 text-sm mb-6">You must connect to a verified US Server before accessing the Task Center.</p>
                    <button
                        onClick={() => router.push('/marketplace')}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                        <Server size={18} /> Connect Server
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A2540] p-6 pb-32">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    {/* Manual Back Navigation */}
                    <div
                        onClick={() => router.push('/dashboard')}
                        className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition cursor-pointer"
                    >
                        <ArrowLeft size={20} className="text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-white">Task Center</h1>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex flex-col items-end leading-tight">
                        <span>{activeServer.name || 'USA SERVER'}</span>
                        <span className="text-[8px] text-emerald-500/80 font-mono">{activeServer.phone || ''}</span>
                    </span>
                </div>
            </div>

            <TaskCenter taskData={taskData || { tasksCompletedToday: 0, dailyLimit: 10, todaysEarnings: 0 }} />
        </div>
    );
}

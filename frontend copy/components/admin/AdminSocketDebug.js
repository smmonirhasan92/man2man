'use client';
import { useState, useEffect } from 'react';
import { socket } from '../../services/socket';
import api from '../../services/api';
import { Activity, Bell, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSocketDebug() {
    const [connected, setConnected] = useState(false);
    const [socketId, setSocketId] = useState('');
    const [testUserId, setTestUserId] = useState('');
    const [testMessage, setTestMessage] = useState('Hello from Admin System!');

    useEffect(() => {
        function onConnect() {
            setConnected(true);
            setSocketId(socket.id);
        }
        function onDisconnect() {
            setConnected(false);
            setSocketId('');
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        if (socket.connected) onConnect();

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };
    }, []);

    const sendTestNotification = async () => {
        if (!testUserId) return toast.error("Enter User ID");
        try {
            await api.post('/admin/test-notify', {
                userId: testUserId,
                message: testMessage
            });
            toast.success("Notification Sent!");
        } catch (e) {
            toast.error("Failed: " + e.message);
        }
    };

    return (
        <div className="bg-[#111] p-6 rounded-xl border border-white/10 space-y-4">
            <h3 className="text-white font-bold flex items-center gap-2">
                <Activity className="text-cyan-400" /> Socket Architecture Debug
            </h3>

            <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border ${connected ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                    <div className="flex items-center gap-2 mb-1">
                        {connected ? <Wifi className="w-5 h-5 text-emerald-500" /> : <WifiOff className="w-5 h-5 text-red-500" />}
                        <span className={`font-bold ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
                            {connected ? 'ONLINE' : 'OFFLINE'}
                        </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">ID: {socketId || 'Disconnected'}</div>
                    <div className="text-xs text-slate-500 mt-1">Namespace: Global (/)</div>
                </div>

                <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                    <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Test Real-time Alert</label>
                    <div className="space-y-2">
                        <input
                            placeholder="Target User ID"
                            value={testUserId}
                            onChange={e => setTestUserId(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded px-2 py-1 text-xs text-white"
                        />
                        <input
                            placeholder="Message"
                            value={testMessage}
                            onChange={e => setTestMessage(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded px-2 py-1 text-xs text-white"
                        />
                        <button
                            onClick={sendTestNotification}
                            className="w-full bg-cyan-600/20 text-cyan-400 border border-cyan-600/50 py-1 rounded text-xs font-bold hover:bg-cyan-600 hover:text-white transition flex justify-center gap-2 items-center"
                        >
                            <Bell className="w-3 h-3" /> Send Test
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

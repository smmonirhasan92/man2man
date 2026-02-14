"use client";
import React, { useState, useEffect } from 'react';
import TaskTVPlayer from '../../components/TaskTVPlayer'; // Use New Component
import api from '../../services/api';
import { Wallet, Play, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AdDemoPage() {
    const [user, setUser] = useState(null);
    const [balance, setBalance] = useState(0);
    const [status, setStatus] = useState('loading'); // loading, idle, playing, verifying, success, error
    const [logs, setLogs] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [currentTask, setCurrentTask] = useState(null);
    const [dailyLimit, setDailyLimit] = useState(0);
    const [tasksCompleted, setTasksCompleted] = useState(0);

    const addLog = (msg) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

    const fetchUserAndTasks = async () => {
        try {
            // 1. Fetch User
            const userRes = await api.get('/auth/me');
            if (userRes.data && userRes.data.user) {
                setUser(userRes.data.user);
                setBalance(userRes.data.wallet_balance || 0);
                addLog(`User loaded: ${userRes.data.user.username}`);
            }

            // 2. Fetch Tasks Options & Status
            const taskRes = await api.get('/task/status');
            const { taskAds, dailyLimit, tasksCompleted, message } = taskRes.data;

            setTasks(taskAds || []);
            setDailyLimit(dailyLimit);
            setTasksCompleted(tasksCompleted);
            addLog(`Tasks loaded. Limit: ${dailyLimit}, Completed: ${tasksCompleted}. ${message}`);

            setStatus('idle');

        } catch (err) {
            console.error(err);
            addLog(`Error fetching data: ${err.message}`);
            setStatus('error');
        }
    };

    useEffect(() => {
        fetchUserAndTasks();
    }, []);

    const startTask = (task) => {
        if (tasksCompleted >= dailyLimit) {
            addLog('Daily limit reached. Upgrade for more.');
            return;
        }
        setCurrentTask(task);
        setStatus('playing');
        addLog(`Starting Task: ${task.title}`);
    };

    const handleAdComplete = async (task) => {
        setStatus('verifying'); // Show loading state
        addLog('Ad interaction complete. Verifying with backend...');

        try {
            const res = await api.post('/task/submit', {
                taskId: task.id // Send real DB ID
            });

            if (res.data.success) {
                // Flying Coins Animation
                confetti({
                    particleCount: 150,
                    spread: 60,
                    origin: { y: 0.7 },
                    colors: ['#FFD700', '#FFA500', '#ffffff']
                });

                addLog(`Success! Reward credited: ${res.data.rewardEarned}. New Balance: ${res.data.newBalance}`);
                setBalance(res.data.newBalance); // Sync real balance
                setTasksCompleted(res.data.tasksCompleted);

                // Remove done task from local list (optional, or refresh)
                setTasks(prev => prev.filter(t => t.id !== task.id));
                setCurrentTask(null);
                setStatus('success');
            } else {
                throw new Error(res.data.message || 'Unknown error');
            }
        } catch (err) {
            console.error(err);
            addLog(`Verification failed: ${err.response?.data?.message || err.message}`);
            setStatus('error');
            setCurrentTask(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-800 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                            Task Center
                        </h1>
                        <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${status === 'error' ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></span>
                            Live Connection: {status.toUpperCase()}
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase">Daily Progress</p>
                            <p className="font-mono font-bold text-lg text-emerald-400">{tasksCompleted} / {dailyLimit}</p>
                        </div>
                        <div className="flex items-center space-x-3 bg-black/40 px-6 py-3 rounded-xl border border-gray-700">
                            <Wallet className="text-yellow-400" size={24} />
                            <span className="text-2xl font-mono font-bold text-yellow-50">{balance ? balance.toFixed(2) : '0.00'}</span>
                        </div>
                    </div>
                </div>

                {/* Main Interaction Area */}
                <div className="bg-gray-900/50 rounded-3xl overflow-hidden shadow-2xl border border-gray-800 min-h-[400px] relative">

                    {/* Loading State */}
                    {status === 'loading' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                            <p className="text-gray-400 animate-pulse">Syncing with Server...</p>
                        </div>
                    )}

                    {/* Task List (Idle State) */}
                    {status === 'idle' && (
                        <div className="p-8">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <Play size={20} className="text-emerald-400" />
                                Available Tasks
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {tasks.length > 0 ? tasks.map((task) => (
                                    <button
                                        key={task.id}
                                        onClick={() => startTask(task)}
                                        className="group flex items-center justify-between p-4 rounded-xl bg-gray-800 border border-gray-700 hover:border-emerald-500/50 hover:bg-gray-800/80 transition-all text-left"
                                    >
                                        <div>
                                            <h3 className="font-bold text-gray-200 group-hover:text-emerald-400 transition-colors">{task.title}</h3>
                                            <p className="text-xs text-gray-500 mt-1">Duration: {task.duration}s • Type: {task.type}</p>
                                        </div>
                                        <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-mono font-bold">
                                            +{task.reward} BDT
                                        </div>
                                    </button>
                                )) : (
                                    <div className="col-span-2 text-center py-12 text-gray-500">
                                        No tasks available currently. Check back later!
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Active Player */}
                    {status === 'playing' && currentTask && (
                        <div className="p-4 md:p-8 bg-black">
                            <TaskTVPlayer
                                task={currentTask}
                                onComplete={handleAdComplete}
                            />
                        </div>
                    )}

                    {/* Success State */}
                    {status === 'success' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-sm z-50">
                            <CheckCircle className="w-20 h-20 text-emerald-500 mb-6 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-110" />
                            <h3 className="text-3xl font-bold text-white mb-2">Reward Claimed!</h3>
                            <p className="text-gray-400 mb-8">Balance updated successfully.</p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                            >
                                Continue To Tasks
                            </button>
                        </div>
                    )}

                    {/* Error State */}
                    {status === 'error' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-sm z-50">
                            <AlertTriangle className="w-20 h-20 text-red-500 mb-6 scale-110" />
                            <h3 className="text-3xl font-bold text-white mb-2">System Error</h3>
                            <p className="text-gray-400 mb-8 max-w-md text-center">Something went wrong. Please check your connection or contact support.</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold shadow-lg transition-all"
                            >
                                Reload System
                            </button>
                        </div>
                    )}

                </div>

                {/* Logs Console */}
                <div className="bg-black rounded-xl p-4 font-mono text-xs text-emerald-500/80 h-32 overflow-y-auto border border-gray-800 shadow-inner">
                    <div className="sticky top-0 bg-black w-full pb-2 mb-2 border-b border-gray-800 font-bold text-gray-500 flex justify-between">
                        <span>SYSTEM LOGS</span>
                        <span className="text-[10px] opacity-50">REAL-TIME</span>
                    </div>
                    {logs.map((log, i) => (
                        <div key={i} className="mb-1 border-l-2 border-emerald-900 pl-2">{log}</div>
                    ))}
                    {logs.length === 0 && <span className="text-gray-700 italic"> waiting for server events...</span>}
                </div>

            </div>
        </div>
    );
}

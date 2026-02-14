'use client';
import { useState, useEffect } from 'react';
import { Play, CheckCircle, Clock } from 'lucide-react';
import api from '../../../services/api';
import Button from '../../../components/ui/Button';
import toast from 'react-hot-toast';

export default function TasksPage() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTask, setActiveTask] = useState(null);
    const [timer, setTimer] = useState(0);
    const [claiming, setClaiming] = useState(false);
    const [userStats, setUserStats] = useState(null);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks/status'); // Detailed status
            setTasks(res.data.taskAds || []);
            setUserStats(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        let interval;
        if (activeTask && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (activeTask && timer === 0) {
            // Task Done
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [activeTask, timer]);

    const handleStartTask = async (task) => {
        if (!userStats.canWork && userStats.tasksCompleted >= userStats.dailyLimit) {
            toast.error('Daily limit reached!');
            return;
        }

        try {
            // Start Tracking on Backend
            await api.post('/tasks/start', { taskId: task.id });

            setActiveTask(task);
            setTimer(task.duration || 10);

            // Open Ad in New Tab (simulated)
            if (task.url) window.open(task.url, '_blank');

        } catch (err) {
            toast.error('Failed to start task');
        }
    };

    const handleClaim = async () => {
        setClaiming(true);
        try {
            await api.post('/tasks/submit', { taskId: activeTask.id });
            toast.success('Reward Claimed!');
            setActiveTask(null);
            fetchTasks(); // Refresh stats
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to claim');
        } finally {
            setClaiming(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Tasks...</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-[#16172B] p-6 pt-8 rounded-b-[2rem] text-white">
                <h1 className="text-2xl font-black mb-1">Task Care</h1>
                <p className="text-slate-400 text-sm mb-4">Watch Ads & Earn Money</p>

                <div className="flex gap-4">
                    <div className="bg-white/10 p-3 rounded-xl flex-1 backdrop-blur-sm">
                        <div className="text-xs text-slate-400 uppercase font-bold">Today's Earnings</div>
                        <div className="text-xl font-bold">{(userStats?.tasksCompleted * parseFloat(userStats?.rewardPerTask)).toFixed(2)} ৳</div>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl flex-1 backdrop-blur-sm">
                        <div className="text-xs text-slate-400 uppercase font-bold">Tasks Done</div>
                        <div className="text-xl font-bold">{userStats?.tasksCompleted} / {userStats?.dailyLimit}</div>
                    </div>
                </div>
            </div>

            {/* Active Task Overlay */}
            {activeTask && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl animate-in zoom-in">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-blue-600 animate-pulse" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Watching Ad...</h3>
                        <p className="text-slate-500 mb-6">Please wait {timer} seconds to claim reward.</p>

                        {timer > 0 ? (
                            <div className="text-4xl font-black text-blue-600 font-mono mb-8">
                                00:{timer.toString().padStart(2, '0')}
                            </div>
                        ) : (
                            <Button
                                onClick={handleClaim}
                                disabled={claiming}
                                className="w-full bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-200"
                            >
                                {claiming ? 'Claiming...' : 'Claim Reward ৳'}
                            </Button>
                        )}

                        {timer > 0 && <p className="text-xs text-slate-400 mt-4">Do not close the ad window</p>}
                    </div>
                </div>
            )}

            {/* Task List */}
            <div className="p-6 space-y-4">
                <h3 className="font-bold text-slate-700">Available Tasks</h3>
                {tasks.map((task) => (
                    <div key={task.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-50 p-2.5 rounded-full">
                                <Play className="w-5 h-5 text-blue-600 ml-0.5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">{task.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{task.duration}s</span>
                                    <span>•</span>
                                    <span className="text-green-600 font-bold">+{task.reward} ৳</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleStartTask(task)}
                            className="bg-[#16172B] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-colors"
                        >
                            Start
                        </button>
                    </div>
                ))}

                {tasks.length === 0 && (
                    <div className="text-center py-10 text-slate-400">
                        No tasks available right now.
                    </div>
                )}
            </div>
        </div>
    );
}

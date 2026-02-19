import React, { useState, useEffect } from 'react';
import { CheckCircle, Zap, DollarSign, Play } from 'lucide-react';
import TaskPlayer from '../TaskPlayer';
import { useTaskWorker } from '../../hooks/useTaskWorker';
import { useRouter } from 'next/navigation';
import taskService from '../../services/taskService';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function TaskCenter({ taskData }) {
    // Default values if data not loaded
    // [FIX] Instant UI Updates via Local State
    const [localCompleted, setLocalCompleted] = useState(taskData?.tasksCompletedToday || 0);
    const [localEarnings, setLocalEarnings] = useState(taskData?.todaysEarnings || 0);

    // Sync with props if they change (e.g. initial load)
    useEffect(() => {
        if (taskData) {
            setLocalCompleted(taskData.tasksCompletedToday || 0);
            setLocalEarnings(taskData.todaysEarnings || 0);
        }
    }, [taskData]);

    const limit = taskData?.dailyLimit ?? 0;

    // [FIX] Calculate progress
    const progress = limit > 0 ? Math.min((localCompleted / limit) * 100, 100) : 0;
    const completed = localCompleted; // Alias for cleaner code below
    const earnings = localEarnings;   // Alias

    // [NEW] Proactive blocking if no plan (limit 0)
    const isNoPlan = limit === 0;

    const [blockingState, setBlockingState] = useState(null); // { type: 'provisioning'|'no_plan', message: '', timeLeft: 0 }

    // [NEW] Fixed missing state
    const [activeTask, setActiveTask] = useState(null);
    const [isPlayerOpen, setIsPlayerOpen] = useState(false);
    const router = useRouter();

    // [NEW] Verification State
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [verifyInput, setVerifyInput] = useState('');
    const [verifiedSession, setVerifiedSession] = useState(false);

    // [NEW] Dynamic Task List
    const [tasksList, setTasksList] = useState([]);

    // Fetch unique tasks on mount
    // [NEW] Persistence Check
    useEffect(() => {
        // Run only on client
        if (typeof window !== 'undefined') {
            const today = new Date().toDateString();
            const lastVerified = localStorage.getItem('usa_verified_date');
            if (lastVerified === today) {
                setVerifiedSession(true);
            }
        }
    }, []);

    const handleStart = async () => {
        if (completed >= limit) {
            toast.error("Daily limit reached! Upgrade for more.");
            return;
        }

        // [NEW] Gateway Check (Strict)
        // const isConnected = localStorage.getItem('usa_connected') === 'true'; // Relaxed check, trust Key

        // [NEW] Check Verification First
        if (!verifiedSession) {
            if (!taskData?.syntheticPhone) {
                toast.error("⚠️ DISCONNECTED\nPlease tap 'Connect to USA Server' on the Dashboard first to generate your access key.");
                return;
            }
            setShowVerifyModal(true);
            return;
        }

        startTaskProcess();
    };

    const verifyAndStart = (e) => {
        e.preventDefault();

        // Normalize: Remove spaces, dashes, parens, plus signs
        const normalize = (str) => str ? str.replace(/[^a-zA-Z0-9]/g, '') : '';

        const cleanInput = normalize(verifyInput);
        const requiredKey = normalize(taskData?.syntheticPhone || '');

        if (cleanInput === requiredKey) {
            setVerifiedSession(true);
            localStorage.setItem('usa_verified_date', new Date().toDateString());
            setShowVerifyModal(false);
            startTaskProcess();
        } else {
            toast.error("❌ Invalid Verification Key! Please copy exactly from Dashboard.");
        }
    };

    const startTaskProcess = async () => {
        setBlockingState(null); // Reset

        // Use local list if available
        if (tasksList.length > 0) {
            setActiveTask(tasksList[0]);
            setIsPlayerOpen(true);
            return;
        }

        try {
            // Fetch next task (Fallback)
            const tasks = await taskService.getTasks();
            if (tasks && tasks.length > 0) {
                setTasksList(tasks);
                setActiveTask(tasks[0]);
                setIsPlayerOpen(true);
            } else {
                toast("No tasks available right now.", { icon: 'ℹ️' });
            }
        } catch (err) {
            console.error("Failed to start task:", err);

            const code = err.response?.data?.error_code;
            if (code === 'SERVER_PROVISIONING') {
                setBlockingState({
                    type: 'provisioning',
                    message: err.response.data.message,
                    timeLeft: err.response.data.timeLeft
                });
            } else if (code === 'NO_ACTIVE_SERVER') {
                setBlockingState({
                    type: 'no_plan',
                    message: err.response.data.message
                });
            } else {
                toast.error(err.response?.data?.message || "Connection Error");
            }
        }
    };

    // [NEW] Generate Grid Items (Up to Limit, cycling API tasks)
    useEffect(() => {
        if (!taskData) return;

        const loadGrid = async () => {
            let apiTasks = [];
            try {
                apiTasks = await taskService.getTasks();
            } catch (e) {
                console.error("Task fetch error", e);
                // Fallback dummies if API fails
                apiTasks = [{ _id: 'dummy1', title: 'Ad Task', reward: 10 }];
            }

            // Generate Display List based on Daily Limit or Default 20 for Demo
            // Limit is master. If limit is 0 (no plan), we might show blocked state or empty.
            const displayCount = limit > 0 ? (limit - completed) : 0;
            const finalGrid = [];

            if (apiTasks.length > 0) {
                for (let i = 0; i < displayCount; i++) {
                    const baseTask = apiTasks[i % apiTasks.length];
                    // Create unique ID for the Grid instance
                    // Use a combination of index, timestamp, and random to ensure uniqueness across updates
                    finalGrid.push({
                        ...baseTask,
                        gridId: `task_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        uniqueIndex: i
                    });
                }
            }
            setTasksList(finalGrid);
        };
        loadGrid();
    }, [taskData, limit, completed, verifiedSession]); // Re-run if verification changes

    const handleTaskClick = (task) => {
        // Validation reused
        if (completed >= limit) { toast.error("Daily limit reached!"); return; }
        if (!verifiedSession) {
            if (!taskData?.syntheticPhone) {
                toast.error("⚠️ DISCONNECTED\nPlease tap 'Connect to USA Server' on the Dashboard.");
                return;
            }
            setShowVerifyModal(true);
            return;
        }

        // Start specific task
        setActiveTask(task);
        setIsPlayerOpen(true);
    };



    return (
        <>
            {/* Summary Section */}
            <div className="w-full bg-slate-800/50 rounded-2xl p-4 border border-white/10 backdrop-blur-md shadow-lg relative overflow-hidden group mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-50"></div>
                <div className="flex justify-between items-start mb-3 relative z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <Zap className="w-4 h-4" fill="currentColor" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-200">Daily Tasks</h3>
                            {taskData?.syntheticPhone && (
                                <p className="text-[10px] text-emerald-400 font-mono mt-0.5">ID: {taskData.syntheticPhone}</p>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Earnings</span>
                        <div className="text-lg font-mono font-bold text-green-400">৳{Number(earnings).toFixed(2)}</div>
                    </div>
                </div>
                <div className="relative z-10">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Progress</span>
                        <span>{completed}/{limit}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            </div>

            {/* BLOCKING STATES */}
            {isNoPlan ? (
                <button onClick={() => router.push('/marketplace')} className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-lg p-4 shadow-lg flex items-center justify-center gap-2">
                    <span className="font-bold text-lg">৳</span> Rent US Server to Access Tasks
                </button>
            ) : completed >= limit ? (
                /* LIMIT REACHED STATE */
                <div className="w-full bg-slate-800/80 backdrop-blur rounded-xl p-6 border border-emerald-500/20 text-center animate-in fade-in zoom-in duration-500">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-black text-white uppercase mb-2">Server Completed</h2>
                    <p className="text-sm text-slate-400 mb-6">You have completed all tasks for this server today.</p>

                    <button
                        onClick={() => router.push('/servers')}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-[0_4px_20px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2 uppercase tracking-wide transition-all hover:scale-[1.02]"
                    >
                        <Zap className="w-4 h-4" /> Connect to Another Server
                    </button>
                </div>
            ) : (
                /* SINGLE COLUMN DASHBOARD GRID */
                <motion.div layout className="grid grid-cols-1 gap-6">
                    <AnimatePresence mode='popLayout'>
                        {tasksList.map((task, index) => (
                            <motion.div
                                layout
                                key={task.gridId}
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, x: -50 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                onClick={() => handleTaskClick(task)}
                                className="bg-[#1e293b] border border-slate-700/50 rounded-2xl overflow-hidden shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] relative group cursor-pointer active:scale-[0.98] transition-all hover:shadow-cyan-500/10 hover:border-cyan-500/30 flex flex-row h-28"
                            >
                                {/* High-Quality Image Placeholder (Left Side) */}
                                <div className="w-1/3 h-full bg-slate-900 relative overflow-hidden shrink-0">
                                    {/* Randomize Image for 'Car/Mobile' effect */}
                                    <img
                                        src={index % 2 === 0
                                            ? "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=400&auto=format&fit=crop" // Mobile
                                            : "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=400&auto=format&fit=crop" // Car
                                        }
                                        alt="Task"
                                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1e293b]"></div>
                                    <div className="absolute top-2 left-2">
                                        <p className="text-[10px] text-white font-black bg-black/60 px-2 py-1 rounded backdrop-blur border border-white/10 shadow-lg">
                                            #{task.uniqueIndex + 1}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex-1 p-4 flex flex-col justify-between relative">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <h3 className="font-bold text-white text-base leading-tight group-hover:text-cyan-400 transition-colors">Premium Ad Task</h3>
                                            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                                <span className="text-emerald-400 font-bold">৳</span> Guaranteed Revenue
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] border border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300">
                                            <Play className="w-4 h-4 fill-current ml-0.5" />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 w-3/4 animate-pulse"></div>
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-mono">10s</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div >
            )
            }

            {/* MODALS */}
            {
                showVerifyModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-slate-900 border border-blue-500/30 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                            <div className="text-center mb-4">
                                <h3 className="text-xl font-black text-white uppercase">Security Check</h3>
                                <p className="text-xs text-slate-400 mt-1">Paste Key to Unlock Grid.</p>
                            </div>
                            <form onSubmit={verifyAndStart} className="space-y-4">
                                <input value={verifyInput} onChange={(e) => setVerifyInput(e.target.value)} placeholder="+1 (XXX) XXX-XXXX" className="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-center text-white font-mono tracking-widest outline-none focus:border-blue-500" autoFocus />
                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-white uppercase">Verify</button>
                            </form>
                        </div>
                    </div>
                )
            }

            {
                isPlayerOpen && activeTask && (
                    <TaskPlayer
                        task={activeTask}
                        usaKey={taskData?.syntheticPhone}
                        onComplete={(result) => {
                            setIsPlayerOpen(false);
                            if (result.result?.newBalance) {
                                // 1. VANISH: Remove specific item from grid
                                setTasksList(prev => prev.filter(t => t.gridId !== activeTask.gridId));

                                // 2. INSTANT SYNC: Update Local State
                                // Assuming backend returns: { newBalance: X, tasksToday: Y }
                                if (result.result.balanceAfter !== undefined) setLocalEarnings(result.result.balanceAfter); // Or calculate delta

                                // Better: Backend `completeTask` service returns:
                                // { message, newBalance (income), tasksToday, limit }
                                // Let's use that.
                                if (result.result.tasksToday) setLocalCompleted(result.result.tasksToday);

                                // If backend doesn't return total income, we increment locally
                                // But TaskService returns `newBalance` which is `userUpd.wallet.income`
                                if (result.result.newBalance !== undefined) setLocalEarnings(result.result.newBalance);
                            }
                        }}
                        onClose={() => setIsPlayerOpen(false)}
                    />
                )
            }
        </>
    );
}

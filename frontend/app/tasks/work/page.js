'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTaskWorker } from '../../../hooks/useTaskWorker';
import TaskTVPlayer from '../../../components/TaskTVPlayer';

function WorkContent() {
    const searchParams = useSearchParams();
    const adId = searchParams.get('adId');

    // Nano-Logic: All state/api/handlers extracted to hook
    const { adData, loading, handleTaskComplete, closeTask } = useTaskWorker(adId);

    if (loading) return <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center text-slate-500 font-medium">Loading Task...</div>;

    if (!adData) return null;

    return (
        <div className="min-h-screen bg-[#F9FAFB] text-slate-900 p-6 relative flex items-center justify-center">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="w-full max-w-4xl relative z-10 bg-white border border-slate-200 rounded-[2rem] p-1 shadow-2xl shadow-slate-200/50">
                <TaskTVPlayer
                    task={adData}
                    onComplete={handleTaskComplete}
                    onClose={closeTask}
                />
            </div>
        </div>
    );
}

export default function WorkPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <WorkContent />
        </Suspense>
    );
}

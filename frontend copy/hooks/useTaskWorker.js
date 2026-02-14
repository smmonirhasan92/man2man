import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '../context/NotificationContext';
import taskService from '../services/taskService';

export function useTaskWorker(adId) {
    const { showSuccess, showError } = useNotification();
    const router = useRouter();

    const [adData, setAdData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (adId) fetchAdData();
    }, [adId]);

    const fetchAdData = async () => {
        try {
            const data = await taskService.getTaskStatus();

            if (data.canWork === false) {
                showError(data.message || 'Please upgrade your plan.');
                router.push('/tasks');
                return;
            }

            const ads = data.taskAds || [];
            const found = ads.find(a => a.id == adId);

            if (found) {
                setAdData({ ...found, duration: found.duration || 10 });
            } else {
                showError('Task not found');
                router.push('/tasks');
            }
        } catch (err) {
            console.error(err);
            showError('Failed to load task');
        } finally {
            setLoading(false);
        }
    };

    const handleTaskComplete = async (task) => {
        try {
            const data = await taskService.submitTask(task.id);
            // Success message is handled by Player or here.
            // Player shows "Reward Claimed". 
            // We can show a toast here too if needed, but Player UI is primary.
            return data;
        } catch (err) {
            showError(err.response?.data?.message || 'Verification failed');
            throw err; // Propatage error to Player so it stops "Claiming..."
        }
    };

    return {
        adData,
        loading,
        handleTaskComplete,
        closeTask: () => router.push('/tasks')
    };
}

import api from './api';

export const taskService = {
    // Get Tasks
    getTasks: async () => {
        const response = await api.get('/task');
        return response.data;
    },

    // Submit Task
    submitTask: async (taskId) => {
        const response = await api.post('/task/submit', { taskId });
        return response.data;
    },

    // Start Task
    startTask: async (taskId) => {
        const response = await api.post('/task/start', { taskId });
        return response.data;
    },

    // Get Task Status (Daily Limits etc)
    getTaskStatus: async () => {
        const response = await api.get('/task/status');
        return response.data;
    }
};

export default taskService;

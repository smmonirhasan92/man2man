import axios from 'axios';

const api = axios.create({
    // Dynamic Base URL for Vercel/Local
    // [FIX] Use Environment Variable with Fallback to Localhost
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// [DEBUG] Prove to user which URL is being used
console.log('🚀 API CLIENT INITIALIZED. Target:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api');


// Add a request interceptor to attach the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // [NEW] Attach Active Server Key for Multi-Server Logic
        const usaKey = localStorage.getItem('active_server_phone');
        if (usaKey) {
            config.headers['x-usa-key'] = usaKey;       // For Task Processing/Legacy
            config.headers['x-usa-identity'] = usaKey;  // For Session/Rate Guard
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 404)) {
            const isAuthCheck = error.config.url.includes('/auth/me');

            // [FIX] Force Logout if User Not Found (404 on /me)
            if (error.response.status === 401) {
                console.warn("[AUTH] Session Invalid/Expired. Clearing token and redirecting...");
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
                    window.location.href = '/login';
                }
            } else if (error.response.status === 404 && isAuthCheck) {
                // [DEBUG] Do NOT logout on 404 for now, just log it.
                console.error("[AUTH] User not found (404) but keeping session for debug.");
            } else {
                console.error(`[API_ERROR] ${error.response.status} from ${error.config.url}`, error.response.data);
            }
        }
        return Promise.reject(error);
    }
);

export default api;

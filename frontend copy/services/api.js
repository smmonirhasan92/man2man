import axios from 'axios';

const getBaseUrl = () => {
    // 1. Get raw URL from Env or Default to Render Production
    let url = process.env.NEXT_PUBLIC_API_URL || 'https://man2man-1.onrender.com';

    // 2. Remove trailing slash if exists
    if (url.endsWith('/')) url = url.slice(0, -1);

    // 3. Append /api if missing
    if (!url.endsWith('/api')) url += '/api';

    return url;
};

const api = axios.create({
    // [FIX] Dynamic Base URL with Forced /api Suffix
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json'
    }
});

// [DEBUG] Prove to user which URL is being used (Logs in Browser Console)
console.log('🚀 API CLIENT INITIALIZED. Target:', getBaseUrl());


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
                // [DEBUG PROBE] Log FULL details for User Screenshot
                console.error(`❌ [API_CRASH] ${error.config.url}`);
                console.error("👇 ERROR DETAILS (Show this to Developer) 👇");
                console.error(JSON.stringify(error.response.data, null, 2));
                console.error("👆 -------------------------------------- 👆");
            }
        }
        return Promise.reject(error);
    }
);

export default api;

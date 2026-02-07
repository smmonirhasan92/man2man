import { io } from 'socket.io-client';



// Dictionary to hold active sockets per namespace
const sockets = {};

const getSocket = (namespace = '/system') => {
    if (typeof window === 'undefined') return null; // [FIX] Prevent SSR Crash

    if (!sockets[namespace]) {
        // [FIX] Use Dynamic URL from Environment
        // Strip '/api' if present because Socket.io needs the root URL
        const RAW_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000';
        const BASE_URL = RAW_URL.replace('/api', '');
        const SOCKET_URL = BASE_URL + namespace;

        console.log(`[SOCKET_SERVICE] 🔌 Connecting to: ${SOCKET_URL}`);

        sockets[namespace] = io(SOCKET_URL, {
            path: '/socket.io',
            transports: ['polling', 'websocket'], // [FIX] Restore polling to allow Proxy handling first
            withCredentials: true,
            auth: {
                token: typeof window !== 'undefined' ? localStorage.getItem('token') : null
            },
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        });

        sockets[namespace].on('connect', () => {
            console.log(`[SOCKET_SERVICE] Connected: ${namespace} (${sockets[namespace].id})`);
        });

        sockets[namespace].on('connect_error', (err) => {
            // [DEBUG] User requested Alert for Mobile Debugging
            if (typeof window !== 'undefined') {
                // alert('SOCKET_ERROR: ' + err.message); // Commented out for now, can uncomment for deeper debug
            }
            console.warn(`[SOCKET_SERVICE] Connection Error (${namespace}):`, err.message);
        });
    }

    return sockets[namespace];
};

const socket = getSocket();
export { socket };
export default getSocket;

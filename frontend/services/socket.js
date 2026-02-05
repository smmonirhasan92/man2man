import { io } from 'socket.io-client';



// Dictionary to hold active sockets per namespace
const sockets = {};

const getSocket = (namespace = '/system') => {
    if (typeof window === 'undefined') return null; // [FIX] Prevent SSR Crash

    if (!sockets[namespace]) {
        const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://man2man-api.onrender.com';
        const SOCKET_URL = BASE_URL + namespace;

        console.log(`[SOCKET_SERVICE] 🔌 Connecting to: ${SOCKET_URL}`);

        sockets[namespace] = io(SOCKET_URL, {
            path: '/socket.io',
            transports: ['websocket'], // [FIX] Force WebSocket to avoid polling errors
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
            // Suppress annoying logs if it's just a temporary disconnect
            console.warn(`[SOCKET_SERVICE] Connection Error (${namespace}):`, err.message);
        });
    }

    return sockets[namespace];
};

const socket = getSocket();
export { socket };
export default getSocket;

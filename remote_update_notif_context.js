const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function updateNotificationContext() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        
        const remotePath = '/var/www/man2man/frontend/context/NotificationContext.js';
        const content = `'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import api from '../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const { refreshUser } = useAuth();
    const systemSocket = useSocket('/system');
    const lastSoundTime = useRef(0);

    useEffect(() => {
        if (systemSocket) setSocket(systemSocket);
    }, [systemSocket]);

    const playSound = useCallback((typeOrPath = 'info') => {
        if (typeof window === 'undefined') return;
        const now = Date.now();
        if (now - lastSoundTime.current < 500) return;
        lastSoundTime.current = now;

        try {
            let soundPath = typeOrPath;
            if (typeOrPath === 'info' || typeOrPath === 'default') soundPath = '/sounds/notification.mp3';
            else if (typeOrPath === 'success') soundPath = '/sounds/success.mp3';
            else if (typeOrPath === 'error') soundPath = '/sounds/error.mp3';
            else if (typeOrPath === 'click') soundPath = '/sounds/click.mp3';

            const audio = new Audio(soundPath);
            audio.volume = 0.8;
            audio.play().catch(() => console.log('Autoplay blocked'));
        } catch (e) { }
    }, []);

    const notify = useCallback((title, message, url = null, sound = 'info') => {
        playSound(sound);
        toast(message || title, {
            style: {
                background: 'rgba(15, 23, 42, 0.9)',
                color: '#FFD700',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                fontWeight: 'bold',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            },
            icon: sound === 'success' ? '✅' : '🔔'
        });
    }, [playSound]);

    useEffect(() => {
        if (!socket) return;
        
        socket.on('notification', (newNotif) => {
            notify(newNotif.title, newNotif.message, null, newNotif.type);
        });

        socket.on('wallet:update', (data) => {
            playSound('success');
            if (refreshUser) refreshUser();
        });

        return () => {
            socket.off('notification');
            socket.off('wallet:update');
        };
    }, [socket, notify, playSound, refreshUser]);

    return (
        <NotificationContext.Provider value={{ playSound, notify, showError: (m) => toast.error(m), showSuccess: (m) => toast.success(m) }}>
            {children}
            <Toaster position="top-center" />
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    return useContext(NotificationContext);
}
`;
        await ssh.execCommand(\`echo "\${content.replace(/"/g, '\\\\"')}" > \${remotePath}\`);
        ssh.dispose();
    } catch (err) {
        console.error('Update Failed:', err);
        ssh.dispose();
    }
}

// Using scp/putFile instead of echo for stability with multi-line
async function stableUpdate() {
    const fs = require('fs');
    const tempFile = 'd:/man2man/NotificationContext_fixed.js';
    const content = \`'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import api from '../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const { refreshUser } = useAuth();
    const systemSocket = useSocket('/system');
    const lastSoundTime = useRef(0);

    useEffect(() => {
        if (systemSocket) setSocket(systemSocket);
    }, [systemSocket]);

    const playSound = useCallback((typeOrPath = 'info') => {
        if (typeof window === 'undefined') return;
        const now = Date.now();
        if (now - lastSoundTime.current < 300) return; // Responsive cooldown
        lastSoundTime.current = now;

        try {
            let soundPath = typeOrPath;
            if (typeOrPath === 'info' || typeOrPath === 'default') soundPath = '/sounds/notification.mp3';
            else if (typeOrPath === 'success') soundPath = '/sounds/success.mp3';
            else if (typeOrPath === 'error') soundPath = '/sounds/error.mp3';
            else if (typeOrPath === 'click') soundPath = '/sounds/click.mp3';

            const audio = new Audio(soundPath);
            audio.volume = 0.8;
            audio.play().catch(() => console.log('Autoplay blocked'));
        } catch (e) { }
    }, []);

    const notify = useCallback((title, message, url = null, sound = 'info') => {
        playSound(sound);
        toast(message || title, {
            style: {
                background: 'rgba(15, 23, 42, 0.9)',
                color: '#FFD700',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                fontWeight: 'bold',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }
        });
    }, [playSound]);

    useEffect(() => {
        if (!socket) return;
        
        socket.on('notification', (newNotif) => {
            notify(newNotif.title, newNotif.message, null, newNotif.type);
        });

        socket.on('wallet:update', (data) => {
            playSound('success');
            if (refreshUser) refreshUser();
        });

        return () => {
            socket.off('notification');
            socket.off('wallet:update');
        };
    }, [socket, notify, playSound, refreshUser]);

    return (
        <NotificationContext.Provider value={{ playSound, notify, showError: (m) => toast.error(m), showSuccess: (m) => toast.success(m) }}>
            {children}
            <Toaster position="top-center" />
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    return useContext(NotificationContext);
}
\`;
    fs.writeFileSync(tempFile, content);
    
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        await ssh.putFile(tempFile, '/var/www/man2man/frontend/context/NotificationContext.js');
        console.log('✅ NotificationContext.js updated on VPS');
        ssh.dispose();
    } catch (e) {
        console.error(e);
        ssh.dispose();
    }
}

stableUpdate();

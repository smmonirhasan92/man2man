import { useEffect, useState } from 'react';
import getSocket from '../services/socket';

export const useSocket = (namespace = '/system') => {
    const [socketInstance, setSocketInstance] = useState(null);

    useEffect(() => {
        // Get the singleton for this namespace
        const socket = getSocket(namespace);
        setSocketInstance(socket);

        // We DO NOT disconnect here. The service manages persistence.
        // This prevents the "Connect/Disconnect" loop on every re-render.

        // Optional: If we wanted to clean up UNUSED namespaces, we'd need ref counting in the service.
        // For now, keeping a few sockets open (system, game) is fine and stable.
    }, [namespace]);

    return socketInstance;
};

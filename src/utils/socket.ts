import { io, Socket } from 'socket.io-client';

const getSocketUrl = () => {
    // Prefer dedicated socket URL if provided
    if (import.meta.env.VITE_SOCKET_URL) {
        return import.meta.env.VITE_SOCKET_URL.replace(/\/$/, '');
    }

    // Fallback to API URL (stripped of /api)
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL.replace(/\/api$/, '');
    }

    // Use current location as fallback (for same-origin deployments)
    return window.location.origin;
};

const SOCKET_URL = getSocketUrl();

let socket: Socket | null = null;

export const getSocket = (token?: string) => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            auth: {
                token
            },
            autoConnect: false
        });
    } else if (token && socket.auth) {
        // Update token if it changed
        (socket.auth as Record<string, unknown>).token = token;
    }
    return socket;
};

export const connectSocket = (token?: string) => {
    const s = getSocket(token);
    if (!s.connected) {
        s.connect();
    }
    return s;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

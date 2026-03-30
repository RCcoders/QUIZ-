import { io, Socket } from 'socket.io-client';

const getSocketUrl = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL.replace(/\/api$/, '');
    }

    // Use current hostname but port 5000 for the backend
    const hostname = window.location.hostname;
    return `http://${hostname}:5000`;
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
        (socket.auth as any).token = token;
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

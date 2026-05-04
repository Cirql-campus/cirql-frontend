import { io, Socket } from 'socket.io-client';
import { getApiOrigin } from './api';

let socket: Socket | null = null;

export const initSocket = (token?: string | null): Socket => {
  if (socket) socket.disconnect();

  socket = io(getApiOrigin(), {
    auth: token ? { token } : undefined,
    withCredentials: true,
    transports: ['websocket'],
  });

  socket.on('connect', () => console.log('Socket connected'));
  socket.on('disconnect', () => console.log('Socket disconnected'));
  socket.on('connect_error', (err: Error) => console.error('Socket error:', err.message));

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

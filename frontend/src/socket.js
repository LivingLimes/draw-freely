import { io } from 'socket.io-client';

export const socket = io(process.env.BACKEND_URL ?? 'http://localhost:3001');
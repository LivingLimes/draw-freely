import { io } from 'socket.io-client';

console.log(process.env.REACT_APP_BACKEND_URL, 'test')

export const socket = io(process.env.REACT_APP_BACKEND_URL ?? 'http://localhost:3001');
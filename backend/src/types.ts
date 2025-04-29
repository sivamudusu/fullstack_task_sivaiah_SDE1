import { Socket } from 'socket.io';

export interface Task {
    id: string;
    content: string;
    createdAt: Date;
    completed: boolean;
}

export interface TaskResponse {
    tasks: Task[];
    source: 'redis' | 'mongodb' | 'combined';
}

export interface ClientToServerEvents {
    add: (taskContent: string) => void;
    updateTaskCompletion: (data: { taskId: string; completed: boolean }) => void;
}

export interface ServerToClientEvents {
    tasks: (data: TaskResponse) => void;
}

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
    userId: string;
}

export type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;  
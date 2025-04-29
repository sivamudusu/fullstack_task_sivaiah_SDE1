export interface Task {
    id: string;
    content: string;
    createdAt: Date;
    completed: boolean;
}

export interface TaskResponse {
    tasks: Task[];
    source: "redis" | "mongodb" | "combined";
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';
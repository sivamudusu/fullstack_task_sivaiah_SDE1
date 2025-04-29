import type React from "react"
import type { Task } from "../types"
import TaskItem from "./TaskItem"
import { WifiOff } from "lucide-react"

interface TaskListProps {
    tasks: Task[]
    onUpdateCompletion: (taskId: string, completed: boolean) => void
    isConnected: boolean
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onUpdateCompletion, isConnected }) => {
    if (!isConnected && tasks.length === 0) {
        return (
            <div className="text-center py-8 flex flex-col items-center" style={{ color: "var(--color-text-secondary)" }}>
                <WifiOff className="w-12 h-12 mb-2 opacity-50" />
                <p>Not connected to server</p>
                <p className="text-sm mt-1">Connect to view and manage your notes</p>
            </div>
        )
    }

    if (tasks.length === 0) {
        return (
            <div className="text-center py-6" style={{ color: "var(--color-text-secondary)" }}>
                No notes yet. Add one to get started!
            </div>
        )
    }

    return (
        <div className="mt-4 h-60 overflow-y-auto pr-2 custom-scrollbar">
            {tasks.map((task) => (
                <TaskItem key={task.id} task={task} onUpdateCompletion={onUpdateCompletion} disabled={!isConnected} />
            ))}

            {!isConnected && tasks.length > 0 && (
                <div
                >
                </div>
            )}
        </div>
    )
}

export default TaskList

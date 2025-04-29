"use client"

import type React from "react"
import type { Task } from "../types"
import TaskCheckbox from "./TaskCheckbox"

interface TaskItemProps {
    task: Task
    onUpdateCompletion: (taskId: string, completed: boolean) => void
    disabled?: boolean
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onUpdateCompletion, disabled = false }) => {
    const handleToggle = () => {
        if (!disabled) {
            onUpdateCompletion(task.id, !task.completed)
        }
    }

    return (
        <div
            className={`py-3 border-b group px-2 -mx-2 rounded transition-colors flex items-center gap-3 ${disabled ? "" : "hover:bg-gray-50"
                }`}
            style={{
                borderColor: "var(--color-border)",
                opacity: disabled ? 0.8 : 1,
            }}
        >
            <TaskCheckbox completed={task.completed} onChange={handleToggle} id={task.id} disabled={disabled} />
            <p
                id={`task-${task.id}`}
                className={`transition-all ${task.completed ? "line-through-theme" : ""}`}
                style={{
                    color: task.completed ? "var(--color-text-completed)" : "var(--color-text-primary)",
                    textDecoration: task.completed ? "line-through" : "none",
                }}
            >
                {task.content}
            </p>
        </div>
    )
}

export default TaskItem

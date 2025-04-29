"use client"

import type React from "react"
import { CheckCircle, Circle } from "lucide-react"

interface TaskCheckboxProps {
    completed: boolean
    onChange: () => void
    id: string
    disabled?: boolean
}

const TaskCheckbox: React.FC<TaskCheckboxProps> = ({ completed, onChange, id, disabled = false }) => {
    return (
        <button
            onClick={onChange}
            className={`flex-shrink-0 focus:outline-none ${disabled ? "" : "focus:ring-2"} focus:ring-theme-primary rounded-full transition-colors`}
            aria-checked={completed}
            role="checkbox"
            aria-labelledby={`task-${id}`}
            disabled={disabled}
            style={{ opacity: disabled ? 0.7 : 1 }}
        >
            {completed ? (
                <CheckCircle className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
            ) : (
                <Circle
                    className="w-5 h-5"
                    style={{
                        color: "var(--color-text-secondary)",
                    }}
                />
            )}
        </button>
    )
}

export default TaskCheckbox

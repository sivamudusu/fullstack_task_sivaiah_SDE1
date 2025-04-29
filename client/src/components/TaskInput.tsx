"use client"

import type React from "react"
import { useState } from "react"
import { PlusIcon } from "lucide-react"

interface TaskInputProps {
    onAddTask: (content: string) => void
    disabled?: boolean
}

const TaskInput: React.FC<TaskInputProps> = ({ onAddTask, disabled = false }) => {
    const [taskContent, setTaskContent] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (taskContent.trim()) {
            onAddTask(taskContent)
            setTaskContent("")
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
            <input
                type="text"
                value={taskContent}
                onChange={(e) => setTaskContent(e.target.value)}
                placeholder="New Note..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                style={{
                    borderColor: "var(--color-border)",
                    border: "1px solid var(--color-border)",
                    opacity: disabled ? 0.7 : 1,
                }}
                aria-label="Enter a new note"
            />
            <button
                type="submit"
                className="px-4 py-2 bg-amber-700 text-white rounded-md hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 flex items-center"
                aria-label="Add note"
            >
                <PlusIcon className="w-5 h-5 mr-2 bg-white rounded-3xl text-amber-700 " />
                Add
            </button>
        </form>
    )
}

export default TaskInput

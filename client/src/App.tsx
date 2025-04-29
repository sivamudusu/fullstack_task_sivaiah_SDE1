"use client"

import { useEffect, useState, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import type { Task, TaskResponse, ConnectionStatus } from "./types"
import TaskInput from "./components/TaskInput"
import TaskList from "./components/TaskList"
import { AlertCircle, RefreshCw } from "lucide-react"

// This will use the environment variable you added
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  const [dataSource, setDataSource] = useState<string>("")
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRetrying, setIsRetrying] = useState(false)

  const connectToBackend = useCallback(() => {
    setConnectionStatus("connecting")
    setError(null)

    // Initialize socket connection
    console.log(`Connecting to WebSocket server at: ${API_URL}`)
    const socketInstance = io(API_URL, {
      reconnectionAttempts: 3,
      timeout: 5000,
    })

    setSocket(socketInstance)

    // Socket event listeners
    socketInstance.on("connect", () => {
      console.log("Connected to WebSocket server")
      setIsConnected(true)
      setConnectionStatus("connected")
      setError(null)
    })

    socketInstance.on("connect_error", (error) => {
      console.error("Connection error:", error)
      setConnectionStatus("disconnected")
      setIsConnected(false)
      setError("Could not connect to the server. Please check if the backend is running.")
      setIsLoading(false)
    })

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from WebSocket server")
      setIsConnected(false)
      setConnectionStatus("disconnected")
    })

    socketInstance.on("tasks", (data: TaskResponse) => {
      console.log("Received tasks:", data)
      setTasks(data.tasks)
      setDataSource(data.source)
      setIsLoading(false)
    })

    socketInstance.on("error", (errorData: { message: string }) => {
      console.error("Server error:", errorData.message)
      setError(errorData.message)
    })

    return socketInstance
  }, [])

  useEffect(() => {
    const socketInstance = connectToBackend()

    // Fetch initial tasks
    fetchTasks()

    // Cleanup
    return () => {
      socketInstance.disconnect()
    }
  }, [connectToBackend])

  const fetchTasks = async () => {
    try {
      setIsLoading(true)
      console.log(`Fetching tasks from: ${API_URL}/fetchAllTasks`)
      const response = await fetch(`${API_URL}/fetchAllTasks`)

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }

      const data: TaskResponse = await response.json()
      console.log("Fetched tasks:", data)
      setTasks(data.tasks)
      setDataSource(data.source)
      setError(null)
    } catch (error) {
      console.error("Error fetching tasks:", error)
      setError("Could not fetch tasks. Please check if the backend is running.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    setIsRetrying(true)

    // Disconnect existing socket if any
    if (socket) {
      socket.disconnect()
    }

    // Reconnect
    connectToBackend()

    // Try to fetch tasks again
    fetchTasks().finally(() => {
      setIsRetrying(false)
    })
  }

  const handleAddTask = useCallback(
    (content: string) => {
      if (socket && isConnected) {
        console.log(`Adding task: ${content}`)
        socket.emit("add", content)
      } else {
        setError("Cannot add task: Not connected to the server")
      }
    },
    [socket, isConnected],
  )

  const handleUpdateCompletion = useCallback(
    (taskId: string, completed: boolean) => {
      if (socket && isConnected) {
        console.log(`Updating task ${taskId} completion status to ${completed}`)
        socket.emit("updateTaskCompletion", { taskId, completed })
      } else {
        setError("Cannot update task: Not connected to the server")
      }
    },
    [socket, isConnected],
  )

  // Get status color based on connection status
  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "var(--color-success)"
      case "connecting":
        return "var(--color-warning)"
      case "disconnected":
        return "var(--color-error)"
      default:
        return "var(--color-warning)"
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      <div
        className="w-full max-w-md rounded-lg shadow-sm p-6"
        style={{
          backgroundColor: "var(--color-card)",
          borderColor: "var(--color-card-border)",
          border: "1px solid var(--color-card-border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="flex items-center gap-2 mb-6">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M3 5c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z" />
              <path d="M3 10h18" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            Note App
          </h1>

          {/* Connection status indicator */}
          <div className="ml-auto flex items-center">
            <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: getStatusColor() }}></div>
            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              {connectionStatus === "connected"
                ? "Connected"
                : connectionStatus === "connecting"
                  ? "Connecting..."
                  : "Disconnected"}
            </span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            className="mb-4 p-3 rounded-md flex items-start gap-2"
            style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--color-error)" }}
          >
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">{error}</p>
              <button
                onClick={handleRetry}
                className="mt-2 text-sm flex items-center gap-1 px-2 py-1 rounded"
                style={{
                  backgroundColor: "var(--color-error)",
                  color: "white",
                  opacity: isRetrying ? 0.7 : 1,
                }}
                disabled={isRetrying}
              >
                <RefreshCw className={`w-3 h-3 ${isRetrying ? "animate-spin" : ""}`} />
                {isRetrying ? "Retrying..." : "Retry Connection"}
              </button>
            </div>
          </div>
        )}

        <TaskInput onAddTask={handleAddTask} disabled={!isConnected} />

        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Notes
          </h2>
          <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            {tasks.filter((task) => task.completed).length} of {tasks.length} completed
          </div>
        </div>

        {isLoading && !error ? (
          <div className="py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
            <div className="inline-block animate-spin mr-2">
              <RefreshCw className="w-5 h-5" />
            </div>
            Loading tasks...
          </div>
        ) : (
          <TaskList tasks={tasks} onUpdateCompletion={handleUpdateCompletion} isConnected={isConnected} />
        )}

        {dataSource && !error && (
          <div className="mt-4 text-xs text-right" style={{ color: "var(--color-text-secondary)" }}>
            Data source: {dataSource}
          </div>
        )}
      </div>
    </div>
  )
}

export default App

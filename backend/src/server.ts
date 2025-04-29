import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskResponse, ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from './types';
import dotenv from 'dotenv'; dotenv.config()

// Replace with your first name
const REDIS_KEY = "FULLSTACK_TASK_SIVAIAH";
const MAX_REDIS_ITEMS = 50;

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// Initialize Redis client
const redisClient = createClient({
    url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    socket: {
        connectTimeout: 20000 // 10 seconds
    }
});

// Initialize MongoDB client
const mongoClient = new MongoClient(process.env.MONGODB_URL || "");
let tasksCollection: any;

// Connect to Redis and MongoDB
async function connectDatabases(): Promise<void> {
    try {
        await redisClient.connect();
        console.log("Connected to Redis");

        await mongoClient.connect();
        console.log("Connected to MongoDB");

        const db = mongoClient.db(process.env.DB);
        tasksCollection = db.collection(process.env.COLLECTION || "tasks");
    } catch (error) {
        console.error("Database connection error:", error);
        process.exit(1);
    }
}

// Get tasks from Redis
async function getTasksFromRedis(): Promise<Task[]> {
    const tasksString = await redisClient.get(REDIS_KEY);
    if (!tasksString) return [];
    return JSON.parse(tasksString);
}

// Get tasks from MongoDB
async function getTasksFromMongoDB(): Promise<Task[]> {
    const tasks = await tasksCollection.find({}).toArray();
    return tasks.map((task: any) => ({
        id: task._id.toString(),
        content: task.content,
        createdAt: task.createdAt,
        completed: task.completed || false,
    }));
}

// Save tasks to Redis
async function saveTasksToRedis(tasks: Task[]): Promise<void> {
    await redisClient.set(REDIS_KEY, JSON.stringify(tasks));
}

// Move tasks from Redis to MongoDB
async function moveTasksToMongoDB(tasks: Task[]): Promise<void> {
    if (tasks.length === 0) return;

    const operations = tasks.map((task) => ({
        insertOne: {
            document: {
                content: task.content,
                createdAt: task.createdAt,
                completed: task.completed || false,
            },
        },
    }));

    await tasksCollection.bulkWrite(operations);
    await redisClient.del(REDIS_KEY);
}

// Update task completion status in Redis
async function updateTaskCompletionInRedis(taskId: string, completed: boolean): Promise<boolean> {
    const tasks = await getTasksFromRedis();
    const taskIndex = tasks.findIndex(task => task.id === taskId);

    if (taskIndex !== -1) {
        tasks[taskIndex].completed = completed;
        await saveTasksToRedis(tasks);
        return true;
    }

    return false;
}

// Update task completion status in MongoDB
async function updateTaskCompletionInMongoDB(taskId: string, completed: boolean): Promise<boolean> {
    try {
        const result = await tasksCollection.updateOne(
            { _id: new ObjectId(taskId) },
            { $set: { completed: completed } }
        );

        return result.modifiedCount > 0;
    } catch (error) {
        console.error("Error updating task completion in MongoDB:", error);
        return false;
    }
}

// WebSocket connection handler
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Handle add task event
    socket.on("add", async (taskContent) => {
        try {
            const newTask: Task = {
                id: uuidv4(),
                content: taskContent,
                createdAt: new Date(),
                completed: false,
            };

            // Get current tasks from Redis
            const currentTasks = await getTasksFromRedis();
            const updatedTasks = [...currentTasks, newTask];

            // Check if we need to move tasks to MongoDB
            if (updatedTasks.length > MAX_REDIS_ITEMS) {
                await moveTasksToMongoDB(currentTasks);
                await saveTasksToRedis([newTask]);
            } else {
                await saveTasksToRedis(updatedTasks);
            }

            // Broadcast the updated tasks to all clients
            const allTasks = await getAllTasks();
            io.emit("tasks", allTasks);
        } catch (error) {
            console.error("Error adding task:", error);
        }
    });

    // Handle update task completion event
    socket.on("updateTaskCompletion", async ({ taskId, completed }) => {
        try {
            console.log(`Updating task ${taskId} completion status to ${completed}`);

            // Try to update in Redis first
            const updatedInRedis = await updateTaskCompletionInRedis(taskId, completed);

            // If not found in Redis, try MongoDB
            if (!updatedInRedis) {
                await updateTaskCompletionInMongoDB(taskId, completed);
            }

            // Broadcast the updated tasks to all clients
            const allTasks = await getAllTasks();
            io.emit("tasks", allTasks);
        } catch (error) {
            console.error("Error updating task completion:", error);
        }
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

// Get all tasks from both Redis and MongoDB
async function getAllTasks(): Promise<TaskResponse> {
    const redisTasks = await getTasksFromRedis();
    const mongoTasks = await getTasksFromMongoDB();

    return {
        tasks: [...mongoTasks, ...redisTasks],
        source: mongoTasks.length > 0 && redisTasks.length > 0 ? "combined" : mongoTasks.length > 0 ? "mongodb" : "redis",
    };
}

// HTTP endpoint to fetch all tasks
app.get("/fetchAllTasks", async (req, res) => {
    try {
        const allTasks = await getAllTasks();
        res.json(allTasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ error: "Failed to fetch tasks" });
    }
});

// Start the server
const PORT = process.env.PORT || 3001;
connectDatabases().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
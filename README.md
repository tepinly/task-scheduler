# Task Scheduler

A distributed task queue system built on BullMQ with database persistence, real-time monitoring, and a web dashboard. Built for managing background jobs and async processing in Node.js/TypeScript applications.

## 🚀 Features

- Dynamic task queuing and execution
- Database persistence (MySQL) for task history & metadata
- Real-time dashboard with WebSocket updates
- Automatic sync between BullMQ and MySQL
- Health monitoring and queue metrics

## 🛠️ Tech Stack

**Backend**: BullMQ, Dragonfly (Redis), MySQL, Prisma, Express, Socket.IO, TypeScript  
**Frontend**: React, Vite, Tailwind CSS, Socket.IO Client

## 📖 Overview

Task Scheduler manages background tasks with:

- **TaskQueue**: Queues tasks in Redis and tracks status in MySQL
- **TaskWorker**: Executes tasks using registered handler functions
- **QueueManager**: Full-stack solution with HTTP server and Socket.IO

**Task Status Flow**: `WAITING` → `ACTIVE` → `COMPLETED` / `FAILED`

## 🏗️ Setup

### Prerequisites

- Node.js 18+ or Bun
- Docker and Docker Compose

### Installation

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Start infrastructure (MySQL + Dragonfly)
cd backend
docker compose up -d

# 3. Configure environment
# Create backend/.env:
DB_URL="mysql://root:password@localhost:3307/my_database"
CACHE_HOST=localhost
CACHE_PORT=6379
CACHE_PASSWORD=your_password

# 4. Run migrations
cd backend
npm install
npx prisma migrate dev

# 5. Start services
npm run dev  # Backend on :4000
cd ../frontend && npm run dev  # Dashboard on :5173 (auto-connects to backend)
```

> **Note**: The included dashboard automatically connects to the backend and displays tasks in real-time. No configuration needed - just start it and it works on <http://localhost:5173>

## 🎮 Demo

The included demo (`backend/src/demo.ts`) demonstrates the task queue system with sample tasks. Follow these steps to run it:

### Step 1: Ensure Infrastructure is Running

```bash
cd backend
docker compose up -d  # Start MySQL and Dragonfly
```

### Step 2: Install Dependencies and Run Migrations

```bash
cd backend
npm install  # Install Prisma 7 dependencies
npx prisma migrate dev
# or: bunx prisma migrate dev
```

### Step 3: Start the Demo Server

```bash
cd backend
bun run src/demo
# Alternative with npm/node:
# npx tsx src/demo.ts
```

You should see:

```bash
🚀 Demo server started on http://localhost:4000
📊 Open http://localhost:5173 to view the dashboard
⏳ Adding sample tasks...
✅ All sample tasks added!
```

### Step 4: Start the Dashboard (Optional)

In a new terminal:

```bash
cd frontend
npm run dev
```

### Step 5: View the Dashboard

Open `http://localhost:5173` in your browser. You'll see:

- **Task List**: All tasks with their current status (WAITING, ACTIVE, COMPLETED, FAILED)
- **Real-time Updates**: Tasks automatically update as they're processed
- **Filtering**: Filter tasks by status using the dropdown
- **Pagination**: Navigate through multiple pages of tasks
- **Delete**: Remove tasks using the trash icon

### What the Demo Does

The demo includes **5 different task types**:

1. **`send-email`** - Simulates sending emails (2-3 second processing time)
2. **`process-image`** - Simulates image processing with filters (3 second processing time)
3. **`generate-report`** - Simulates report generation (2.5 second processing time)
4. **`process-data`** - Performs calculations (sum, average, multiply) on arrays
5. **`risky-operation`** - Demonstrates error handling (fails for negative values)

**Initial Tasks**: The demo adds 10 sample tasks on startup:

- 2 email tasks
- 2 image processing tasks
- 2 report generation tasks
- 2 data processing tasks
- 2 risky operations (1 succeeds, 1 fails)

**Continuous Tasks**: A new random task is added every 10 seconds to keep the demo active.

### Expected Behavior

- Tasks start in `WAITING` status
- Worker picks them up and changes status to `ACTIVE`
- Tasks complete and change to `COMPLETED` (or `FAILED` for errors)
- All status changes appear in real-time in the dashboard
- Console logs show task processing progress

### Stopping the Demo

Press `Ctrl+C` in the terminal running the demo to stop it gracefully.

## 📚 Usage Examples

### Basic Setup

```typescript
import TaskQueue from './backend/src/TaskQueue'
import TaskWorker from './backend/src/TaskWorker'
import EventEmitter from './backend/src/EventEmitter'

// 1. Initialize queue
const eventEmitter = new EventEmitter()
const taskQueue = new TaskQueue('my-queue', eventEmitter)

// 2. Define task handlers
const handlers = {
  async 'send-email'(data: { to: string; subject: string }) {
    // Your email sending logic
    console.log(`Sending to ${data.to}`)
    return { success: true }
  }
}

// 3. Start worker
const worker = new TaskWorker('my-queue', handlers)

// 4. Add tasks
await taskQueue.addTask('send-email', {
  to: 'user@example.com',
  subject: 'Hello'
})
```

### Using QueueManager (with Socket.IO)

```typescript
import QueueManager from './backend/src/index'
import TaskWorker from './backend/src/TaskWorker'

// Initialize manager
const queueManager = new QueueManager('my-queue', 4000)

// Define handlers
const handlers = {
  async 'process-data'(data: { id: number }) {
    // Process data
    return { result: 'done' }
  }
}

// Start worker and server
const worker = new TaskWorker('my-queue', handlers)
queueManager.start()

// Add tasks
await queueManager.addTask('process-data', { id: 123 })
```

### Querying Tasks

```typescript
import TaskQueue from './backend/src/TaskQueue'
import type { TaskStatus } from './backend/src/TaskQueue'

// Get paginated tasks
const { data, count } = await TaskQueue.getTasksPaginated(1, 20)

// Filter by status
const { data: completed } = await TaskQueue.getTasksPaginated(
  1, 20, 'COMPLETED' as TaskStatus
)
```

### Dynamic Handler Registration

```typescript
const worker = new TaskWorker('my-queue', {})

// Add handler at runtime
worker.insertHandler('new-task', async (data) => {
  // Handle task
  return { result: 'success' }
})

// Now you can use it
await taskQueue.addTask('new-task', { some: 'data' })
```

## 🔧 API Reference

### TaskQueue

- `constructor(queueName: string, eventEmitter: EventEmitter)`
- `addTask(taskName: string, taskData: unknown): Promise<Task>`
- `deleteTask(jobId: string): Promise<void>`
- `static getTasksPaginated(page, itemsPerPage, status?): Promise<{data, count}>`

### TaskWorker

- `constructor(queueName: string, taskHandlers: Record<string, Function>)`
- `insertHandler(name: string, handler: Function): void`

### QueueManager

- `constructor(queueName: string, port?: number)`
- `addTask(taskName: string, taskData: unknown): Promise<void>`
- `start(): void`

## 🚨 Troubleshooting

**Database connection**: Ensure MySQL is running (`docker ps`) and `DB_URL` matches docker-compose settings  
**Dragonfly connection**: Check `CACHE_PASSWORD` matches docker-compose.yml  
**Tasks not processing**: Verify `TaskWorker` is running and queue names match between `TaskQueue` and `TaskWorker`

**Prisma migration errors**: 
- The project uses Prisma 7, which requires `prisma.config.ts` for database connection (already configured)
- **Must run migrations from `backend/` directory** (not `backend/src/`)
- The config file automatically finds the schema at `./prisma/schema.prisma`
- Ensure `DB_URL` is set in your `.env` file (not `DATABASE_URL`)
- Run `npm install` first to ensure all dependencies are installed

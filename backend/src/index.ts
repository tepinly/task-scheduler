import express from 'express'
import { createServer } from 'node:http'
import { Server, Socket } from 'socket.io'
import TaskQueue from './TaskQueue'
import EventEmitter from './EventEmitter'
import type { TaskStatus } from './TaskQueue'

export class QueueManager {
	private app: express.Application
	private httpServer: any
	private io: Server
	private taskQueue: TaskQueue
	private port: number
	private eventEmitter: EventEmitter

	constructor(queueName: string, port: number = 4000) {
		this.port = port
		this.app = express()
		this.httpServer = createServer(this.app)
		this.eventEmitter = new EventEmitter()
		this.taskQueue = new TaskQueue(queueName, this.eventEmitter)

		this.io = new Server(this.httpServer, {
			cors: {
				origin: 'http://localhost:5173',
				methods: ['GET', 'POST'],
			},
		})

		this.eventEmitter.subscribe('taskUpdated', (task: any) => {
			this.handleTaskUpdate(task)
		})

		this.setupSocketHandlers()
	}

	private setupSocketHandlers() {
		this.io.on('connection', (socket) => {
			socket.on('getTasks', async ({ page, itemsPerPage, taskStatus }) => {
				await this.emitPaginatedTasks(socket, page, itemsPerPage, taskStatus)
			})

			socket.on('deleteTask', async (jobId, page, itemsPerPage, taskStatus) => {
				try {
					await this.taskQueue.deleteTask(jobId)
					await this.emitPaginatedTasks(socket, page, itemsPerPage, taskStatus)
				} catch (error) {
					console.error('Error deleting task:', error)
					socket.emit('taskDeleted', { success: false, jobId })
				}
			})

			socket.on('disconnect', () => {
				console.log(`User disconnected: ${socket.id}`)
			})
		})
	}

	public async addTask(taskName: string, taskData: unknown) {
		const task = await this.taskQueue.addTask(taskName, taskData)
		this.io.emit('taskAdded', task)
	}

	public handleTaskUpdate(updatedTask: any) {
		this.io.emit('taskUpdated', updatedTask)
	}

	public start() {
		this.httpServer.listen(this.port, () => {
			console.log(`Queue Manager listening on port ${this.port}`)
		})
	}

	private async emitPaginatedTasks(
		socket: Socket,
		page: number,
		itemsPerPage: number,
		status: TaskStatus | null = null
	) {
		try {
			const { data, count } = await TaskQueue.getTasksPaginated(
				page,
				itemsPerPage,
				status
			)
			socket.emit('taskData', { data, count })
		} catch (error) {
			console.error('Error fetching paginated tasks:', error)
			socket.emit('taskData', { data: [], count: 0 })
		}
	}
}

export default QueueManager

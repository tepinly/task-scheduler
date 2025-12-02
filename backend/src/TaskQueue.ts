import { Queue, Job, QueueEvents } from 'bullmq'
import dragonfly from './dragonfly.js'
import prisma from '../prisma/index.js'
import type EventEmitter from './EventEmitter.js'

const TaskStatus = {
	WAITING: 'WAITING',
	ACTIVE: 'ACTIVE',
	COMPLETED: 'COMPLETED',
	FAILED: 'FAILED',
} as const
export type TaskStatus = keyof typeof TaskStatus

class TaskQueue {
	queue: Queue
	queueEvents: QueueEvents
	private eventEmitter: EventEmitter

	constructor(queueName: string, eventEmitter: EventEmitter) {
		this.queue = new Queue(`{${queueName}}`, { connection: dragonfly })
		this.queueEvents = new QueueEvents(`{${queueName}}`, {
			connection: dragonfly,
		})
		this.eventEmitter = eventEmitter

		this.startListening()
		this.startHealthCheck()
	}

	async upsertRecord(queueName: string) {
		let queueRecord = await prisma.queue.findFirst({
			where: { name: queueName },
		})

		if (!queueRecord) {
			queueRecord = await prisma.queue.create({
				data: {
					name: queueName,
				},
			})
		}

		return queueRecord
	}

	async addTask(taskName: string, taskData: unknown) {
		const jobId = `${taskName}-${Date.now()}`
		const queueRecord = await this.upsertRecord(this.queue.name)
		const task = await prisma.task.create({
			data: {
				name: taskName,
				jobId,
				status: TaskStatus.WAITING,
				queueId: queueRecord.id,
			},
		})

		await this.queue.add(taskName, taskData, { jobId })

		return { ...task, queue: { name: this.queue.name } }
	}

	startListening() {
		this.queueEvents.on('completed', async (args: { jobId: string }) => {
			const job = await Job.fromId(this.queue, args.jobId)

			if (!job?.id) {
				return
			}

			const updatedTask = await prisma.task.update({
				where: { jobId: job.id },
				data: { status: TaskStatus.COMPLETED },
			})

			this.eventEmitter.emit('taskUpdated', {
				...updatedTask,
				queue: { name: this.queue.name },
			})
		})

		this.queueEvents.on('failed', async (args: { jobId: string }) => {
			const job = await Job.fromId(this.queue, args.jobId)

			if (!job?.id) {
				return
			}

			const updatedTask = await prisma.task.update({
				where: { jobId: job.id },
				data: { status: TaskStatus.FAILED },
			})

			this.eventEmitter.emit('taskUpdated', {
				...updatedTask,
				queue: { name: this.queue.name },
			})
		})
	}

	startHealthCheck(interval = 5000) {
		setInterval(async () => {
			try {
				const [jobCounts, waitingJobs, activeJobs, failedJobs, completedJobs] =
					await Promise.all([
						this.queue.getJobCounts(),
						this.queue.getJobs(['waiting']),
						this.queue.getJobs(['active']),
						this.queue.getJobs(['failed']),
						this.queue.getJobs(['completed']),
					])

				const queueUpdatePromise = prisma.queue.update({
					where: { name: this.queue.name },
					data: {
						checkedAt: new Date(),
						waiting: jobCounts.waiting,
						active: jobCounts.active,
						failed: jobCounts.failed,
						completed: jobCounts.completed,
					},
				})
				console.log(`Queue Health:`, jobCounts)

				const syncPromises = [
					this.syncTaskStatuses(waitingJobs, TaskStatus.WAITING),
					this.syncTaskStatuses(activeJobs, TaskStatus.ACTIVE),
					this.syncTaskStatuses(failedJobs, TaskStatus.FAILED),
					this.syncTaskStatuses(completedJobs, TaskStatus.COMPLETED),
				]

				await Promise.all([queueUpdatePromise, ...syncPromises])
			} catch (error) {
				console.error('Queue health check failed:', error)
			}
		}, interval)

		setInterval(async () => {
			const activeJobs = await this.queue.getJobs(['active'])

			await this.syncTaskStatuses(activeJobs, TaskStatus.ACTIVE)
		}, interval)

		setInterval(async () => this.syncTaskCounts(), interval * 12)
	}

	private async syncTaskStatuses(jobs: Job[], status: TaskStatus) {
		for (const job of jobs) {
			const task = await prisma.task.findUnique({ where: { jobId: job.id } })

			if (task && task.status !== status) {
				const updatedTask = await prisma.task.update({
					where: { jobId: job.id },
					data: { status },
				})
				this.eventEmitter.emit('taskUpdated', {
					...updatedTask,
					queue: { name: this.queue.name },
				})
			}
		}
	}

	private async syncTaskCounts() {
		const jobs = await this.queue.getJobs()
		const tasks = await prisma.task.findMany({
			where: { jobId: { in: jobs.map((job) => job.id) } },
		})

		for (const job of jobs) {
			const task = tasks.find(
				(task: (typeof tasks)[0]) => task.jobId === job.id
			)
			if (!task) {
				await job.remove()
			}
		}

		for (const task of tasks) {
			const job = jobs.find((job) => job.id === task.jobId)
			if (!job) {
				await prisma.task.delete({ where: { id: task.id } })
			}
		}
	}

	async obliterate() {
		await this.queue.obliterate({ force: true })
	}

	static async getTasksPaginated(
		page = 1,
		itemsPerPage = 20,
		status: TaskStatus | null = null
	) {
		const skip = (page - 1) * itemsPerPage

		const whereClause = status ? { status } : {}

		const [data, count] = await Promise.all([
			prisma.task.findMany({
				where: whereClause,
				include: { queue: { select: { name: true } } },
				skip,
				take: itemsPerPage,
				orderBy: { createdAt: 'desc' },
			}),
			prisma.task.count({ where: whereClause }),
		])

		return { data, count }
	}

	async deleteTask(jobId: string) {
		const job = await this.queue.getJob(jobId)
		await Promise.all([
			job?.remove(),
			prisma.task.delete({ where: { jobId: jobId } }),
		])
	}
}

export default TaskQueue

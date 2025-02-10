import { Worker } from 'bullmq'
import dragonfly from './dragonfly'

class TaskWorker {
	worker: Worker
	handlers: Record<string, Function>

	constructor(queueName: string, taskHandlers: Record<string, Function>) {
		this.handlers = taskHandlers
		this.worker = new Worker(
			`{${queueName}}`,
			async (job) => {
				const { name, data } = job
				const handler = this.handlers[name]

				if (!handler) {
					throw new Error(`No handler for task "${name}"`)
				}
				return await handler(data)
			},
			{ connection: dragonfly, concurrency: 5 }
		)

		this.startListening()
	}

	insertHandler(name: string, handler: Function) {
		this.handlers[name] = handler
	}

	startListening() {
		this.worker.on('completed', (job) => {
			console.log(`Job ${job.id} completed`)
		})

		this.worker.on('failed', (job, err) => {
			console.error(`Job ${job?.id} failed with error: ${err.message}`)

			return err.message
		})
	}
}

export default TaskWorker

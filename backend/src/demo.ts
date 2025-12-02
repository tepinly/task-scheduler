import QueueManager from './index.js'
import TaskWorker from './TaskWorker.js'

// Initialize QueueManager (starts HTTP server and Socket.IO)
const queueManager = new QueueManager('demo-queue', 4000)

// Define task handlers
const handlers = {
	async 'send-email'(data: { to: string; subject: string; body: string }) {
		// Simulate email sending (2-3 seconds)
		const delay = 2000 + Math.random() * 1000
		await new Promise((resolve) => setTimeout(resolve, delay))
		console.log(`📧 Email sent to ${data.to}: ${data.subject}`)
		return { success: true, to: data.to, subject: data.subject }
	},

	async 'process-image'(data: { imageUrl: string; filters: string[] }) {
		// Simulate image processing (3 seconds)
		await new Promise((resolve) => setTimeout(resolve, 3000))
		console.log(`🖼️  Processed image ${data.imageUrl} with filters: ${data.filters.join(', ')}`)
		return {
			success: true,
			imageUrl: data.imageUrl,
			processedUrl: `processed_${data.imageUrl}`,
		}
	},

	async 'generate-report'(data: { reportType: string; dateRange: string }) {
		// Simulate report generation (2.5 seconds)
		await new Promise((resolve) => setTimeout(resolve, 2500))
		console.log(`📊 Generated ${data.reportType} report for ${data.dateRange}`)
		return {
			success: true,
			reportType: data.reportType,
			reportUrl: `/reports/${data.reportType}-${Date.now()}.pdf`,
		}
	},

	async 'process-data'(data: { numbers: number[]; operation: string }) {
		// Perform calculations on arrays
		let result: number
		switch (data.operation) {
			case 'sum':
				result = data.numbers.reduce((a, b) => a + b, 0)
				break
			case 'average':
				result = data.numbers.reduce((a, b) => a + b, 0) / data.numbers.length
				break
			case 'multiply':
				result = data.numbers.reduce((a, b) => a * b, 1)
				break
			default:
				throw new Error(`Unknown operation: ${data.operation}`)
		}
		console.log(`🔢 ${data.operation} of [${data.numbers.join(', ')}] = ${result}`)
		return { success: true, result, operation: data.operation }
	},

	async 'risky-operation'(data: { value: number }) {
		// Demonstrates error handling - fails for negative values
		if (data.value < 0) {
			throw new Error(`Cannot process negative value: ${data.value}`)
		}
		console.log(`⚠️  Risky operation succeeded for value: ${data.value}`)
		return { success: true, value: data.value }
	},
}

// Initialize TaskWorker with handlers
const worker = new TaskWorker('demo-queue', handlers)

// Add initial sample tasks
async function addInitialTasks() {
	console.log('⏳ Adding sample tasks...')

	// 2 email tasks
	await queueManager.addTask('send-email', {
		to: 'user1@example.com',
		subject: 'Welcome!',
		body: 'Welcome to our service.',
	})
	await queueManager.addTask('send-email', {
		to: 'user2@example.com',
		subject: 'Your order is ready',
		body: 'Your order has been processed.',
	})

	// 2 image processing tasks
	await queueManager.addTask('process-image', {
		imageUrl: 'photo1.jpg',
		filters: ['blur', 'brightness'],
	})
	await queueManager.addTask('process-image', {
		imageUrl: 'photo2.jpg',
		filters: ['contrast', 'saturation'],
	})

	// 2 report generation tasks
	await queueManager.addTask('generate-report', {
		reportType: 'sales',
		dateRange: '2024-01-01 to 2024-01-31',
	})
	await queueManager.addTask('generate-report', {
		reportType: 'analytics',
		dateRange: '2024-01-01 to 2024-01-31',
	})

	// 2 data processing tasks
	await queueManager.addTask('process-data', {
		numbers: [1, 2, 3, 4, 5],
		operation: 'sum',
	})
	await queueManager.addTask('process-data', {
		numbers: [10, 20, 30],
		operation: 'average',
	})

	// 2 risky operations (1 succeeds, 1 fails)
	await queueManager.addTask('risky-operation', { value: 42 })
	await queueManager.addTask('risky-operation', { value: -10 })

	console.log('✅ All sample tasks added!')
}

// Add a random task every 10 seconds
function startContinuousTasks() {
	setInterval(() => {
		const taskTypes = [
			'send-email',
			'process-image',
			'generate-report',
			'process-data',
			'risky-operation',
		]
		const randomTaskType = taskTypes[Math.floor(Math.random() * taskTypes.length)]

		const taskData: any = {}
		switch (randomTaskType) {
			case 'send-email':
				taskData.to = `user${Math.floor(Math.random() * 1000)}@example.com`
				taskData.subject = `Task ${Date.now()}`
				taskData.body = 'This is an automated task.'
				break
			case 'process-image':
				taskData.imageUrl = `image-${Date.now()}.jpg`
				taskData.filters = ['blur', 'brightness', 'contrast'].slice(
					0,
					Math.floor(Math.random() * 3) + 1
				)
				break
			case 'generate-report':
				taskData.reportType = ['sales', 'analytics', 'inventory'][
					Math.floor(Math.random() * 3)
				]
				taskData.dateRange = '2024-01-01 to 2024-01-31'
				break
			case 'process-data':
				taskData.numbers = Array.from({ length: 5 }, () =>
					Math.floor(Math.random() * 100)
				)
				taskData.operation = ['sum', 'average', 'multiply'][
					Math.floor(Math.random() * 3)
				]
				break
			case 'risky-operation':
				taskData.value = Math.random() > 0.5 ? Math.floor(Math.random() * 100) : -10
				break
		}

		queueManager.addTask(randomTaskType, taskData).catch((error) => {
			console.error('Error adding continuous task:', error)
		})
	}, 10000)
}

// Start the demo
async function startDemo() {
	queueManager.start()
	console.log('🚀 Demo server started on http://localhost:4000')
	console.log('📊 Open http://localhost:5173 to view the dashboard')

	await addInitialTasks()
	startContinuousTasks()
}

// Handle graceful shutdown
process.on('SIGINT', () => {
	console.log('\n👋 Shutting down demo server...')
	process.exit(0)
})

startDemo().catch((error) => {
	console.error('Failed to start demo:', error)
	process.exit(1)
})


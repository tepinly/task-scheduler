import Redis from 'ioredis'

const connection = {
	host: process.env.CACHE_HOST || 'localhost',
	port: parseInt(process.env.CACHE_PORT || '6379'),
	password: process.env.CACHE_PASSWORD || 'your_password',
	maxRetriesPerRequest: null,
}

const dragonfly = new Redis(connection)

dragonfly.on('connect', () => {
	console.log('Connected to Dragonfly!')
})

dragonfly.on('error', (err: Error) => {
	console.error('Dragonfly connection error:', err)
})

dragonfly.on('close', () => {
	console.log('Dragonfly connection closed.')
})

export default dragonfly

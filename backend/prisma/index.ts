import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import 'dotenv/config'

const dbUrl = process.env.DB_URL || process.env.DATABASE_URL

if (!dbUrl) {
	throw new Error('Missing database URL')
}

const url = new URL(dbUrl.replace('mysql://', 'http://'))

// Create MariaDB adapter (compatible with MySQL)
const adapter = new PrismaMariaDb({
	host: url.hostname,
	port: parseInt(url.port || '3306'),
	user: url.username,
	password: url.password,
	database: url.pathname.slice(1),
	connectionLimit: 10,
})

let prisma: PrismaClient

try {
	prisma = new PrismaClient({
		adapter,
		log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
	})

	await prisma.$connect()
} catch (error) {
	console.error('Failed to initialize Prisma Client:', error)
	throw error
}

process.on('beforeExit', async () => {
	await prisma.$disconnect()
})

export default prisma

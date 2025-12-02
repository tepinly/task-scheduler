import { defineConfig } from '@prisma/config'
import 'dotenv/config'

const dbUrl = process.env.DB_URL || process.env.DATABASE_URL

if (!dbUrl) {
	throw new Error('Missing database URL')
}

export default defineConfig({
	schema: './prisma/schema.prisma',
	datasource: {
		url: dbUrl,
	},
})

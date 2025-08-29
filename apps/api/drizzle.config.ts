import type { Config } from 'drizzle-kit';

export default {
  schema: './src/database/schema/*',
  out: './src/database/migrations',
  driver: 'pg',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'service_tickets',
  },
} satisfies Config;

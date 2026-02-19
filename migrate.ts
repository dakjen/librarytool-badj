import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('DATABASE_URL:', process.env.DATABASE_URL);

import { migrate } from 'drizzle-orm/neon-serverless/migrator'
import { db } from './src/db'

async function main() {
  try {
    await migrate(db, { migrationsFolder: './drizzle' })
    console.log('Migration complete!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

main()
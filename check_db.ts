import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function checkSchema() {
  try {
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'organizations';
    `);
    console.log('Columns in organizations table:', result.rows.map(r => r.column_name));
  } catch (error) {
    console.error('Error checking schema:', error);
  }
  process.exit(0);
}

checkSchema();

import 'dotenv/config'; // Keep this to load DATABASE_URL
import type { Config } from "drizzle-kit";

// Parse DATABASE_URL
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error('DATABASE_URL is not defined');
}

const url = new URL(dbUrl);

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: 'postgresql',
  dbCredentials: {
    host: url.hostname,
    port: Number(url.port),
    user: url.username,
    password: url.password,
    database: url.pathname.substring(1), // Remove leading '/'
    ssl: url.searchParams.get('sslmode') === 'require' ? true : undefined, // Check for sslmode=require
  }
} satisfies Config;
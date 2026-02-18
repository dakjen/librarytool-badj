import { SignJWT, jwtVerify } from 'jose';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers'; // Import cookies here

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

const JWT_ALGORITHM = 'HS256';
const JWT_EXPIRES_IN = '7d'; // 7 days as per SPEC.md

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function generateAuthToken(userId: string): Promise<string> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(new TextEncoder().encode(JWT_SECRET));
  return token;
}

export async function verifyAuthToken(token: string): Promise<{ userId: string }> {
  const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
  return payload as { userId: string };
}

export async function getUserIdFromRequest(): Promise<string | null> {
  const cookieStore = await cookies(); // Call cookies() once
  const token = cookieStore.get('auth_token')?.value; // Then access its methods
  if (!token) {
    return null;
  }
  try {
    const { userId } = await verifyAuthToken(token);
    return userId;
  } catch (error) {
    console.error('Failed to verify auth token:', error);
    return null;
  }
}

export async function getUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: eq(users.email, email),
  });
}

export async function getUserById(id: string) {
  return db.query.users.findFirst({
    where: eq(users.id, id),
  });
}
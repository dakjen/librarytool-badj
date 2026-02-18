import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { hashPassword, generateAuthToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const [newUser] = await db.insert(users).values({
      email,
      passwordHash: hashedPassword,
      name,
    }).returning();

    if (!newUser) {
      return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
    }

    const token = await generateAuthToken(newUser.id);

    (await cookies()).set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return NextResponse.json({ message: 'User registered successfully', userId: newUser.id }, { status: 201 });
  } catch (error: any) {
    // Check if the error is a unique constraint violation for email
    if (error.message && error.message.includes('unique constraint "users_email_unique"')) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
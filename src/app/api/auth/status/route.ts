import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getUserIdFromRequest();
    if (userId) {
      return NextResponse.json({ authenticated: true, userId }, { status: 200 });
    } else {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    return NextResponse.json({ authenticated: false, error: 'Internal server error' }, { status: 500 });
  }
}
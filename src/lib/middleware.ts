import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function authMiddleware(request: NextRequest) {
  const token = (await cookies()).get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId } = await verifyAuthToken(token);
    // Attach userId to the request for downstream handlers
    // Note: In Next.js App Router, it's not straightforward to modify the `request` object
    // for use in route handlers. A common pattern is to re-verify or pass information
    // through headers/context if necessary, or use server components/actions.
    // For API routes, we might need to re-verify the token in each protected route handler,
    // or use a wrapper function for route handlers.
    // For now, we'll just ensure the token is valid.
    
    // As a temporary measure for demonstration within API routes,
    // we can return the userId in a header, or make it accessible
    // in the request context in a more advanced setup.
    // For this example, let's assume the route handlers will call verifyAuthToken again
    // or that we will refactor to a wrapper later.

    // If verification passes, allow the request to proceed.
    return NextResponse.next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

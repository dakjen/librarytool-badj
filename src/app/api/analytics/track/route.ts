import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { analyticsEvents, analyticsEventTypeEnum } from '@/db/schema';
import { getUserIdFromRequest } from '@/lib/auth';
import { checkUserRole } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, itemId, eventType, durationSeconds } = await request.json();

    if (!organizationId || !itemId || !eventType) {
      return NextResponse.json({ error: 'organizationId, itemId, and eventType are required' }, { status: 400 });
    }

    // Validate eventType
    if (!analyticsEventTypeEnum.enumValues.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid eventType provided' }, { status: 400 });
    }

    // Check if the user is a member of the organization where the event is being tracked
    const isMember = await checkUserRole(userId, organizationId, 'consumer'); // Any member can track events
    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [newEvent] = await db.insert(analyticsEvents).values({
      organizationId,
      userId,
      itemId,
      eventType,
      durationSeconds: durationSeconds || null,
    }).returning();

    return NextResponse.json({ message: 'Analytics event tracked successfully', event: newEvent }, { status: 201 });
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { events, organizations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserIdFromRequest } from '@/lib/auth';
import { checkUserRole, checkUserActiveSubscription } from '@/lib/permissions';

async function getOrganizationIdFromSlug(slug: string) {
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
    columns: {
      id: true,
    },
  });
  return organization?.id;
}

export async function GET(
  request: NextRequest,
  context: any // Bypass Turbopack bug
) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = context.params;
    const organizationId = await getOrganizationIdFromSlug(slug);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Access Gating: Admins/Staff can view all events. Consumers need active subscription.
    const canAccessAsStaff = await checkUserRole(userId, organizationId, 'staff_manager');
    if (!canAccessAsStaff) {
      const isConsumer = await checkUserRole(userId, organizationId, 'consumer');
      if (!isConsumer) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const hasActiveSubscription = await checkUserActiveSubscription(userId, organizationId);
      if (!hasActiveSubscription) {
        return NextResponse.json({ error: 'Subscription required to view events' }, { status: 403 });
      }
    }

    const orgEvents = await db.query.events.findMany({
      where: eq(events.organizationId, organizationId),
      orderBy: events.date, // Order by date ascending
    });

    return NextResponse.json(orgEvents, { status: 200 });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: any // Bypass Turbopack bug
) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = context.params;
    const organizationId = await getOrganizationIdFromSlug(slug);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { name, description, date, zoomLink } = await request.json();

    if (!name || !date) {
      return NextResponse.json({ error: 'Event name and date are required' }, { status: 400 });
    }

    // Permissions: Only Admin or Staff Admin can create events
    const hasPermission = await checkUserRole(userId, organizationId, 'staff_admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [newEvent] = await db.insert(events).values({
      organizationId,
      name,
      description: description || null,
      date: new Date(date), // Ensure date is a Date object
      zoomLink: zoomLink || null,
      createdById: userId,
    }).returning();

    return NextResponse.json({ message: 'Event created successfully', event: newEvent }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

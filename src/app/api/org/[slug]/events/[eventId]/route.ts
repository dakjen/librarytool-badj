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

    const { slug, eventId } = context.params;
    const organizationId = await getOrganizationIdFromSlug(slug);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Access Gating: Admins/Staff can view. Consumers need active subscription.
    const canAccessAsStaff = await checkUserRole(userId, organizationId, 'staff_manager');
    if (!canAccessAsStaff) {
      const isConsumer = await checkUserRole(userId, organizationId, 'consumer');
      if (!isConsumer) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const hasActiveSubscription = await checkUserActiveSubscription(userId, organizationId);
      if (!hasActiveSubscription) {
        return NextResponse.json({ error: 'Subscription required' }, { status: 403 });
      }
    }

    const event = await db.query.events.findFirst({
      where: and(
        eq(events.id, eventId),
        eq(events.organizationId, organizationId)
      ),
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(event, { status: 200 });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: any // Bypass Turbopack bug
) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, eventId } = context.params;
    const organizationId = await getOrganizationIdFromSlug(slug);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { name, description, date, zoomLink } = await request.json();

    if (!name && !date && !description && !zoomLink) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    // Permissions: Only Admin or Staff Admin can update events
    const hasPermission = await checkUserRole(userId, organizationId, 'staff_admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [updatedEvent] = await db.update(events)
      .set({
        name: name || undefined,
        description: description || undefined,
        date: date ? new Date(date) : undefined,
        zoomLink: zoomLink || undefined,
      })
      .where(and(
        eq(events.id, eventId),
        eq(events.organizationId, organizationId)
      ))
      .returning();

    if (!updatedEvent) {
      return NextResponse.json({ error: 'Event not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Event updated successfully', event: updatedEvent }, { status: 200 });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: any // Bypass Turbopack bug
) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, eventId } = context.params;
    const organizationId = await getOrganizationIdFromSlug(slug);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Permissions: Only Admin or Staff Admin can delete events
    const hasPermission = await checkUserRole(userId, organizationId, 'staff_admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [deletedEvent] = await db.delete(events)
      .where(and(
        eq(events.id, eventId),
        eq(events.organizationId, organizationId)
      ))
      .returning();

    if (!deletedEvent) {
      return NextResponse.json({ error: 'Event not found or deletion failed' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Event deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

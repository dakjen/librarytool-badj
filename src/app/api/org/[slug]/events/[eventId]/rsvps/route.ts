import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rsvps, events, organizations, rsvpStatusEnum } from '@/db/schema';
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

    // Verify event exists and belongs to the organization
    const event = await db.query.events.findFirst({
      where: and(
        eq(events.id, eventId),
        eq(events.organizationId, organizationId)
      ),
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Access control:
    // Admin/Staff: Can view all RSVPs.
    // Consumer: Can only view their own RSVP.
    const canViewAll = await checkUserRole(userId, organizationId, 'staff_manager');

    if (canViewAll) {
      // Fetch all RSVPs with user details
      const allRsvps = await db.query.rsvps.findMany({
        where: eq(rsvps.eventId, eventId),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              profileImageUrl: true,
            },
          },
        },
      });
      return NextResponse.json(allRsvps, { status: 200 });
    } else {
      // Check if consumer has active subscription first
      const hasActiveSubscription = await checkUserActiveSubscription(userId, organizationId);
      if (!hasActiveSubscription) {
        return NextResponse.json({ error: 'Subscription required' }, { status: 403 });
      }

      // Fetch only the user's own RSVP
      const userRsvp = await db.query.rsvps.findFirst({
        where: and(
          eq(rsvps.eventId, eventId),
          eq(rsvps.userId, userId)
        ),
      });
      return NextResponse.json(userRsvp ? [userRsvp] : [], { status: 200 });
    }

  } catch (error) {
    console.error('Error fetching RSVPs:', error);
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

    const { slug, eventId } = context.params;
    const organizationId = await getOrganizationIdFromSlug(slug);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { status } = await request.json();

    if (!status || !rsvpStatusEnum.enumValues.includes(status)) {
      return NextResponse.json({ error: 'Valid status is required' }, { status: 400 });
    }

    // Verify event exists
    const event = await db.query.events.findFirst({
      where: and(
        eq(events.id, eventId),
        eq(events.organizationId, organizationId)
      ),
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check permissions: Consumer needs active subscription to RSVP
    const canRsvp = await checkUserRole(userId, organizationId, 'consumer');
    if (!canRsvp) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Admins/Staff always have permission, but if it's a regular consumer, check subscription
    const isStaff = await checkUserRole(userId, organizationId, 'staff_manager');
    if (!isStaff) {
       const hasActiveSubscription = await checkUserActiveSubscription(userId, organizationId);
       if (!hasActiveSubscription) {
         return NextResponse.json({ error: 'Subscription required to RSVP' }, { status: 403 });
       }
    }

    // Create or Update RSVP
    // Check if RSVP already exists
    const existingRsvp = await db.query.rsvps.findFirst({
      where: and(
        eq(rsvps.eventId, eventId),
        eq(rsvps.userId, userId)
      ),
    });

    let result;
    if (existingRsvp) {
      // Update
      [result] = await db.update(rsvps)
        .set({ status })
        .where(eq(rsvps.id, existingRsvp.id))
        .returning();
    } else {
      // Insert
      [result] = await db.insert(rsvps).values({
        eventId,
        userId,
        status,
      }).returning();
    }

    return NextResponse.json({ message: 'RSVP updated successfully', rsvp: result }, { status: 200 });

  } catch (error) {
    console.error('Error handling RSVP:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

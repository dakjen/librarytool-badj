import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { memberships, users, organizations, userRolesEnum } from '@/db/schema'; // Import organizations table
import { eq, and } from 'drizzle-orm';
import { getUserIdFromRequest } from '@/lib/auth';
import { checkUserRole } from '@/lib/permissions';

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
  context: any // Removed type annotation to bypass Turbopack bug
) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const { slug } = resolvedParams;
    const organizationId = await getOrganizationIdFromSlug(slug);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user has permission to view members (admin, staff_admin, staff_manager)
    const hasPermission = await checkUserRole(userId, organizationId, 'staff_manager');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const members = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(eq(memberships.organizationId, organizationId));

    return NextResponse.json(members, { status: 200 });
  } catch (error) {
    console.error('Error fetching organization members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: any // Removed type annotation to bypass Turbopack bug
) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const { slug } = resolvedParams;
    const organizationId = await getOrganizationIdFromSlug(slug);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    // Validate if the provided role is a valid enum value
    if (!userRolesEnum.enumValues.includes(role)) {
      return NextResponse.json({ error: 'Invalid role provided' }, { status: 400 });
    }

    // Check if user has permission to add members (admin, staff_admin)
    const hasPermission = await checkUserRole(userId, organizationId, 'staff_admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targetUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User with this email does not exist' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMembership = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.userId, targetUser.id),
        eq(memberships.organizationId, organizationId)
      ),
    });

    if (existingMembership) {
      return NextResponse.json({ error: 'User is already a member of this organization' }, { status: 409 });
    }

    const [newMembership] = await db.insert(memberships).values({
      userId: targetUser.id,
      organizationId: organizationId,
      role: role,
    }).returning();

    return NextResponse.json({ message: 'Member added successfully', membership: newMembership }, { status: 201 });
  } catch (error) {
    console.error('Error adding organization member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
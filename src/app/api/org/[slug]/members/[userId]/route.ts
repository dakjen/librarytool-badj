import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { memberships, organizations, userRolesEnum } from '@/db/schema'; // Import organizations table
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

export async function PATCH(
  request: NextRequest,
  context: any // Removed type annotation to bypass Turbopack bug
) {
  try {
    const requestorId = await getUserIdFromRequest();
    if (!requestorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const { slug, userId } = resolvedParams;
    const organizationId = await getOrganizationIdFromSlug(slug);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { role } = await request.json();

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    // Validate if the provided role is a valid enum value
    if (!userRolesEnum.enumValues.includes(role)) {
      return NextResponse.json({ error: 'Invalid role provided' }, { status: 400 });
    }

    // Check if the requestor has permission to update roles (e.g., admin)
    const hasPermission = await checkUserRole(requestorId, organizationId, 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prevent an admin from changing their own role to something lower (to avoid locking themselves out)
    const targetMembership = await db.query.memberships.findFirst({
        where: and(
            eq(memberships.userId, userId),
            eq(memberships.organizationId, organizationId)
        )
    });

    if (!targetMembership) {
        return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
    }

    if (targetMembership.role === 'admin' && requestorId === userId && role !== 'admin') {
        return NextResponse.json({ error: 'Cannot demote yourself from admin' }, { status: 403 });
    }

    const [updatedMembership] = await db.update(memberships)
      .set({ role: role })
      .where(and(
        eq(memberships.userId, userId),
        eq(memberships.organizationId, organizationId)
      ))
      .returning();

    return NextResponse.json({ message: 'Member role updated successfully', membership: updatedMembership }, { status: 200 });
  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: any // Removed type annotation to bypass Turbopack bug
) {
  try {
    const requestorId = await getUserIdFromRequest();
    if (!requestorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const { slug, userId } = resolvedParams;
    const organizationId = await getOrganizationIdFromSlug(slug);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if the requestor has permission to remove members (e.g., admin)
    const hasPermission = await checkUserRole(requestorId, organizationId, 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prevent an admin from removing themselves (to avoid locking themselves out)
    if (requestorId === userId) {
        return NextResponse.json({ error: 'Cannot remove yourself from the organization' }, { status: 403 });
    }

    const result = await db.delete(memberships)
      .where(and(
        eq(memberships.userId, userId),
        eq(memberships.organizationId, organizationId)
      ))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Member removed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
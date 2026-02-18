import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { organizations, memberships } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserIdFromRequest } from '@/lib/auth';

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

    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.slug, slug),
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Verify user is a member of this organization
    const membership = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.userId, userId),
        eq(memberships.organizationId, organization.id)
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden: Not a member of this organization' }, { status: 403 });
    }

    // Return organization details including the user's role
    return NextResponse.json({ ...organization, role: membership.role }, { status: 200 });
  } catch (error) {
    console.error('Error fetching organization by slug:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
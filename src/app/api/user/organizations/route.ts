import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { memberships, organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userOrganizations = await db.select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      logoUrl: organizations.logoUrl,
      primaryColor: organizations.primaryColor,
      secondaryColor: organizations.secondaryColor,
      accentColor: organizations.accentColor,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.organizationId, organizations.id))
    .where(eq(memberships.userId, userId));

    return NextResponse.json(userOrganizations, { status: 200 });
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
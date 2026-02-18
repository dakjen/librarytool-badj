import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invites, organizations } from '@/db/schema'; // Import organizations table
import { eq } from 'drizzle-orm';
import { getUserIdFromRequest } from '@/lib/auth';
import { checkUserRole } from '@/lib/permissions';
import { customAlphabet } from 'nanoid';

async function getOrganizationIdFromSlug(slug: string) {
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
    columns: {
      id: true,
    },
  });
  return organization?.id;
}

const generateInviteCode = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8); // 8 character alphanumeric code

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

    const { expiresAt } = await request.json(); // Optional expiration date for the invite

    // Check if user has permission to generate invites (e.g., admin, staff_admin)
    const hasPermission = await checkUserRole(userId, organizationId, 'staff_admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let code: string = '';
    let isUnique = false;
    // Ensure the generated code is unique
    while (!isUnique) {
      code = generateInviteCode();
      const existingInvite = await db.query.invites.findFirst({
        where: (inv, { eq: eqInv }) => eqInv(inv.code, code),
      });
      if (!existingInvite) {
        isUnique = true;
      }
    }

    const [newInvite] = await db.insert(invites).values({
      organizationId,
      code,
      createdById: userId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    }).returning();

    return NextResponse.json({ message: 'Invite code generated', invite: newInvite }, { status: 201 });
  } catch (error) {
    console.error('Error generating invite code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
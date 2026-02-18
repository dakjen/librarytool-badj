import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invites, memberships, referrals, userRolesEnum } from '@/db/schema';
import { eq, and, isNull, gt, or } from 'drizzle-orm';
import { getUserIdFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    const invite = await db.query.invites.findFirst({
      where: and(
        eq(invites.code, code),
        or(
            isNull(invites.expiresAt),
            gt(invites.expiresAt, new Date())
        )
      ),
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invalid or expired invite code' }, { status: 404 });
    }

    // Check if user is already a member of this organization
    const existingMembership = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.userId, userId),
        eq(memberships.organizationId, invite.organizationId)
      ),
    });

    if (existingMembership) {
      return NextResponse.json({ error: 'You are already a member of this organization' }, { status: 409 });
    }

    // Add user to the organization with 'consumer' role
    const [newMembership] = await db.insert(memberships).values({
      userId,
      organizationId: invite.organizationId,
      role: userRolesEnum.enumValues[4], // 'consumer' role
    }).returning();

    if (!newMembership) {
        return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 });
    }

    // Record referral if the invite was created by someone (i.e., not a general invite)
    // The spec mentions referral tracking stored. Assuming for now, an invite created by a user
    // implies a potential referral if the inviter is also a member.
    // More robust referral logic might involve specific referral links separate from invites.
    // For this simple implementation, if an invite has a creator, we track it as a referral.
    if (invite.createdById && invite.createdById !== userId) {
        await db.insert(referrals).values({
            organizationId: invite.organizationId,
            referrerUserId: invite.createdById,
            referredUserId: userId,
        });
    }

    // Optionally, invalidate the invite code after use if it's single-use,
    // or decrement a usage count. For now, we leave it active.

    return NextResponse.json({ message: 'Invite accepted successfully', membership: newMembership }, { status: 200 });
  } catch (error) {
    console.error('Error accepting invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
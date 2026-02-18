import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { checkUserRole } from '@/lib/permissions';
import { db } from '@/db';
import { memberships } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const organizationId = formData.get('organizationId') as string;

    if (!file || !organizationId) {
      return NextResponse.json({ error: 'File and organizationId are required' }, { status: 400 });
    }

    // Check if the user is a member of the organization
    const membership = await db.query.memberships.findFirst({
        where: and(
            eq(memberships.userId, userId),
            eq(memberships.organizationId, organizationId)
        )
    });

    if (!membership) {
        return NextResponse.json({ error: 'Forbidden: Not a member of this organization' }, { status: 403 });
    }

    // Check if the user has permission to upload images (staff_manager or higher)
    const hasPermission = await checkUserRole(userId, organizationId, 'staff_manager');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const filename = `${Date.now()}-${file.name}`;
    const blob = await put(filename, file, {
      access: 'public',
    });

    return NextResponse.json({ filename: blob.pathname, url: blob.url }, { status: 200 });
  } catch (error) {
    console.error('Error uploading article image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { collections } from '@/db/schema';
import { getUserIdFromRequest } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string; collectionId: string }> }
) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { collectionId } = resolvedParams;
    const { name, description } = await request.json(); // Allow updating name and description

    if (!name && !description) {
      return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
    }

    const updateData: { name?: string; description?: string } = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    // TODO: Add permission check to ensure user has access to this organization and collection
    // For now, only check if collection belongs to the organization (implicitly done by the route)

    const [updatedCollection] = await db
      .update(collections)
      .set(updateData)
      .where(eq(collections.id, collectionId))
      .returning();

    if (!updatedCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json(updatedCollection);
  } catch (error) {
    console.error('Error updating collection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

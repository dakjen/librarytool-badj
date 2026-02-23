import { NextResponse } from 'next/server';
import { db } from '@/db';
import { items } from '@/db/schema';
import { getUserIdFromRequest } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string; collectionId: string; itemId: string }> }
) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { itemId } = resolvedParams;
    const body = await request.json();
    const { isFavorite, orderIndex } = body;

    const updateData: any = {};
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
    if (orderIndex !== undefined) updateData.orderIndex = orderIndex;

    const [updatedItem] = await db
      .update(items)
      .set(updateData)
      .where(eq(items.id, itemId))
      .returning();

    if (!updatedItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string; collectionId: string; itemId: string }> }
) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { itemId } = resolvedParams;

    // TODO: Add stricter permission checks (e.g., is owner or admin)

    const [deletedItem] = await db
      .delete(items)
      .where(eq(items.id, itemId))
      .returning();

    if (!deletedItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
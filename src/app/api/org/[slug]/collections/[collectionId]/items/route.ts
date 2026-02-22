import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { items, itemTypeEnum, organizations } from '@/db/schema'; // Import organizations table
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
  context: { params: Promise<{ slug: string; collectionId: string; }> }
) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const { slug, collectionId } = resolvedParams;
    const organizationId = await getOrganizationIdFromSlug(slug);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if the user has appropriate permissions
    const canAccessAsStaff = await checkUserRole(userId, organizationId, 'staff_manager');
    if (!canAccessAsStaff) {
      // If not staff, check if they are a consumer with an active subscription
      const isConsumer = await checkUserRole(userId, organizationId, 'consumer');
      if (!isConsumer) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const hasActiveSubscription = await checkUserActiveSubscription(userId, organizationId);
      if (!hasActiveSubscription) {
        return NextResponse.json({ error: 'Subscription required' }, { status: 403 });
      }
    }

    const collectionItems = await db.query.items.findMany({
      where: and(
        eq(items.organizationId, organizationId),
        eq(items.collectionId, collectionId)
      ),
      orderBy: (items, { asc, desc }) => [desc(items.isFavorite), asc(items.orderIndex), asc(items.createdAt)],
    });

    return NextResponse.json(collectionItems, { status: 200 });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string; collectionId: string; }> }
) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const { slug, collectionId } = resolvedParams;
    const organizationId = await getOrganizationIdFromSlug(slug);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { title, description, type, contentUrl, articleContent, thumbnailUrl, isFavorite, orderIndex } = await request.json();

    if (!title || !type) {
      return NextResponse.json({ error: 'Title and type are required' }, { status: 400 });
    }

    // Validate item type
    if (!itemTypeEnum.enumValues.includes(type)) {
      return NextResponse.json({ error: 'Invalid item type' }, { status: 400 });
    }

    // Check if the user has permission to create items (staff_manager or higher)
    const hasPermission = await checkUserRole(userId, organizationId, 'staff_manager');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Conditional validation based on type
    if (['video', 'pdf', 'embed', 'link'].includes(type) && !contentUrl) {
      return NextResponse.json({ error: 'contentUrl is required for this item type' }, { status: 400 });
    }
    if (type === 'article' && !articleContent) {
      return NextResponse.json({ error: 'articleContent is required for this item type' }, { status: 400 });
    }

    const [newItem] = await db.insert(items).values({
      organizationId,
      collectionId,
      title,
      description: description || null,
      type,
      contentUrl: contentUrl || null,
      articleContent: articleContent || null,
      thumbnailUrl: thumbnailUrl || null,
      isFavorite: isFavorite || false, // Default to false
      orderIndex: orderIndex || 0,     // Default to 0
      createdById: userId,
    }).returning();

    return NextResponse.json({ message: 'Item created successfully', item: newItem }, { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql, eq, and, or } from 'drizzle-orm';
import { getUserIdFromRequest } from '@/lib/auth';
import { checkUserRole } from '@/lib/permissions';
import { collections, items, tags, itemTags } from '@/db/schema';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const organizationId = searchParams.get('organizationId');

    if (!query || !organizationId) {
      return NextResponse.json({ error: 'Search query and organizationId are required' }, { status: 400 });
    }

    // Check if the user is a member of the organization
    const isMember = await checkUserRole(userId, organizationId, 'consumer'); // Any member can search
    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prepare the search query for to_tsquery
    const tsQuery = sql`to_tsquery('english', ${query.split(/\s+/).join(' & ')})`;

    // Search collections
    const collectionResults = await db.select({
      id: collections.id,
      name: collections.name,
      description: collections.description,
      type: sql`'collection'`.as('type'),
    })
    .from(collections)
    .where(and(
      eq(collections.organizationId, organizationId),
      sql`to_tsvector('english', ${collections.name} || ' ' || coalesce(${collections.description}, '')) @@ ${tsQuery}`
    ))
    .limit(10);

    // Search items
    const itemResults = await db.select({
      id: items.id,
      title: items.title,
      description: items.description,
      type: items.type,
      collectionId: items.collectionId,
    })
    .from(items)
    .leftJoin(itemTags, eq(items.id, itemTags.itemId))
    .leftJoin(tags, eq(itemTags.tagId, tags.id))
    .where(and(
      eq(items.organizationId, organizationId),
      sql`to_tsvector('english', ${items.title} || ' ' || coalesce(${items.description}, '') || ' ' || coalesce(${items.articleContent}, '')) @@ ${tsQuery}`
      // OR search in tags
      // It's tricky to include tags directly in the item's tsvector effectively without
      // making it a generated column. For simplicity, we can do a separate search on tags
      // or join and filter here. For now, search item's own content.
      // A more advanced FTS would involve denormalizing tags into item's search_tsv.
    ))
    .limit(10);

    // Combine results (and deduplicate if necessary, though IDs are different)
    const results = [
      ...collectionResults,
      ...itemResults.map(item => ({
        id: item.id,
        name: item.title, // Map title to name for consistent output
        description: item.description,
        type: item.type,
        collectionId: item.collectionId, // Keep collectionId for items
      })),
    ];

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('Error during search:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
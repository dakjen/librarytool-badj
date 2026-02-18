import { NextResponse } from 'next/server';
import { db } from '@/db';
import { organizations, memberships, userRolesEnum } from '@/db/schema';
import { getUserIdFromRequest } from '@/lib/auth';
import { generateSlug } from '@/lib/utils'; // Assuming a utils file for slug generation
import { v4 as uuidv4 } from 'uuid'; // For generating UUID for membership ID

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, primaryColor, secondaryColor, accentColor, logoUrl } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    const slug = generateSlug(name); // Generate a slug from the name

    // Check if an organization with the same slug already exists
    const existingOrg = await db.query.organizations.findFirst({
      where: (orgs, { eq }) => eq(orgs.slug, slug),
    });

    if (existingOrg) {
      return NextResponse.json({ error: 'Organization with this name already exists' }, { status: 409 });
    }

    const [newOrganization] = await db.insert(organizations).values({
      name,
      slug,
      ownerUserId: userId,
      primaryColor: primaryColor || null,
      secondaryColor: secondaryColor || null,
      accentColor: accentColor || null,
      logoUrl: logoUrl || null,
    }).returning();

    if (!newOrganization) {
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
    }

    // Create a membership for the creating user as an admin
    await db.insert(memberships).values({
      userId,
      organizationId: newOrganization.id,
      role: userRolesEnum.enumValues[1], // 'admin' role
    });

    return NextResponse.json({ message: 'Organization created successfully', organizationId: newOrganization.id, slug: newOrganization.slug }, { status: 201 });
  } catch (error) {
    console.error('Organization creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
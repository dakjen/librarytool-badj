import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserIdFromRequest } from '@/lib/auth';
import { checkUserRole } from '@/lib/permissions';
import { db } from '@/db';
import { memberships } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are not defined in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const organizationId = formData.get('organizationId') as string; // Required for permission check

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

    // Check if the user has permission to upload PDFs (staff_manager or higher)
    const hasPermission = await checkUserRole(userId, organizationId, 'staff_manager');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const fileExtension = file.name.split('.').pop();
    const filePath = `${organizationId}/${userId}/${Date.now()}.${fileExtension}`; // Organize by org/user/timestamp.ext

    const { data, error } = await supabase.storage
      .from('library-files') // You might need to create this bucket in Supabase
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json({ error: `Failed to upload PDF: ${error.message}` }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('library-files')
      .getPublicUrl(filePath);

    return NextResponse.json({ filename: filePath, url: publicUrlData.publicUrl }, { status: 200 });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
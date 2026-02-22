'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrganization } from '@/context/OrganizationContext';
import { BookOpen, Video, File, FileText, Link as LinkIcon, Code } from 'lucide-react';

export default function AddItemTypeSelectionPage() {
  const { organization } = useOrganization();
  const params = useParams();
  const slug = params.slug as string;
  const collectionId = params.collectionId as string;
  const router = useRouter();

  const itemTypes = [
    { type: 'video', name: 'Video', description: 'Embed a video from YouTube, Vimeo, etc.', icon: Video },
    { type: 'pdf', name: 'PDF Document', description: 'Upload a PDF file directly to your library.', icon: File },
    { type: 'article', name: 'Article', description: 'Write rich text content using our powerful editor.', icon: FileText },
    { type: 'embed', name: 'Embed Content', description: 'Embed content from various platforms like Google Drive, Box, Figma, etc.', icon: Code },
    { type: 'link', name: 'External Link', description: 'Link to an external website or resource.', icon: LinkIcon },
  ];

  if (!organization) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 font-sans">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/org/${slug}/collections/${collectionId}/items`} className="text-gray-500 hover:text-primary transition-colors">
          &larr; Back to Collection
        </Link>
        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
        <h1 className="text-4xl font-serif font-bold text-primary">Add New Item</h1>
      </div>
      
      <p className="text-gray-600 text-lg mb-10">
        First, choose the type of content you want to add to your collection.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {itemTypes.map((itemType) => (
          <div
            key={itemType.type}
            onClick={() => router.push(`/org/${slug}/collections/${collectionId}/add-item/${itemType.type}`)}
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-xl hover:border-primary transition-all duration-300 group"
          >
            <div className="bg-primary/5 text-primary rounded-full p-4 mb-4 group-hover:bg-primary/10 transition-colors">
              <itemType.icon className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
              {itemType.name}
            </h2>
            <p className="text-gray-600 text-sm">{itemType.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

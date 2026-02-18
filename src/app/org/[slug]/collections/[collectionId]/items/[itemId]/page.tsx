'use client';

import { useEffect, useState } from 'react';
import { useOrganization } from '@/context/OrganizationContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import RichTextEditor from '@/components/RichTextEditor'; // Import RichTextEditor

interface Item {
  id: string;
  title: string;
  description?: string;
  type: string;
  contentUrl?: string;
  articleContent?: any; // JSONB
  thumbnailUrl?: string;
  createdById: string;
  createdAt: string;
}

export default function SingleItemPage() {
  const { organization, loading: orgLoading, error: orgError } = useOrganization();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const collectionId = params.collectionId as string;
  const itemId = params.itemId as string;

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editContentUrl, setEditContentUrl] = useState('');
  const [editArticleContent, setEditArticleContent] = useState(''); // JSON string from RichTextEditor
  const [editThumbnailUrl, setEditThumbnailUrl] = useState('');
  const [editType, setEditType] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (!orgLoading && organization && collectionId && itemId) {
      fetchItem();
    }
  }, [orgLoading, organization, collectionId, itemId]);

  const fetchItem = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/org/${slug}/collections/${collectionId}/items/${itemId}`);
      if (response.ok) {
        const data: Item = await response.json();
        setItem(data);
        setEditTitle(data.title);
        setEditDescription(data.description || '');
        setEditContentUrl(data.contentUrl || '');
        setEditArticleContent(JSON.stringify(data.articleContent) || '');
        setEditThumbnailUrl(data.thumbnailUrl || '');
        setEditType(data.type);
      } else if (response.status === 404) {
        setError('Item not found.');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to fetch item details');
      }
    } catch (err) {
      console.error('Error fetching item:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setEditError('');

    if (!organization || !item) {
      setEditError('Organization or item context not available.');
      setIsSaving(false);
      return;
    }

    let payload: any = {
      title: editTitle,
      description: editDescription,
      type: editType,
      thumbnailUrl: editThumbnailUrl,
    };

    if (['video', 'pdf', 'embed', 'link'].includes(editType)) {
      payload.contentUrl = editContentUrl;
    } else if (editType === 'article') {
      try {
        payload.articleContent = JSON.parse(editArticleContent || '{}');
      } catch (err) {
        setEditError('Invalid JSON for Article Content');
        setIsSaving(false);
        return;
      }
    }

    const response = await fetch(`/api/org/${slug}/collections/${collectionId}/items/${itemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      setIsEditing(false); // Exit edit mode
      fetchItem(); // Refresh item data
    } else {
      const data = await response.json();
      setEditError(data.error || 'Failed to update item');
    }
    setIsSaving(false);
  };

  const handleDeleteItem = async () => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    if (!organization) {
      setError('Organization context not available.');
      return;
    }

    const response = await fetch(`/api/org/${slug}/collections/${collectionId}/items/${itemId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      router.push(`/org/${organization.slug}/collections/${collectionId}/items`); // Go back to items list
    } else {
      const data = await response.json();
      setError(data.error || 'Failed to delete item');
    }
  };

  if (orgLoading || !organization) {
    return null;
  }

  if (orgError) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-xl text-gray-700">Loading item...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-red-500 text-xl mb-4">{error}</p>
        <Link href={`/org/${organization.slug}/collections/${collectionId}/items`} className="text-primary hover:underline">
          Go back to items
        </Link>
      </div>
    );
  }

  if (!item) {
    return <div className="text-center py-8 text-red-500">Item data not available.</div>;
  }

  const renderItemContent = () => {
    switch (item.type) {
      case 'video':
      case 'embed':
        return (
          <div className="aspect-video w-full">
            <iframe
              src={item.contentUrl}
              frameBorder="0"
              allowFullScreen
              className="w-full h-full rounded-md"
            ></iframe>
          </div>
        );
      case 'pdf':
        return (
          <object data={item.contentUrl} type="application/pdf" className="w-full h-96 rounded-md">
            <p>Your browser does not support PDFs. <a href={item.contentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Download the PDF</a>.</p>
          </object>
        );
      case 'article':
        // Render content using RichTextEditor in read-only mode
        return (
          <RichTextEditor
            content={JSON.stringify(item.articleContent || '{}')}
            onChange={() => {}} // No-op for read-only
            editable={false}
          />
        );
      case 'link':
        return (
          <p>
            External Link:{' '}
            <a href={item.contentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              {item.contentUrl}
            </a>
          </p>
        );
      default:
        return <p>Unknown item type.</p>;
    }
  };

  const itemTypes = ['video', 'pdf', 'article', 'embed', 'link']; // From schema, re-declared for local use


  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800" style={{ color: organization.primaryColor }}>
          {item.title}
        </h2>
        <div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 mr-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            {isEditing ? 'Cancel Edit' : 'Edit Item'}
          </button>
          <button
            onClick={handleDeleteItem}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            Delete Item
          </button>
        </div>
      </div>

      <p className="text-gray-600 text-lg mb-4">{item.description}</p>
      <p className="text-gray-500 text-sm mb-6">Type: {item.type} | Created: {new Date(item.createdAt).toLocaleDateString()}</p>

      {item.thumbnailUrl && (
        <img src={item.thumbnailUrl} alt={item.title} className="w-full h-64 object-cover mb-6 rounded-md" />
      )}

      <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
        {renderItemContent()}
      </div>

      {isEditing && (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md border-t-4" style={{ borderColor: organization.primaryColor }}>
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Edit Item</h3>
          <form onSubmit={handleUpdateItem} className="space-y-4">
            <div>
              <label htmlFor="editItemTitle" className="block text-sm font-medium text-gray-700">
                Item Title
              </label>
              <input
                id="editItemTitle"
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
            <div>
            <label htmlFor="editItemDescription" className="block text-sm font-medium text-gray-700">
              Description (Optional)
            </label>
            <textarea
              id="editItemDescription"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            ></textarea>
          </div>
          <div>
            <label htmlFor="editItemType" className="block text-sm font-medium text-gray-700">
              Item Type
            </label>
            <select
              id="editItemType"
              value={editType}
              onChange={(e) => setEditType(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
              {itemTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          {(editType === 'video' || editType === 'pdf' || editType === 'embed' || editType === 'link') && (
            <div>
              <label htmlFor="editItemContentUrl" className="block text-sm font-medium text-gray-700">
                Content URL
              </label>
              <input
                id="editItemContentUrl"
                type="url"
                value={editContentUrl}
                onChange={(e) => setEditContentUrl(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
          )}
          {editType === 'article' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Article Content
              </label>
              <RichTextEditor
                content={editArticleContent}
                onChange={setEditArticleContent}
                editable={isEditing} // Make editor editable only when in edit mode
              />
            </div>
          )}
          <div>
            <label htmlFor="editItemThumbnailUrl" className="block text-sm font-medium text-gray-700">
              Thumbnail URL (Optional)
            </label>
            <input
              id="editItemThumbnailUrl"
              type="url"
              value={editThumbnailUrl}
              onChange={(e) => setEditThumbnailUrl(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
            {editError && <p className="text-red-500 text-sm">{editError}</p>}
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { useOrganization } from '@/context/OrganizationContext';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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

const itemTypes = ['video', 'pdf', 'article', 'embed', 'link']; // From schema

export default function CollectionItemsPage() {
  const { organization, loading: orgLoading, error: orgError } = useOrganization();
  const params = useParams();
  const slug = params.slug as string;
  const collectionId = params.collectionId as string;

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemType, setNewItemType] = useState<string>(itemTypes[0]);
  const [newItemContentUrl, setNewItemContentUrl] = useState('');
  const [newItemArticleContent, setNewItemArticleContent] = useState(''); // JSON string from RichTextEditor
  const [newItemThumbnailUrl, setNewItemThumbnailUrl] = useState('');
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (!orgLoading && organization && collectionId) {
      fetchItems();
    }
  }, [orgLoading, organization, collectionId]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedPdfFile(e.target.files[0]);
    } else {
      setSelectedPdfFile(null);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/org/${slug}/collections/${collectionId}/items`);
      if (response.ok) {
        const data: Item[] = await response.json();
        setItems(data);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to fetch items');
      }
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError('');

    if (!organization) {
      setCreateError('Organization context not available.');
      setIsCreating(false);
      return;
    }

    let itemContentUrl = newItemContentUrl;

    if (newItemType === 'pdf' && selectedPdfFile) {
      const formData = new FormData();
      formData.append('file', selectedPdfFile);
      formData.append('organizationId', organization.id);

      const uploadResponse = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        setCreateError(errorData.error || 'Failed to upload PDF');
        setIsCreating(false);
        return;
      }
      const uploadData = await uploadResponse.json();
      itemContentUrl = uploadData.url;
    }


    let payload: any = {
      title: newItemTitle,
      description: newItemDescription,
      type: newItemType,
      thumbnailUrl: newItemThumbnailUrl,
    };

    if (['video', 'embed', 'link', 'pdf'].includes(newItemType)) {
      payload.contentUrl = itemContentUrl;
    } else if (newItemType === 'article') {
      // articleContent is already a JSON string from RichTextEditor
      payload.articleContent = JSON.parse(newItemArticleContent || '{}');
    }

    const response = await fetch(`/api/org/${slug}/collections/${collectionId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      setNewItemTitle('');
      setNewItemDescription('');
      setNewItemContentUrl('');
      setNewItemArticleContent(''); // Clear the editor content
      setNewItemThumbnailUrl('');
      setSelectedPdfFile(null);
      fetchItems(); // Refresh the list
    } else {
      const data = await response.json();
      setCreateError(data.error || 'Failed to create item');
    }
    setIsCreating(false);
  };

  if (orgLoading || !organization) {
    return null;
  }

  if (orgError) {
    return null;
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800" style={{ color: organization.primaryColor }}>
        Items in Collection
      </h2>
      <p className="text-gray-600 mb-6">This page displays items within the collection.</p>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Create New Item</h3>
        <form onSubmit={handleCreateItem} className="space-y-4">
          <div>
            <label htmlFor="itemTitle" className="block text-sm font-medium text-gray-700">
              Item Title
            </label>
            <input
              id="itemTitle"
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="itemDescription" className="block text-sm font-medium text-gray-700">
              Description (Optional)
            </label>
            <textarea
              id="itemDescription"
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            ></textarea>
          </div>
          <div>
            <label htmlFor="itemType" className="block text-sm font-medium text-gray-700">
              Item Type
            </label>
            <select
              id="itemType"
              value={newItemType}
              onChange={(e) => {
                setNewItemType(e.target.value);
                setNewItemContentUrl('');
                setNewItemArticleContent(''); // Clear articleContent when type changes
                setSelectedPdfFile(null);
              }}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
              {itemTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {(newItemType === 'video' || newItemType === 'embed' || newItemType === 'link') && (
            <div>
              <label htmlFor="itemContentUrl" className="block text-sm font-medium text-gray-700">
                Content URL
              </label>
              <input
                id="itemContentUrl"
                type="url"
                value={newItemContentUrl}
                onChange={(e) => setNewItemContentUrl(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
          )}

          {newItemType === 'pdf' && (
            <div>
              <label htmlFor="itemPdfFile" className="block text-sm font-medium text-gray-700">
                Upload PDF File
              </label>
              <input
                id="itemPdfFile"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                required={!selectedPdfFile}
                className="mt-1 block w-full text-sm text-gray-700
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-white
                hover:file:bg-primary-dark"
              />
              {selectedPdfFile && <p className="text-sm text-gray-500 mt-2">Selected: {selectedPdfFile.name}</p>}
            </div>
          )}

          {newItemType === 'article' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Article Content
              </label>
              <RichTextEditor
                content={newItemArticleContent}
                onChange={setNewItemArticleContent}
              />
            </div>
          )}

          <div>
            <label htmlFor="itemThumbnailUrl" className="block text-sm font-medium text-gray-700">
              Thumbnail URL (Optional)
            </label>
            <input
              id="itemThumbnailUrl"
              type="url"
              value={newItemThumbnailUrl}
              onChange={(e) => setNewItemThumbnailUrl(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
          {createError && <p className="text-red-500 text-sm">{createError}</p>}
          <button
            type="submit"
            disabled={isCreating}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create Item'}
          </button>
        </form>
      </div>

      <h3 className="text-xl font-semibold mb-4 text-gray-700">Existing Items</h3>
      {loading ? (
        <p>Loading items...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">No items found in this collection. Create one above!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md p-6 border-t-4" style={{ borderTopColor: organization.primaryColor }}>
              <h4 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h4>
              <p className="text-gray-600 text-sm mb-2">{item.description || 'No description provided.'}</p>
              <p className="text-gray-500 text-xs mb-4">Type: {item.type}</p>
              {item.thumbnailUrl && <img src={item.thumbnailUrl} alt={item.title} className="w-full h-32 object-cover mb-4 rounded-md" />}
              <Link
                href={`/org/${organization.slug}/collections/${collectionId}/items/${item.id}`}
                className="inline-block px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary-dark transition-colors text-sm"
                style={{ backgroundColor: organization.secondaryColor }}
              >
                View Item
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useOrganization } from '@/context/OrganizationContext';
import Link from 'next/link';

interface Collection {
  id: string;
  name: string;
  description?: string;
  createdById: string;
  createdAt: string;
}

export default function OrganizationCollectionsPage() {
  const { organization, loading: orgLoading, error: orgError } = useOrganization();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (!orgLoading && organization) {
      fetchCollections();
    }
  }, [orgLoading, organization]);

  const fetchCollections = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/org/${organization?.slug}/collections`);
      if (response.ok) {
        const data: Collection[] = await response.json();
        setCollections(data);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to fetch collections');
      }
    } catch (err) {
      console.error('Error fetching collections:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError('');

    if (!organization) {
      setCreateError('Organization context not available.');
      setIsCreating(false);
      return;
    }

    const response = await fetch(`/api/org/${organization.slug}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newCollectionName, description: newCollectionDescription }),
    });

    if (response.ok) {
      setNewCollectionName('');
      setNewCollectionDescription('');
      fetchCollections(); // Refresh the list
    } else {
      const data = await response.json();
      setCreateError(data.error || 'Failed to create collection');
    }
    setIsCreating(false);
  };

  if (orgLoading || !organization) {
    // The layout's loading.tsx handles initial org loading
    return null;
  }

  // Error state from OrganizationContext is handled by error.tsx
  if (orgError) {
    return null;
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800" style={{ color: organization.primaryColor }}>
        Collections for {organization.name}
      </h2>
      <p className="text-gray-600 mb-6">This page displays your organization's collections.</p>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Create New Collection</h3>
        <form onSubmit={handleCreateCollection} className="space-y-4">
          <div>
            <label htmlFor="collectionName" className="block text-sm font-medium text-gray-700">
              Collection Name
            </label>
            <input
              id="collectionName"
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="collectionDescription" className="block text-sm font-medium text-gray-700">
              Description (Optional)
            </label>
            <textarea
              id="collectionDescription"
              value={newCollectionDescription}
              onChange={(e) => setNewCollectionDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            ></textarea>
          </div>
          {createError && <p className="text-red-500 text-sm">{createError}</p>}
          <button
            type="submit"
            disabled={isCreating}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create Collection'}
          </button>
        </form>
      </div>

      <h3 className="text-xl font-semibold mb-4 text-gray-700">Existing Collections</h3>
      {loading ? (
        <p>Loading collections...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : collections.length === 0 ? (
        <p className="text-gray-500">No collections found. Create one above!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <div key={collection.id} className="bg-white rounded-lg shadow-md p-6 border-t-4" style={{ borderTopColor: organization.primaryColor }}>
              <h4 className="text-lg font-bold text-gray-800 mb-2">{collection.name}</h4>
              <p className="text-gray-600 text-sm mb-4">{collection.description || 'No description provided.'}</p>
              <Link
                href={`/org/${organization.slug}/collections/${collection.id}/items`}
                className="inline-block px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary-dark transition-colors text-sm"
                style={{ backgroundColor: organization.secondaryColor }}
              >
                View Items
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
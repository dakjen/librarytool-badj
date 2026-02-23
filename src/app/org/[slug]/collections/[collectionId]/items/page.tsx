'use client';

import { useEffect, useState, useCallback } from 'react';
import { useOrganization } from '@/context/OrganizationContext';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  Star, BookOpen, PenLine, Trash2, PlusCircle, ChevronUp, 
  LayoutList, FileText, Video, File, Link as LinkIcon, Code,
  Image as ImageIcon, Music, Headphones, Mic, Monitor, Database, 
  Globe, Archive, Folder, Clipboard, Award, GraduationCap, 
  Lightbulb, PenTool, Presentation
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface Collection {
  id: string;
  name: string;
  description?: string;
  createdById: string;
  createdAt: string;
}

interface Item {
  id: string;
  title: string;
  description?: string;
  type: string;
  contentUrl?: string;
  articleContent?: any; // JSONB
  thumbnailUrl?: string;
  isFavorite: boolean;
  orderIndex: number;
  createdById: string;
  createdAt: string;
}

const ICON_MAP: { [key: string]: any } = {
  'book-open': BookOpen,
  'file-text': FileText,
  'video': Video,
  'image': ImageIcon,
  'music': Music,
  'headphones': Headphones,
  'mic': Mic,
  'monitor': Monitor,
  'code': Code,
  'database': Database,
  'globe': Globe,
  'link': LinkIcon,
  'archive': Archive,
  'folder': Folder,
  'clipboard': Clipboard,
  'award': Award,
  'graduation-cap': GraduationCap,
  'lightbulb': Lightbulb,
  'pen-tool': PenTool,
  'presentation': Presentation,
};

const getItemIcon = (type: string) => {
  switch (type) {
    case 'video': return <Video className="w-4 h-4 text-blue-500" />;
    case 'pdf': return <File className="w-4 h-4 text-red-500" />;
    case 'article': return <FileText className="w-4 h-4 text-green-500" />;
    case 'link': return <LinkIcon className="w-4 h-4 text-purple-500" />;
    case 'embed': return <Code className="w-4 h-4 text-orange-500" />;
    default: return null;
  }
}

const renderThumbnail = (thumbnailUrl: string | undefined, title: string) => {
  if (!thumbnailUrl) return null;

  if (thumbnailUrl.startsWith('icon:')) {
    const iconName = thumbnailUrl.replace('icon:', '');
    const IconComponent = ICON_MAP[iconName] || BookOpen; // Default to BookOpen if not found
    
    return (
      <div className="h-48 w-full bg-gray-50 flex items-center justify-center">
        <IconComponent className="w-20 h-20 text-gray-300" />
      </div>
    );
  }

  return (
    <div className="h-48 relative overflow-hidden">
      <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
    </div>
  );
};

export default function CollectionItemsPage() {
  const { organization, loading: orgLoading, error: orgError } = useOrganization();
  const params = useParams();
  const slug = params.slug as string;
  const collectionId = params.collectionId as string;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [isUpdatingCollection, setIsUpdatingCollection] = useState(false);


  useEffect(() => {
    if (!orgLoading && organization && collectionId) {
      fetchCollectionDetails();
      fetchItems();
    }
  }, [orgLoading, organization, collectionId]);

  const fetchCollectionDetails = async () => {
    try {
      const response = await fetch(`/api/org/${slug}/collections/${collectionId}`);
      if (response.ok) {
        const data: Collection = await response.json();
        setCollection(data);
        setEditedDescription(data.description || '');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to fetch collection details');
      }
    } catch (err) {
      console.error('Error fetching collection details:', err);
      toast.error('An unexpected error occurred while fetching collection details.');
    }
  }

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

  const handleUpdateCollectionDescription = async () => {
    if (!organization || !collection) return;
    setIsUpdatingCollection(true);
    try {
      const response = await fetch(`/api/org/${organization.slug}/collections/${collectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: editedDescription }),
      });
      if (response.ok) {
        setCollection(prev => (prev ? { ...prev, description: editedDescription } : null));
        setIsEditingDescription(false);
        toast.success('Collection description updated!');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update description.');
      }
    } catch (err) {
      console.error('Error updating collection description:', err);
      toast.error('An unexpected error occurred.');
    } finally {
      setIsUpdatingCollection(false);
    }
  };

  const toggleFavorite = async (itemId: string, currentStatus: boolean) => {
    if (!organization) return;
    try {
      const response = await fetch(`/api/org/${organization.slug}/collections/${collectionId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !currentStatus }),
      });
      if (response.ok) {
        setItems(prevItems => 
          prevItems.map(item => 
            item.id === itemId ? { ...item, isFavorite: !currentStatus } : item
          ).sort((a, b) => (b.isFavorite ? 1 : -1) - (a.isFavorite ? 1 : -1) || a.orderIndex - b.orderIndex) // Re-sort
        );
        toast.success(`Item ${!currentStatus ? 'favorited' : 'unfavorited'}!`);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update favorite status.');
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      toast.error('An unexpected error occurred.');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!organization || !confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/org/${organization.slug}/collections/${collectionId}/items/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setItems(prevItems => prevItems.filter(item => item.id !== itemId));
        toast.success('Item deleted successfully!');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete item.');
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      toast.error('An unexpected error occurred.');
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    // Update orderIndex for all items in the new order
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      orderIndex: index,
    }));
    setItems(updatedItems); // Optimistically update UI

    // Batch update orderIndex in backend (or individual calls)
    try {
      // For simplicity, making individual calls. A batch API would be better.
      for (const [index, item] of updatedItems.entries()) {
        await fetch(`/api/org/${organization?.slug}/collections/${collectionId}/items/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderIndex: index }),
        });
      }
      toast.success('Items reordered successfully!');
    } catch (err) {
      console.error('Error reordering items:', err);
      toast.error('Failed to reorder items.');
      fetchItems(); // Revert to server state if error
    }
  };


  if (orgLoading || !organization || !collection) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (orgError || error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 text-xl mb-4">{orgError || error}</p>
        <Link href="/dashboard" className="text-primary hover:underline">Go to Dashboard</Link>
      </div>
    );
  }

  const favoriteItems = items.filter(item => item.isFavorite);
  const otherItems = items.filter(item => !item.isFavorite);

  return (
    <div className="max-w-7xl mx-auto p-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold text-primary mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 opacity-80" />
            {collection.name}
          </h1>
          <div className="text-gray-600 text-lg font-light flex items-center gap-2">
            {isEditingDescription ? (
              <div className="flex flex-col w-full">
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-gray-900 bg-white"
                  rows={3}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleUpdateCollectionDescription}
                    disabled={isUpdatingCollection}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    {isUpdatingCollection ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setIsEditingDescription(false); setEditedDescription(collection.description || ''); }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p>{collection.description || 'No description provided.'}</p>
                <button 
                  onClick={() => setIsEditingDescription(true)}
                  className="p-1 rounded-full text-gray-400 hover:text-primary hover:bg-gray-100 transition-colors"
                  title="Edit Description"
                >
                  <PenLine className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
        <Link
          href={`/org/${organization.slug}/collections/${collectionId}/add-item`}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark transition-all transform hover:-translate-y-0.5"
        >
          <PlusCircle className="w-5 h-5" />
          Add New Item
        </Link>
      </div>

      {/* Favorite Items Section */}
      {favoriteItems.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-serif font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Star className="w-6 h-6 text-secondary-dark" fill="currentColor" />
            Featured Reads
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col group">
                {renderThumbnail(item.thumbnailUrl, item.title)}
                <div className="p-6 flex-grow">
                  <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description || 'No description provided.'}</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize text-xs">{item.type}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleFavorite(item.id, item.isFavorite)}
                        className="p-1 rounded-full text-secondary-dark hover:bg-gray-100 transition-colors"
                        title="Unfavorite Item"
                      >
                        <Star className="w-5 h-5" fill="currentColor" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <Link
                    href={`/org/${organization.slug}/collections/${collectionId}/items/${item.id}`}
                    className="flex items-center justify-between text-primary hover:text-primary-dark font-medium text-sm transition-colors"
                  >
                    View Details
                    <ChevronUp className="w-4 h-4 transform rotate-90" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Items Section (with Drag and Drop) */}
      <h2 className="text-2xl font-serif font-bold text-gray-800 mb-6 flex items-center gap-2">
        <LayoutList className="w-6 h-6 text-primary" />
        All Library Items
      </h2>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : otherItems.length === 0 && favoriteItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
          <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-1">No items yet</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            This collection is empty. Add your first item to get started!
          </p>
          <Link
            href={`/org/${organization.slug}/collections/${collectionId}/add-item`}
            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors shadow-sm"
          >
            Add First Item
          </Link>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="items">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
              >
                {otherItems.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="flex items-center justify-between px-6 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => toggleFavorite(item.id, item.isFavorite)}
                            className="p-1 rounded-full text-gray-400 hover:text-secondary-dark hover:bg-gray-100 transition-colors"
                            title={item.isFavorite ? "Unfavorite Item" : "Favorite Item"}
                          >
                            <Star className={`w-5 h-5 ${item.isFavorite ? 'text-secondary-dark fill-current' : ''}`} />
                          </button>
                          {getItemIcon(item.type)}
                          <Link href={`/org/${organization.slug}/collections/${collectionId}/items/${item.id}`} className="font-medium text-gray-900 hover:text-primary transition-colors">
                            {item.title}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-50">
                          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize text-xs">{item.type}</span>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}
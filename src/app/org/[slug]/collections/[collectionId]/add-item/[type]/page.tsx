'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrganization } from '@/context/OrganizationContext';
import RichTextEditor from '@/components/RichTextEditor';
import { toast } from 'react-hot-toast';
import { 
  Video, File, FileText, Link as LinkIcon, Code,
  BookOpen, PlusCircle, Image as ImageIcon, Music, 
  Headphones, Mic, Monitor, Database, Globe, Archive, 
  Folder, Clipboard, Award, GraduationCap, Lightbulb, PenTool,
  Presentation, Check
} from 'lucide-react';

interface ItemFormProps {
  slug: string;
  collectionId: string;
  itemType: string;
  organizationId: string;
  onItemCreated: () => void;
}

const getItemIcon = (type: string) => {
  switch (type) {
    case 'video': return <Video className="w-6 h-6 text-blue-500" />;
    case 'pdf': return <File className="w-6 h-6 text-red-500" />;
    case 'article': return <FileText className="w-6 h-6 text-green-500" />;
    case 'link': return <LinkIcon className="w-6 h-6 text-purple-500" />;
    case 'embed': return <Code className="w-6 h-6 text-orange-500" />;
    default: return null;
  }
}

const getItemTypeName = (type: string) => {
  switch (type) {
    case 'video': return 'Video';
    case 'pdf': return 'PDF Document';
    case 'article': return 'Article';
    case 'embed': return 'Embedded Content';
    case 'link': return 'External Link';
    default: return 'Unknown Type';
  }
}

const ICON_OPTIONS = [
  { name: 'book-open', icon: BookOpen },
  { name: 'file-text', icon: FileText },
  { name: 'video', icon: Video },
  { name: 'image', icon: ImageIcon },
  { name: 'music', icon: Music },
  { name: 'headphones', icon: Headphones },
  { name: 'mic', icon: Mic },
  { name: 'monitor', icon: Monitor },
  { name: 'code', icon: Code },
  { name: 'database', icon: Database },
  { name: 'globe', icon: Globe },
  { name: 'link', icon: LinkIcon },
  { name: 'archive', icon: Archive },
  { name: 'folder', icon: Folder },
  { name: 'clipboard', icon: Clipboard },
  { name: 'award', icon: Award },
  { name: 'graduation-cap', icon: GraduationCap },
  { name: 'lightbulb', icon: Lightbulb },
  { name: 'pen-tool', icon: PenTool },
  { name: 'presentation', icon: Presentation },
];

function ItemForm({ slug, collectionId, itemType, organizationId, onItemCreated }: ItemFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('book-open'); // Default icon
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    let finalContentUrl = contentUrl;
    let finalArticleContent = articleContent;

    if (itemType === 'pdf' && selectedFile) {
      toast.loading('Uploading PDF...', { id: 'pdfUpload' });
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('organizationId', organizationId);

      try {
        const uploadResponse = await fetch('/api/upload-pdf', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          setError(errorData.error || 'Failed to upload PDF');
          toast.error(errorData.error || 'Failed to upload PDF', { id: 'pdfUpload' });
          setIsSubmitting(false);
          return;
        }
        const uploadData = await uploadResponse.json();
        finalContentUrl = uploadData.url;
        toast.success('PDF uploaded successfully!', { id: 'pdfUpload' });
      } catch (err) {
        console.error('PDF upload error:', err);
        setError('An unexpected error occurred during PDF upload.');
        toast.error('An unexpected error occurred during PDF upload.', { id: 'pdfUpload' });
        setIsSubmitting(false);
        return;
      }
    }

    const payload: any = {
      title,
      description,
      type: itemType,
      thumbnailUrl: `icon:${selectedIcon}`, // Store selected icon
      isFavorite: false, 
      orderIndex: 0,
    };

    if (['video', 'embed', 'link', 'pdf'].includes(itemType)) {
      payload.contentUrl = finalContentUrl;
    } else if (itemType === 'article') {
      payload.articleContent = JSON.parse(finalArticleContent || '{}');
    }

    try {
      const response = await fetch(`/api/org/${slug}/collections/${collectionId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(`${getItemTypeName(itemType)} item created successfully!`);
        onItemCreated(); 
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create item');
        toast.error(data.error || 'Failed to create item');
      }
    } catch (err) {
      console.error('Error creating item:', err);
      setError('An unexpected error occurred.');
      toast.error('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Item Title</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-gray-900 bg-white"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-gray-900 bg-white"
        />
      </div>

      {['video', 'embed', 'link', 'pdf'].includes(itemType) && (
        <div>
          <label htmlFor="contentUrl" className="block text-sm font-medium text-gray-700 mb-1">
            {itemType === 'pdf' ? 'PDF URL (if not uploading)' : 'Content URL'}
          </label>
          <input
            id="contentUrl"
            type="url"
            value={contentUrl}
            onChange={(e) => setContentUrl(e.target.value)}
            required={itemType !== 'pdf' || !selectedFile}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-gray-900 bg-white"
          />
        </div>
      )}

      {itemType === 'pdf' && (
        <div>
          <label htmlFor="pdfFile" className="block text-sm font-medium text-gray-700 mb-1">
            Upload PDF File
          </label>
          <input
            id="pdfFile"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            required={!contentUrl && !selectedFile}
            className="mt-1 block w-full text-sm text-gray-700
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-primary file:text-white
            hover:file:bg-primary-dark"
          />
          {selectedFile && <p className="text-sm text-gray-500 mt-2">Selected: {selectedFile.name}</p>}
          <p className="text-xs text-gray-500 mt-1">
            You can either upload a PDF or provide a direct URL above.
          </p>
        </div>
      )}

      {itemType === 'article' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Article Content
          </label>
          <RichTextEditor
            content={articleContent}
            onChange={setArticleContent}
          />
        </div>
      )}

      {/* Icon Chooser */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Choose an Icon</label>
        <div className="grid grid-cols-5 sm:grid-cols-8 gap-3">
          {ICON_OPTIONS.map((option) => {
            const IconComponent = option.icon;
            const isSelected = selectedIcon === option.name;
            return (
              <div
                key={option.name}
                onClick={() => setSelectedIcon(option.name)}
                className={`
                  cursor-pointer p-3 rounded-lg flex items-center justify-center transition-all
                  ${isSelected 
                    ? 'bg-primary text-white shadow-md transform scale-105' 
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }
                `}
                title={option.name}
              >
                <IconComponent className="w-6 h-6" />
              </div>
            );
          })}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
        <Link
          href={`/org/${slug}/collections/${collectionId}/items`}
          className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-5 py-2 bg-primary text-white font-semibold rounded-md shadow-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusCircle className="w-5 h-5" />
          {isSubmitting ? 'Adding...' : `Add ${getItemTypeName(itemType)}`}
        </button>
      </div>
    </form>
  );
}

export default function AddItemFormPage() {
  const params = useParams();
  const slug = params.slug as string;
  const collectionId = params.collectionId as string;
  const itemType = params.type as string; 
  const router = useRouter();
  const { organization } = useOrganization();

  const handleItemCreated = () => {
    router.push(`/org/${slug}/collections/${collectionId}/items`);
  };

  if (!organization) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const validItemTypes = ['video', 'pdf', 'article', 'embed', 'link'];
  if (!validItemTypes.includes(itemType)) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center bg-white rounded-xl shadow-lg mt-10">
        <h2 className="text-2xl font-serif font-bold text-red-600 mb-4">Invalid Item Type</h2>
        <p className="text-gray-700 mb-6">The item type '{itemType}' is not supported. Please select a valid type.</p>
        <Link 
          href={`/org/${slug}/collections/${collectionId}/add-item`}
          className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          Go Back to Type Selection
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 font-sans">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/org/${slug}/collections/${collectionId}/add-item`} className="text-gray-500 hover:text-primary transition-colors">
          &larr; Back to Type Selection
        </Link>
        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
        <h1 className="text-4xl font-serif font-bold text-primary flex items-center gap-3">
          {getItemIcon(itemType)}
          Add New {getItemTypeName(itemType)}
        </h1>
      </div>
      
      <p className="text-gray-600 text-lg mb-10">
        Enter the details for your new {getItemTypeName(itemType)} item.
      </p>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <ItemForm
          slug={slug}
          collectionId={collectionId}
          itemType={itemType}
          organizationId={organization.id}
          onItemCreated={handleItemCreated}
        />
      </div>
    </div>
  );
}
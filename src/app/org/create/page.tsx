'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateOrganization() {
  const [name, setName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#003366'); // Default Navy
  const [secondaryColor, setSecondaryColor] = useState('#B89E68'); // Default Antique Gold
  const [accentColor, setAccentColor] = useState('#800000'); // Default Maroon
  const [logoUrl, setLogoUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/org/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          primaryColor,
          secondaryColor,
          accentColor,
          logoUrl,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to the new organization's dashboard
        router.push(`/org/${data.slug}`);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create organization');
      }
    } catch (err) {
      console.error('Error creating organization:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden border border-secondary/20">
        <div className="p-8">
          <h2 className="text-3xl font-serif font-bold text-center text-primary mb-6">Create New Organization</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-gray-900 bg-white"
                placeholder="e.g. My Awesome Library"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="primaryColor" className="block text-xs font-medium text-gray-600 mb-1">Primary Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    id="primaryColor"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-8 w-8 rounded cursor-pointer border-none p-0"
                  />
                  <span className="text-xs text-gray-500 font-mono">{primaryColor}</span>
                </div>
              </div>
              <div>
                <label htmlFor="secondaryColor" className="block text-xs font-medium text-gray-600 mb-1">Secondary Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    id="secondaryColor"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-8 w-8 rounded cursor-pointer border-none p-0"
                  />
                  <span className="text-xs text-gray-500 font-mono">{secondaryColor}</span>
                </div>
              </div>
               <div>
                <label htmlFor="accentColor" className="block text-xs font-medium text-gray-600 mb-1">Accent Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    id="accentColor"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-8 w-8 rounded cursor-pointer border-none p-0"
                  />
                  <span className="text-xs text-gray-500 font-mono">{accentColor}</span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 mb-1">Logo URL (Optional)</label>
              <input
                id="logoUrl"
                name="logoUrl"
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-gray-900 bg-white"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors
                ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Creating...' : 'Create Organization'}
            </button>
          </form>
          
           <div className="mt-4 text-center">
            <Link href="/dashboard" className="text-sm text-primary hover:underline">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
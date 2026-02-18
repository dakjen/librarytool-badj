'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

export default function DashboardPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const response = await fetch('/api/user/organizations');
        if (response.ok) {
          const data: Organization[] = await response.json();
          setOrganizations(data);
        } else {
          const data = await response.json();
          setError(data.error || 'Failed to fetch organizations');
          if (response.status === 401) {
            router.push('/login'); // Redirect to login if unauthorized
          }
        }
      } catch (err) {
        console.error('Error fetching organizations:', err);
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }
    fetchOrganizations();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3 text-lg text-primary font-serif">Loading your library...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background">
        <div className="bg-white p-8 rounded-lg shadow-xl border border-red-200">
          <p className="text-red-600 text-xl font-medium mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center md:text-left flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-2">Welcome Back</h1>
            <p className="text-lg text-gray-600 font-light">Select an organization to manage or view.</p>
          </div>
          <Link
            href="/org/create"
            className="mt-4 md:mt-0 px-6 py-3 bg-secondary text-primary-dark font-semibold rounded-lg shadow-md hover:bg-secondary-dark hover:text-white transition-all transform hover:-translate-y-1"
          >
            + Create Organization
          </Link>
        </header>

        {organizations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-2xl font-serif font-semibold text-gray-800 mb-2">No Organizations Yet</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">You haven't joined or created any organizations. Get started by creating your own library space.</p>
            <Link
              href="/org/create"
              className="px-8 py-3 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors font-medium shadow-md"
            >
              Create Your First Organization
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {organizations.map((org) => (
              <Link key={org.id} href={`/org/${org.slug}`}>
                <div 
                  className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-primary/20 h-full flex flex-col"
                >
                  <div 
                    className="h-3 w-full" 
                    style={{ backgroundColor: org.primaryColor || 'var(--color-primary)' }}
                  />
                  <div className="p-6 flex-grow flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      {org.logoUrl ? (
                        <img 
                          src={org.logoUrl} 
                          alt={`${org.name} Logo`} 
                          className="w-16 h-16 object-contain rounded-md bg-gray-50 p-1" 
                        />
                      ) : (
                        <div 
                          className="w-16 h-16 rounded-md bg-gray-50 flex items-center justify-center text-2xl font-serif font-bold"
                          style={{ color: org.primaryColor || 'var(--color-primary)' }}
                        >
                          {org.name.charAt(0)}
                        </div>
                      )}
                      <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded bg-gray-100 text-gray-600">
                        {org.role.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <h2 className="text-xl font-serif font-bold text-gray-800 mb-2 group-hover:text-primary transition-colors">
                      {org.name}
                    </h2>
                    
                    <div className="mt-auto pt-4 flex items-center text-sm font-medium text-secondary-dark group-hover:text-secondary-dark transition-colors">
                      Enter Dashboard
                      <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
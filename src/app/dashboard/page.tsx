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
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl text-gray-700">Loading organizations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl text-gray-700 mb-4">You are not a member of any organization.</p>
        {/* Potentially add a link to create an organization */}
        <Link href="/org/create" className="text-primary hover:underline">
          Create a new organization
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Your Organizations</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations.map((org) => (
          <div
            key={org.id}
            className="bg-white rounded-lg shadow-md p-6 border-t-4"
            style={{ borderTopColor: org.primaryColor || 'var(--color-primary)' }}
          >
            <h2 className="text-xl font-semibold mb-2 text-gray-800">{org.name}</h2>
            <p className="text-gray-600 mb-4">Your role: <span className="font-medium capitalize">{org.role.replace('_', ' ')}</span></p>
            {org.logoUrl && (
              <img src={org.logoUrl} alt={`${org.name} Logo`} className="w-24 h-auto mb-4" />
            )}
            <Link
              href={`/org/${org.slug}/dashboard`}
              className="inline-block px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

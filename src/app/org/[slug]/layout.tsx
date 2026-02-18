'use client';

import { ReactNode, useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { OrganizationProvider, useOrganization } from '@/context/OrganizationContext';
import { useState } from 'react';
import OrgDashboardNav from '@/components/OrgDashboardNav';
import Link from 'next/link'; // Added this import

// This component will fetch and provide the organization context
function OrganizationDataLoader({ slug, children }: { slug: string; children: ReactNode }) {
  const { setOrganization, setLoading, setError } = useOrganization();
  const router = useRouter();

  useEffect(() => {
    async function fetchOrgData() {
      setLoading(true);
      setError(null);
      try {
        // Need a new API endpoint to fetch organization details by slug
        // For now, let's mock it or assume we will create `/api/org/[slug]/route.ts`
        const response = await fetch(`/api/org/${slug}`); // Assuming this API exists or will be created
        if (response.ok) {
          const data = await response.json();
          setOrganization(data);
        } else if (response.status === 404) {
          notFound(); // Next.js built-in notFound function
        } else if (response.status === 401) {
            router.push('/login'); // Redirect to login if unauthorized
        } else {
          const errData = await response.json();
          setError(errData.error || 'Failed to fetch organization details');
        }
      } catch (err) {
        console.error('Error fetching organization data:', err);
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }
    fetchOrgData();
  }, [slug, setOrganization, setLoading, setError, router]);

  return <>{children}</>;
}


export default async function OrganizationLayout({ // Added async
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>; // Changed to Promise
}) {
  const resolvedParams = await params; // New line
  const slug = resolvedParams.slug; // Get slug from resolvedParams

  return (
    <OrganizationProvider>
      <OrganizationDataLoader slug={slug}> // Pass slug from resolvedParams
        <OrganizationSpecificStyling>
          {children}
        </OrganizationSpecificStyling>
      </OrganizationDataLoader>
    </OrganizationProvider>
  );
}

function OrganizationSpecificStyling({ children }: { children: ReactNode }) {
  const { organization, loading, error } = useOrganization();

  useEffect(() => {
    if (!loading && organization) {
      document.documentElement.style.setProperty('--color-primary', organization.primaryColor || '#b4522a');
      document.documentElement.style.setProperty('--color-secondary', organization.secondaryColor || '#2e2e2e');
      document.documentElement.style.setProperty('--color-accent', organization.accentColor || '#7a6151');
    } else if (!loading && error) {
      // Potentially revert to default colors or show specific error styling
      document.documentElement.style.setProperty('--color-primary', '#b4522a');
      document.documentElement.style.setProperty('--color-secondary', '#2e2e2e');
      document.documentElement.style.setProperty('--color-accent', '#7a6151');
    }
  }, [organization, loading, error]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl text-gray-700">Loading organization...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 text-xl mb-4">{error}</p>
        <Link href="/dashboard" className="text-primary hover:underline">Go to Dashboard</Link>
      </div>
    );
  }

  // If organization data is loaded, render children
  return (
    <>
      {organization && <OrgDashboardNav />}
      {children}
    </>
  );
}

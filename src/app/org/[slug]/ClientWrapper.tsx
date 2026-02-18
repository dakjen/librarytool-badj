'use client';

import { ReactNode, useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { OrganizationProvider, useOrganization } from '@/context/OrganizationContext';
import OrgDashboardNav from '@/components/OrgDashboardNav';
import Link from 'next/link';

export default function ClientWrapper({ slug, children }: { slug: string; children: ReactNode }) {
  return (
    <OrganizationProvider>
      <OrganizationDataLoader slug={slug}>
        <OrganizationSpecificStyling>
          {children}
        </OrganizationSpecificStyling>
      </OrganizationDataLoader>
    </OrganizationProvider>
  );
}

function OrganizationDataLoader({ slug, children }: { slug: string; children: ReactNode }) {
  const { setOrganization, setLoading, setError } = useOrganization();
  const router = useRouter();

  useEffect(() => {
    async function fetchOrgData() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/org/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setOrganization(data);
        } else if (response.status === 404) {
          notFound();
        } else if (response.status === 401) {
            router.push('/login');
        } else {
          // Attempt to parse error JSON, fallback to text or generic message
          try {
             const errData = await response.json();
             setError(errData.error || 'Failed to fetch organization details');
          } catch (e) {
             setError('Failed to fetch organization details');
          }
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

function OrganizationSpecificStyling({ children }: { children: ReactNode }) {
  const { organization, loading, error } = useOrganization();

  useEffect(() => {
    if (!loading && organization) {
      document.documentElement.style.setProperty('--color-primary', organization.primaryColor || '#003366');
      document.documentElement.style.setProperty('--color-secondary', organization.secondaryColor || '#B89E68');
      document.documentElement.style.setProperty('--color-accent', organization.accentColor || '#800000');
    } else if (!loading && error) {
      // Revert to default "Collegiate Lux" colors
      document.documentElement.style.setProperty('--color-primary', '#003366');
      document.documentElement.style.setProperty('--color-secondary', '#B89E68');
      document.documentElement.style.setProperty('--color-accent', '#800000');
    }
  }, [organization, loading, error]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 text-xl mb-4">{error}</p>
        <Link href="/dashboard" className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      {organization && <OrgDashboardNav />}
      <div className="fade-in">
        {children}
      </div>
    </>
  );
}

'use client';

import { useOrganization } from '@/context/OrganizationContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function OrganizationDashboardPage() {
  const { organization, loading, error } = useOrganization();
  const router = useRouter();

  // The layout should handle loading and error states for the organization data itself.
  // This page assumes organization data is available via context.

  if (loading) {
    // This state should ideally be caught by loading.tsx in the same route group
    return <div className="text-center py-8">Loading organization dashboard...</div>;
  }

  if (error || !organization) {
    // This state should ideally be caught by error.tsx or handled in layout.tsx
    // For now, if there's an error or no organization, redirect to dashboard or show error
    router.push('/dashboard'); // Redirect to main dashboard or show a generic error page
    return null;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4 text-gray-800" style={{ color: organization.primaryColor }}>
        {organization.name} Dashboard
      </h1>
      <p className="text-gray-600 mb-6">Welcome to your organization's dashboard, {organization.name}.</p>
      <p className="text-gray-600 mb-6">Your role: <span className="font-medium capitalize">{organization.role.replace('_', ' ')}</span></p>

      {/* Basic Navigation for the Organization */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <Link href={`/org/${organization.slug}/collections`} className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Collections</h2>
          <p className="text-gray-600">Manage your knowledge collections.</p>
        </Link>
        <Link href={`/org/${organization.slug}/members`} className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Members</h2>
          <p className="text-gray-600">View and manage organization members.</p>
        </Link>
        <Link href={`/org/${organization.slug}/settings`} className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Settings</h2>
          <p className="text-gray-600">Configure organization settings.</p>
        </Link>
        {/* Add more links as per SPEC.md (e.g., /admin, /analytics) */}
      </div>
    </div>
  );
}

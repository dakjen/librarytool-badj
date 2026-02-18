'use client';

import { useOrganization } from '@/context/OrganizationContext';

export default function OrganizationAnalyticsPage() {
  const { organization } = useOrganization();

  if (!organization) {
    return <div className="text-center py-8">Organization not found.</div>;
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800" style={{ color: organization.primaryColor }}>
        Analytics for {organization.name}
      </h2>
      <p className="text-gray-600">This page will display analytics data for the organization.</p>
      {/* Placeholder for analytics UI */}
      <div className="mt-8 p-4 border border-gray-300 rounded-md">
        <p className="text-gray-500">Analytics dashboard UI will go here...</p>
      </div>
    </div>
  );
}

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  role: string; // The user's role in this organization
}

interface OrganizationContextType {
  organization: Organization | null;
  loading: boolean;
  error: string | null;
  setOrganization: (org: Organization | null) => void;
  setLoading: (loading: boolean) => void; // Add this
  setError: (error: string | null) => void; // Add this
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // You would typically fetch the organization data here based on the URL slug
  // For now, this context is populated by the layout component.

  return (
    <OrganizationContext.Provider value={{ organization, loading, error, setOrganization, setLoading, setError }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}

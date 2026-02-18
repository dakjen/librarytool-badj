'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useOrganization } from '@/context/OrganizationContext';

export default function OrgDashboardNav() {
  const pathname = usePathname();
  const { organization } = useOrganization();

  if (!organization) {
    return null; // Should not happen if used within OrganizationLayout
  }

  const navItems = [
    { name: 'Dashboard', href: `/org/${organization.slug}` },
    { name: 'Collections', href: `/org/${organization.slug}/collections` },
    { name: 'Members', href: `/org/${organization.slug}/members` },
    { name: 'Analytics', href: `/org/${organization.slug}/analytics` },
    { name: 'Settings', href: `/org/${organization.slug}/settings` },
  ];

  return (
    <nav className="bg-white shadow-md rounded-lg p-4 mb-8">
      <ul className="flex flex-wrap gap-4 justify-center md:justify-start">
        {navItems.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${pathname === item.href
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                }`}
              style={pathname === item.href ? { backgroundColor: organization.primaryColor } : {}}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

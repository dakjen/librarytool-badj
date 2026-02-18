import { ReactNode } from 'react';
import ClientWrapper from './ClientWrapper'; // Correct import path

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  return (
    <ClientWrapper slug={slug}>
      {children}
    </ClientWrapper>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const response = await fetch('/api/auth/status');
        if (response.ok) {
          const data = await response.json();
          setAuthenticated(data.authenticated);
          if (data.authenticated) {
            router.push('/dashboard');
          }
        } else {
          setAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setAuthenticated(false);
      }
    }
    checkAuthStatus();
  }, [router]);

  if (authenticated === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <h1 className="text-3xl font-serif font-bold mb-4">Loading...</h1>
        <p className="text-secondary-dark">Checking authentication status...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center py-32 px-4 text-center overflow-hidden bg-primary text-white">
        <div className="absolute inset-0 opacity-20">
           {/* Placeholder for a pattern or image */}
           <div className="w-full h-full bg-[url('/daniel-thomas-HA-0i0E7sq4-unsplash.jpg')] bg-cover bg-center mix-blend-overlay"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 text-white drop-shadow-md leading-tight">
            Empower Your Knowledge. <br/> <span className="text-secondary">Share Your Expertise.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            A premium platform for experts and organizations to curate private, branded knowledge libraries.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/login"
              className="px-8 py-4 bg-secondary text-primary-dark rounded-md text-lg font-bold shadow-lg hover:bg-white hover:text-primary transition-all duration-300 transform hover:-translate-y-1"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="px-8 py-4 border-2 border-secondary text-secondary rounded-md text-lg font-bold hover:bg-secondary hover:text-primary-dark transition-all duration-300 transform hover:-translate-y-1"
            >
              Register
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-background">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-4">
            What You Can Build
          </h2>
          <div className="w-24 h-1 bg-secondary mx-auto"></div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Feature 1 */}
          <div className="group bg-white p-8 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-secondary/30">
            <div className="h-48 w-full relative mb-6 rounded-lg overflow-hidden">
               <Image
                src="/fabio-lucas-Ql3KUDa2x10-unsplash.jpg"
                alt="Curate"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <h3 className="text-2xl font-serif font-bold mb-3 text-primary">Curate Content</h3>
            <p className="text-gray-600 leading-relaxed">
              Upload videos, PDFs, and articles. Integrate Google Drive and external links into intuitive, structured collections.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group bg-white p-8 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-secondary/30">
             <div className="h-48 w-full relative mb-6 rounded-lg overflow-hidden">
               <Image
                src="/jehyun-sung-6U5AEmQIajg-unsplash.jpg"
                alt="Brand"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <h3 className="text-2xl font-serif font-bold mb-3 text-primary">Your Brand</h3>
            <p className="text-gray-600 leading-relaxed">
              Customize your library with your organization's colors and logo. Create a space that feels uniquely yours.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group bg-white p-8 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-secondary/30">
             <div className="h-48 w-full relative mb-6 rounded-lg overflow-hidden">
               <Image
                src="/markus-spiske-QozzJpFZ2lg-unsplash.jpg"
                alt="Engage"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <h3 className="text-2xl font-serif font-bold mb-3 text-primary">Engage & Grow</h3>
            <p className="text-gray-600 leading-relaxed">
              Foster a community of learning. Share expertise efficiently with members, students, or employees.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-24 px-4 text-center bg-primary-dark text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-secondary opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent opacity-10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
            Ready to build your library?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join a growing community of experts. Start your free trial today.
          </p>
          <Link
            href="/register"
            className="inline-block px-12 py-4 bg-accent text-white rounded-md text-xl font-bold shadow-xl hover:bg-accent-dark hover:scale-105 transition-all duration-300"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 text-center bg-white border-t border-gray-200 text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Library Tool. All rights reserved.</p>
      </footer>
    </div>
  );
}
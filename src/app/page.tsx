'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image'; // Import Image component

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
            router.push('/dashboard'); // Redirect authenticated users to dashboard
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
    // Show a loading indicator while checking auth status
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-secondary text-white">
        <h1 className="text-3xl font-bold mb-4">Loading...</h1>
        <p className="text-gray-300">Checking authentication status...</p>
      </div>
    );
  }

  // If not authenticated, display the landing page content
  return (
    <div className="min-h-screen bg-secondary text-gray-100"> {/* Overall dark background */}
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center py-20 px-4 text-center overflow-hidden">
        {/* Background Image with Opacity */}
        <Image
          src="/daniel-thomas-HA-0i0E7sq4-unsplash.jpg"
          alt="Abstract background of knowledge sharing"
          fill
          priority
          className="object-cover -z-10 opacity-30" // Opaque background
        />
        <div className="relative z-10"> {/* Ensure content is above background image */}
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-primary drop-shadow-lg">
            Empower Your Knowledge. Share Your Expertise.
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-3xl opacity-90">
            A multi-company platform where experts, educators, and organizations can create, curate, and share private branded knowledge libraries with their audience.
          </p>
          <div className="flex space-x-4">
            <Link
              href="/login"
              className="px-8 py-3 bg-primary text-white rounded-full text-lg font-semibold shadow-lg hover:bg-primary-dark transition-all duration-300"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-8 py-3 border-2 border-white text-white rounded-full text-lg font-semibold shadow-lg hover:bg-white hover:text-primary transition-all duration-300"
            >
              Register
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-secondary">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary">
          What You Can Build
        </h2>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {/* Feature 1: Curate Diverse Content */}
          <div className="flex flex-col items-center text-center p-6 bg-secondary-light rounded-lg shadow-md">
            <div className="relative w-full h-48 mb-6">
              <Image
                src="/fabio-lucas-Ql3KUDa2x10-unsplash.jpg"
                alt="Diverse content curation"
                fill
                className="object-cover rounded-md"
              />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Curate Diverse Content</h3>
            <p className="text-gray-300">
              Upload videos, PDFs, articles, embedded content (Google Drive, Box), and external links. Organize them into intuitive collections.
            </p>
          </div>
          {/* Feature 2: Your Brand, Your Library */}
          <div className="flex flex-col items-center text-center p-6 bg-secondary-light rounded-lg shadow-md">
            <div className="relative w-full h-48 mb-6">
              <Image
                src="/jehyun-sung-6U5AEmQIajg-unsplash.jpg"
                alt="Branded knowledge library"
                fill
                className="object-cover rounded-md"
              />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Your Brand, Your Library</h3>
            <p className="text-gray-300">
              Create private, branded knowledge hubs. Customize colors and logos to reflect your organization's unique identity.
            </p>
          </div>
          {/* Feature 3: Share & Engage */}
          <div className="flex flex-col items-center text-center p-6 bg-secondary-light rounded-lg shadow-md">
            <div className="relative w-full h-48 mb-6">
              <Image
                src="/markus-spiske-QozzJpFZ2lg-unsplash.jpg"
                alt="Expert sharing and engagement"
                fill
                className="object-cover rounded-md"
              />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Share & Engage</h3>
            <p className="text-gray-300">
              Empower subject matter experts, professors, and business owners to share their wealth of knowledge with their audience efficiently.
            </p>
          </div>
        </div>
        {/* Additional Feature Sections for 70% image usage */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-12 mt-12">
          {/* Feature 4: Community & Collaboration */}
          <div className="flex flex-col items-center text-center p-6 bg-secondary-light rounded-lg shadow-md">
            <div className="relative w-full h-48 mb-6">
              <Image
                src="/kevin-gonzalez--NXNaE9lu6w-unsplash.jpg"
                alt="Community and collaboration"
                fill
                className="object-cover rounded-md"
              />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Community & Collaboration</h3>
            <p className="text-gray-300">
              Foster interaction and learning within your organization. Facilitate discussions and knowledge exchange among members.
            </p>
          </div>
          {/* Feature 5: Accessible Learning */}
          <div className="flex flex-col items-center text-center p-6 bg-secondary-light rounded-lg shadow-md">
            <div className="relative w-full h-48 mb-6">
              <Image
                src="/lisa-marie-theck-0bbsR7QpUNM-unsplash.jpg"
                alt="Accessible and flexible learning"
                fill
                className="object-cover rounded-md"
              />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Accessible Learning</h3>
            <p className="text-gray-300">
              Provide your audience with easy access to valuable content, anytime, anywhere, fostering continuous learning and development.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 px-4 text-center bg-secondary-dark">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
          Ready to build your knowledge empire?
        </h2>
        <p className="text-lg md:text-xl text-gray-300 mb-8">
          Join a growing community of experts sharing and learning.
        </p>
        <Link
          href="/register"
          className="px-10 py-4 bg-accent text-white rounded-full text-xl font-semibold shadow-lg hover:bg-accent-dark transition-all duration-300"
        >
          Get Started Today
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center bg-secondary text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Knowledge Library SaaS. All rights reserved.</p>
      </footer>
    </div>
  );
}

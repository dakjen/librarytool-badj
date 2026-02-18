'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-red-700">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="mb-4">{error.message}</p>
      <button
        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors mb-4"
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        Try again
      </button>
      <Link href="/dashboard" className="text-blue-500 hover:underline">
        Go to Dashboard
      </Link>
    </div>
  );
}

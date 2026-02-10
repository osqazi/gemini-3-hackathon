'use client';

import { useEffect } from 'react';

export default function AuthErrorPage({ error }: { error?: Error; reset?: () => void }) {
  useEffect(() => {
    // Log the error to an error reporting service
    if (error) {
      console.error('Auth error:', error);
    }
  }, [error]);

  // Note: For Next.js 13+ App Router, error boundaries work differently
  // This page acts as a global error page for auth-related errors
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            An authentication error occurred. Please try signing in again.
          </p>
          <div className="mt-6">
            <a
              href="/auth/signin"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Go back to sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
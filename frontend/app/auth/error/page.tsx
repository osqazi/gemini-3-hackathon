'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    console.error('Auth error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {error === 'AccessDenied'
              ? 'Access denied. Please contact support if this is unexpected.'
              : `Error: ${error || 'An unknown error occurred'}`}
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
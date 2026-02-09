'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    try {
      // Create user via API first with full name using the backend URL directly
      // Ensure we use the correct backend server URL
      const BACKEND_URL = typeof window !== 'undefined'
        ? 'http://localhost:8000'  // Client-side - use hardcoded backend URL
        : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';  // Server-side

      const registerResponse = await fetch(`${BACKEND_URL}/api/v1/user/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          username: fullName, // Pass full name as username
        }),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json().catch(() => ({}));
        setError(errorData.detail || 'Failed to create account');
        return;
      }

      const data = await registerResponse.json();
      if (!data.success) {
        setError(data.message || 'Failed to create account');
        return;
      }

      // Then sign in with the credentials (which will validate the user exists)
      const result = await signIn('credentials', {
        email,
        password,
        redirect: true, // Allow redirect to happen automatically
        callbackUrl: '/chefs-board', // Redirect to Chef's Board page after successful sign up
      });

      if (result?.error) {
        setError(result.error);
      }
      // If no error, the redirect will happen automatically
    } catch (err) {
      setError('An error occurred during sign up');
      console.error(err);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      // Redirect to Chef's Board page after Google sign-up
      await signIn('google', { callbackUrl: '/chefs-board' });
    } catch (err) {
      setError('An error occurred during Google sign up');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Card className="w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto bg-gradient-to-r from-orange-500 to-amber-500 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-plus h-8 w-8 text-white">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
                <line x1="16" x2="16" y1="11" y2="17"/>
                <line x1="8" x2="8" y1="11" y2="17"/>
                <line x1="19" x2="16" y1="14" y2="17"/>
                <line x1="5" x2="8" y1="14" y2="17"/>
              </svg>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Create Account
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Join our culinary community to save your favorite recipes
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm transition-all duration-300">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full py-6 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl"
              >
                Create Account
              </Button>
              <div className="relative my-4 w-full">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-4 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignUp}
                className="w-full py-6 text-base font-medium rounded-xl transition-all duration-300 hover:scale-[1.02] border-2 border-gray-200 hover:border-orange-300 shadow-sm hover:shadow-md"
              >
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </Button>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Already have an Account?{' '}
                <Link
                  href="/auth/signin"
                  className="font-medium text-orange-600 hover:text-orange-500 transition-colors duration-300"
                >
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
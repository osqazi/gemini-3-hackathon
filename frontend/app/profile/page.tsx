'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProfileForm from '@/components/profile/profile-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [initialPreferences, setInitialPreferences] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      loadProfile();
    }
  }, [status]);

  const loadProfile = async () => {
    try {
      // Use the Next.js API route which acts as a proxy to the backend
      const response = await fetch(`/api/v1/profile`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        // Handle the response format from the backend
        const backendPrefs = data.data?.preferences || {};
        setInitialPreferences(backendPrefs);
      } else {
        console.error('Failed to load profile:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (preferences: any) => {
    try {
      setLoading(true);
      
      // Use the Next.js API route which acts as a proxy to the backend
      const response = await fetch(`/api/v1/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ preferences }),
      });

      if (response.ok) {
        // Refresh the profile data after successful save
        await loadProfile();

        toast({
          title: 'Profile Updated',
          description: 'Your cooking preferences have been saved successfully.',
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || 'Failed to update profile');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="text-transparent">Loading...</div>
    </div>;
  }

  if (status === 'unauthenticated') {
    // Redirect to sign in - you might want to implement this
    return <div>Please sign in to access your profile.</div>;
  }

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="text-transparent">Loading...</div>
    </div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Your Cooking Preferences</CardTitle>
          <CardDescription>Customize your recipe preferences for personalized recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProfileForm
            initialPreferences={initialPreferences}
            onSave={handleSaveProfile}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
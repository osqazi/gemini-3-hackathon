'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import UploadDropzone from '@/components/UploadDropzone';
import { analyzePhoto } from '@/lib/api';
import { useFileUpload } from '@/hooks/useFileUpload';
import { saveSession, createNewSession, updateSessionIngredients, updateSessionRecipe, getCurrentSession } from '@/lib/session';
import { ErrorDisplay } from '@/components/ui/error-display';
import { Spinner } from '@/components/ui/spinner';
import { Recipe } from '@/types';
import VoiceInput from '@/components/voice-input';

export default function UserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [observations, setObservations] = useState<string>('');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [refinementInput, setRefinementInput] = useState<string>('');
  const [refinementLoading, setRefinementLoading] = useState<boolean>(false);

  const { uploading, progress, uploadFile, reset } = useFileUpload();

  const handleRefinement = async () => {
    if (!refinementInput.trim() || !recipe) return;

    setRefinementLoading(true);
    setError(null);

    try {
      // Instead of redirecting, we'll keep the refinement in the current session
      // and let the user decide when to move to the chat page

      // Update the current session with the refinement request
      let sessionData = getCurrentSession();
      if (!sessionData) {
        sessionData = createNewSession(ingredients);
        sessionData.id = `user_${userId}`;
      }

      // Add refinement to session data
      if (!sessionData.refinements) {
        sessionData.refinements = [];
      }
      sessionData.refinements.push({
        text: refinementInput,
        timestamp: new Date().toISOString(),
        recipe: recipe
      });

      saveSession(sessionData);

      // Clear the refinement input
      setRefinementInput('');

      // Optionally show a success message
      console.log('Refinement saved to session:', refinementInput);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save refinement';
      setError(errorMessage);
      console.error('Refinement error:', err);
    } finally {
      setRefinementLoading(false);
    }
  };

  // Check authentication and user ID match
  useEffect(() => {
    if (status === 'loading') {
      // Still loading session, do nothing
      return;
    }

    if (status === 'unauthenticated' || !session) {
      // If user is not authenticated, redirect to sign in
      router.push('/auth/signin');
      return;
    }

    // Wait for session to be fully loaded before checking user ID
    if (session && session.user?.id) {
      if (session.user.id !== userId) {
        // Redirect to user's own page if they're trying to access someone else's
        router.push(`/user/${session.user.id}`);
        return;
      }

      // Load user profile data only after authentication is confirmed
      loadUserProfile();
    }
  }, [status, session, userId, router]);

  const loadUserProfile = async () => {
    try {
      // Load user profile from API
      const response = await fetch(`/api/v1/profile`);
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.data);
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  };

  const handleFileUpload = async (file: File) => {
    setError(null);
    setAnalyzing(true);

    try {
      // Upload and analyze the photo
      const result = await uploadFile(file);

      // Update state with results
      setIngredients(result.ingredients);
      setObservations(result.observations || '');

      if (result.recipe) {
        setRecipe(result.recipe);
      }

      // Create or update session with results, using the session ID from the result
      let sessionData = getCurrentSession();
      if (!sessionData || sessionData.id !== result.session_id) {
        sessionData = createNewSession(result.ingredients);
        // Use the session ID from the result to match the chat page expectation
        sessionData.id = result.session_id;
      } else {
        sessionData.ingredients = result.ingredients;
      }

      // Add image analysis data to the session in the expected format
      sessionData.image_analysis = {
        ingredients: result.ingredients,
        observations: result.observations || ''
      };

      if (result.recipe) {
        sessionData.currentRecipe = result.recipe;
      }
      saveSession(sessionData);

      // Redirect to chat page after a short delay to show results
      setTimeout(() => {
        router.push(`/chat/${result.session_id}`);
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze photo';
      setError(errorMessage);
      console.error('Upload error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session || session.user?.id !== userId) {
    return null; // Redirect happens in effect
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome back, {session.user?.name || 'User'}!</CardTitle>
            <p className="text-muted-foreground">
              Access your personalized recipe experience
            </p>
          </CardHeader>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Personal Recipe Assistant</CardTitle>
          <p className="text-muted-foreground">
            Upload a photo of your ingredients and get personalized recipes based on your preferences
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <UploadDropzone
            onFileUpload={handleFileUpload}
            maxFileSize={10}
            acceptedFileTypes={['image/jpeg', 'image/png', 'image/jpg']}
            showCameraOption={true}
          />

          {(uploading || analyzing) && (
            <div className="flex flex-col items-center justify-center py-6">
              <Spinner size="lg" className="mb-2" />
              <p className="text-muted-foreground">
                {uploading ? `Uploading... ${progress}%` : analyzing ? 'Analyzing ingredients...' : 'Processing...'}
              </p>
            </div>
          )}

          {error && (
            <ErrorDisplay
              message={error}
              className="mt-4"
            />
          )}

          {(ingredients.length > 0 || observations) && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold">Analysis Results:</h3>

              {ingredients.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Detected Ingredients:</h4>
                  <div className="flex flex-wrap gap-2">
                    {ingredients.map((ingredient, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {observations && (
                <div>
                  <h4 className="font-medium mb-2">Observations:</h4>
                  <p className="text-muted-foreground">{observations}</p>
                </div>
              )}

              {recipe && (
                <div>
                  <h4 className="font-medium mb-2">Personalized Recipe:</h4>
                  <p className="text-muted-foreground">{recipe.title}</p>
                </div>
              )}

              {/* Recipe Refinement Section */}
              <div className="mt-6 pt-4 border-t">
                <h3 className="text-lg font-semibold mb-3">Refine Your Recipe</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={refinementInput}
                    onChange={(e) => setRefinementInput(e.target.value)}
                    placeholder="Ask for changes, substitutions, or variations..."
                    className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <VoiceInput
                    onTranscript={(transcript) => {
                      setRefinementInput(transcript);
                    }}
                    disabled={refinementLoading}
                  />
                  <Button
                    onClick={handleRefinement}
                    disabled={refinementLoading || !refinementInput.trim()}
                  >
                    {refinementLoading ? <span className="text-transparent">Sending...</span> : 'Send'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* {userProfile && userProfile.preferences && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">Your Preferences:</h4>
              <div className="text-sm text-muted-foreground">
                <p>Diet: {userProfile.preferences.diet || 'Not specified'}</p>
                <p>Allergies: {userProfile.preferences.allergies?.join(', ') || 'None'}</p>
                <p>Skill Level: {userProfile.preferences.skill_level || 'Not specified'}</p>
              </div>
            </div>
          )} */}
        </CardContent>
      </Card>
    </div>
  );
}
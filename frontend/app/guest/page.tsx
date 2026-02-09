'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import UploadDropzone from '@/components/UploadDropzone';
import { analyzePhoto } from '@/lib/api';
import { useFileUpload } from '@/hooks/useFileUpload';
import { saveSession, createNewSession, updateSessionIngredients, updateSessionRecipe } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorDisplay } from '@/components/ui/error-display';
import { Spinner } from '@/components/ui/spinner';
import { Recipe } from '@/types';
import VoiceInput from '@/components/voice-input';

const GuestPage = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [observations, setObservations] = useState<string>('');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
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
      let sessionData = createNewSession(ingredients);
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

      // Create or update session with results
      let session = createNewSession(result.ingredients);
      session.id = result.session_id; // Use the session ID from the result

      // Add image analysis data to the session in the expected format
      session.image_analysis = {
        ingredients: result.ingredients,
        observations: result.observations || ''
      };

      if (result.recipe) {
        session.currentRecipe = result.recipe;
      }
      saveSession(session);

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

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">RecipeRAG - AI Recipe Generator</CardTitle>
          <p className="text-muted-foreground">
            Upload a photo of your ingredients and get personalized recipes powered by Gemini AI
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
                  <h4 className="font-medium mb-2">Initial Recipe:</h4>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default GuestPage;
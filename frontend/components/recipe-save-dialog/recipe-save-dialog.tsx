'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { Recipe } from '@/types';
import { saveRecipe } from '@/lib/api';

interface RecipeSaveDialogProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function RecipeSaveDialog({ recipe, isOpen, onClose }: RecipeSaveDialogProps) {
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState<1 | 2 | null>(null); // Step 1: save, Step 2: share
  const [saveAnswer, setSaveAnswer] = useState<boolean | null>(null);
  const [shareAnswer, setShareAnswer] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      // Only show dialog if user is authenticated
      if (status === 'authenticated' && recipe) {
        setCurrentStep(1); // Start with question 1
        setSaveAnswer(null);
        setShareAnswer(null);
        setError(null);
      } else {
        // If user is not authenticated or no recipe, close the dialog immediately
        onClose();
      }
    } else {
      setCurrentStep(null);
      setSaveAnswer(null);
      setShareAnswer(null);
    }
  }, [isOpen, status, recipe, onClose]);

  const handleSaveAnswer = (answer: boolean) => {
    setSaveAnswer(answer);

    if (!answer) {
      // If user says No to saving, close dialog immediately
      setTimeout(() => {
        setCurrentStep(null);
        onClose();
      }, 300);
      return;
    }

    // Move to step 2: ask about sharing
    setCurrentStep(2);
  };

  const handleShareAnswer = async (answer: boolean) => {
    setShareAnswer(answer);
    setIsLoading(true);
    setError(null);

    try {
      // Save the recipe with the public status based on user's answer
      if (recipe) {
        await saveRecipe(recipe, answer, session?.user?.dbId);
      }

      // Close dialog after successful save
      setTimeout(() => {
        setCurrentStep(null);
        onClose();
      }, 300);
    } catch (err) {
      console.error('Error saving recipe:', err);
      setError(err instanceof Error ? err.message : 'Failed to save recipe');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if user is not authenticated or dialog is not open
  // Don't check for recipe here since it might be populated after dialog opens
  if (status !== 'authenticated' || !isOpen) {
    return null;
  }

  // Don't render if no recipe is available
  if (!recipe) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 1
              ? "Do you want to save this Recipe?"
              : currentStep === 2
                ? "Do you want to share this Recipe on Chef's Board?"
                : "Recipe Action"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => {
              if (currentStep === 1) {
                handleSaveAnswer(true);
              } else if (currentStep === 2) {
                handleShareAnswer(true);
              }
            }}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Processing...' : 'Yes'}
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              if (currentStep === 1) {
                handleSaveAnswer(false);
              } else if (currentStep === 2) {
                handleShareAnswer(false);
              }
            }}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Processing...' : 'No'}
          </Button>
        </div>

        {isLoading && (
          <div className="text-center text-sm text-transparent text-muted-foreground mt-2">
            Saving your recipe...
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
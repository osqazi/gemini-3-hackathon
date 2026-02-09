'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Recipe } from '@/types';
import { Clock, Users, ChefHat, Utensils } from 'lucide-react';

interface RecipeRendererProps {
  recipe: Recipe;
  className?: string;
  userId?: string;
  onShareToChefsBoard?: (recipeId: string) => void;
}

const RecipeRenderer: React.FC<RecipeRendererProps> = ({ recipe, className, userId, onShareToChefsBoard }) => {
  // Determine if the recipe is public (shared to Chef's Board)
  const isPublic = recipe.public || (recipe as any).public === true;
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <CardTitle className="text-2xl">{recipe.title}</CardTitle>
          <div className="flex flex-wrap gap-2">
            {recipe.difficulty && (
              <Badge variant="secondary">{recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}</Badge>
            )}
            {recipe.servings && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {recipe.servings} servings
              </Badge>
            )}
            {recipe.cookingTime && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {recipe.cookingTime} min
              </Badge>
            )}
            {!isPublic && userId && (
              <button 
                onClick={() => onShareToChefsBoard && onShareToChefsBoard(recipe.id)}
                className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs rounded-full hover:from-orange-600 hover:to-amber-600 transition-all"
              >
                Share to Chef's Board
              </button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Ingredients Section */}
        <section>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Utensils className="h-5 w-5" />
            Ingredients
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recipe.ingredients?.map((ingredient, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                <span>{ingredient}</span>
              </li>
            ))}
          </ul>
        </section>

        <Separator />

        {/* Instructions Section */}
        <section>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <ChefHat className="h-5 w-5" />
            Instructions
          </h3>
          <ol className="space-y-3">
            {recipe.instructions?.map((instruction, index) => (
              <li key={index} className="flex">
                <span className="font-semibold mr-3 min-w-[24px] text-primary">{index + 1}.</span>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  className="prose prose-sm max-w-none"
                >
                  {instruction}
                </ReactMarkdown>
              </li>
            ))}
          </ol>
        </section>

        {/* Reasoning Section */}
        {recipe.reasoning && (
          <>
            <Separator />
            <section>
              <h3 className="text-lg font-semibold mb-3">Reasoning</h3>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                className="prose prose-sm max-w-none text-muted-foreground"
              >
                {recipe.reasoning}
              </ReactMarkdown>
            </section>
          </>
        )}

        {/* Variations Section */}
        {recipe.variations && recipe.variations.length > 0 && (
          <>
            <Separator />
            <section>
              <h3 className="text-lg font-semibold mb-3">Variations</h3>
              <ul className="list-disc pl-5 space-y-1">
                {recipe.variations.map((variation, index) => (
                  <li key={index}>{variation}</li>
                ))}
              </ul>
            </section>
          </>
        )}

        {/* Nutrition Info Section */}
        {recipe.nutritionInfo && (
          <>
            <Separator />
            <section>
              <h3 className="text-lg font-semibold mb-3">Nutrition Info</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {recipe.nutritionInfo.calories !== undefined && (
                  <div className="text-center p-2 bg-muted rounded">
                    <div className="text-2xl font-bold">{recipe.nutritionInfo.calories}</div>
                    <div className="text-xs text-muted-foreground">Calories</div>
                  </div>
                )}
                {recipe.nutritionInfo.protein !== undefined && (
                  <div className="text-center p-2 bg-muted rounded">
                    <div className="text-2xl font-bold">{recipe.nutritionInfo.protein}g</div>
                    <div className="text-xs text-muted-foreground">Protein</div>
                  </div>
                )}
                {recipe.nutritionInfo.carbs !== undefined && (
                  <div className="text-center p-2 bg-muted rounded">
                    <div className="text-2xl font-bold">{recipe.nutritionInfo.carbs}g</div>
                    <div className="text-xs text-muted-foreground">Carbs</div>
                  </div>
                )}
                {recipe.nutritionInfo.fat !== undefined && (
                  <div className="text-center p-2 bg-muted rounded">
                    <div className="text-2xl font-bold">{recipe.nutritionInfo.fat}g</div>
                    <div className="text-xs text-muted-foreground">Fat</div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RecipeRenderer;
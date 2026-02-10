'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DownloadIcon, ClockIcon, UtensilsIcon, ChefHatIcon, XIcon } from 'lucide-react';
import { motion } from 'framer-motion';
// Replaced file-saver with native browser API
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface RecipeCardProps {
  id: string;
  title: string;
  description?: string;
  ingredients: Array<{
    name: string;
    quantity: string;
    preparation?: string;
  }>;
  instructions: string[];
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  nutritionInfo?: {
    caloriesPerServing?: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
    fiberG?: number;
  };
  tipsVariations?: string[];
  author?: string;
  generatedAt?: string;
  tags?: string[];
  customizationNotes?: string[];
  images?: string[];
  onClose?: () => void;
}

export default function RecipeCard({
  id,
  title,
  description,
  ingredients,
  instructions,
  prepTime,
  cookTime,
  totalTime,
  servings,
  difficulty,
  nutritionInfo,
  tipsVariations,
  author = 'AI Generated',
  generatedAt,
  tags,
  customizationNotes,
  images,
  onClose
}: RecipeCardProps) {
  const exportToPDF = async () => {
    try {
      // Create a new jsPDF instance
      const pdf = new jsPDF();

      // Define page constants
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 20;
      const maxContentY = pageHeight - 20; // Leave some space at the bottom

      let currentY = 30;

      // Add title
      pdf.setFontSize(22);
      pdf.text(title, margin, currentY);
      currentY += 15;

      // Add subtitle
      pdf.setFontSize(12);
      pdf.text(`Author: ${author}`, margin, currentY);
      currentY += 8;
      if (generatedAt) {
        pdf.text(`Generated: ${new Date(generatedAt).toLocaleDateString()}`, margin, currentY);
        currentY += 8;
      }

      // Add description if available
      if (description) {
        // Check if we need a new page after adding title/subtitle
        if (currentY > maxContentY - 20) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.setFontSize(14);
        pdf.text('Description:', margin, currentY);
        currentY += 10;
        pdf.setFontSize(12);

        // Split description into multiple lines if needed
        const splitDesc = pdf.splitTextToSize(description, 170);
        (splitDesc as string[]).forEach((line) => {
          if (currentY > maxContentY - 10) {
            pdf.addPage();
            currentY = margin;
          }
          pdf.text(line, margin, currentY);
          currentY += 8;
        });
        currentY += 10; // Add spacing after description
      }

      // Add ingredients section
      if (currentY > maxContentY - 20) {
        pdf.addPage();
        currentY = margin;
      }

      pdf.setFontSize(14);
      pdf.text('Ingredients:', margin, currentY);
      pdf.setFontSize(12);
      currentY += 10;

      ingredients.forEach((ingredient, index) => {
        const ingredientText = `${ingredient.quantity} ${ingredient.name}${ingredient.preparation ? ` (${ingredient.preparation})` : ''}`;
        const wrappedLines = pdf.splitTextToSize(`• ${ingredientText}`, 170);
        (wrappedLines as string[]).forEach((line) => {
          if (currentY > maxContentY - 10) {
            pdf.addPage();
            currentY = margin;
          }
          pdf.text(line, margin + 5, currentY);
          currentY += 8;
        });
      });
      currentY += 15; // Add spacing after ingredients

      // Add timing and serving info
      if (currentY > maxContentY - 15) {
        pdf.addPage();
        currentY = margin;
      }

      const timingInfo = [];
      if (prepTime) timingInfo.push(`Prep: ${prepTime} min`);
      if (cookTime) timingInfo.push(`Cook: ${cookTime} min`);
      if (totalTime) timingInfo.push(`Total: ${totalTime} min`);
      if (servings) timingInfo.push(`Servings: ${servings}`);
      if (difficulty) timingInfo.push(`Difficulty: ${difficulty}`);

      if (timingInfo.length > 0) {
        const timingText = timingInfo.join(' | ');
        const wrappedTiming = pdf.splitTextToSize(timingText, 170);
        (wrappedTiming as string[]).forEach((line) => {
          if (currentY > pdf.internal.pageSize.height - 20) {
            pdf.addPage();
            currentY = margin;
          }
          pdf.text(line, margin, currentY);
          currentY += 8;
        });
      }
      currentY += 15; // Add spacing after timing info

      // Add instructions section
      if (currentY > pageHeight - 20) {
        pdf.addPage();
        currentY = margin;
      }

      pdf.setFontSize(14);
      pdf.text('Instructions:', margin, currentY);
      pdf.setFontSize(12);
      currentY += 10;

      instructions.forEach((instruction, index) => {
        const wrappedLines = pdf.splitTextToSize(`${index + 1}. ${instruction}`, 170);
        (wrappedLines as string[]).forEach((line) => {
          if (currentY > pageHeight - 20) {
            pdf.addPage();
            currentY = margin;
          }
          pdf.text(line, margin + 5, currentY);
          currentY += 8;
        });
        currentY += 2; // Small gap between instructions
      });
      currentY += 15; // Add spacing after instructions

      // Add nutrition info if available
      if (nutritionInfo) {
        if (currentY > pageHeight - 20) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.setFontSize(14);
        pdf.text('Nutrition Info (per serving):', margin, currentY);
        pdf.setFontSize(12);
        currentY += 10;

        const nutritionLines = [];
        if (nutritionInfo.caloriesPerServing) nutritionLines.push(`Calories: ${nutritionInfo.caloriesPerServing}`);
        if (nutritionInfo.proteinG) nutritionLines.push(`Protein: ${nutritionInfo.proteinG}g`);
        if (nutritionInfo.carbsG) nutritionLines.push(`Carbs: ${nutritionInfo.carbsG}g`);
        if (nutritionInfo.fatG) nutritionLines.push(`Fat: ${nutritionInfo.fatG}g`);
        if (nutritionInfo.fiberG) nutritionLines.push(`Fiber: ${nutritionInfo.fiberG}g`);

        nutritionLines.forEach((line) => {
          const wrappedLines = pdf.splitTextToSize(`• ${line}`, 170);
          (wrappedLines as string[]).forEach((line) => {
            if (currentY > pageHeight - 20) {
              pdf.addPage();
              currentY = margin;
            }
            pdf.text(line, margin + 5, currentY);
            currentY += 8;
          });
        });
        currentY += 15; // Add spacing after nutrition info
      }

      // Add tips and variations if available
      if (tipsVariations && tipsVariations.length > 0) {
        if (currentY > pageHeight - 20) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.setFontSize(14);
        pdf.text('Tips & Variations:', margin, currentY);
        pdf.setFontSize(12);
        currentY += 10;

        tipsVariations.forEach((tip) => {
          const wrappedLines = pdf.splitTextToSize(`• ${tip}`, 170);
          (wrappedLines as string[]).forEach((line) => {
            if (currentY > pageHeight - 20) {
              pdf.addPage();
              currentY = margin;
            }
            pdf.text(line, margin + 5, currentY);
            currentY += 8;
          });
        });
        currentY += 15; // Add spacing after tips
      }

      // Add customization notes if available
      if (customizationNotes && customizationNotes.length > 0) {
        if (currentY > pageHeight - 20) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.setFontSize(14);
        pdf.text('Customization Notes:', margin, currentY);
        pdf.setFontSize(12);
        currentY += 10;

        customizationNotes.forEach((note) => {
          const wrappedLines = pdf.splitTextToSize(`• ${note}`, 170);
          (wrappedLines as string[]).forEach((line) => {
            if (currentY > pageHeight - 20) {
              pdf.addPage();
              currentY = margin;
            }
            pdf.text(line, margin + 5, currentY);
            currentY += 8;
          });
        });
      }

      // Save the PDF using native browser functionality
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '_')}_Recipe.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export recipe to PDF. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mx-auto relative"
    >
      <Card className="recipe-card-bg border-0 shadow-xl bg-gradient-to-b from-white to-muted/20">
        {/* Fixed Top Bar - Positioned as an overlay */}
        <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200 rounded-t-lg px-4 py-3">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent break-words">
                {title}
              </CardTitle>
              {author && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center break-words">
                  <ChefHatIcon className="h-4 w-4 mr-1 text-orange-500 flex-shrink-0" />
                  <span className="break-words">{author}</span>
                </p>
              )}
            </div>
            {onClose && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="rounded-full h-8 w-8 p-0 flex-shrink-0"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="pt-2"> {/* Add padding to account for fixed header */}
          <div className="relative">
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-orange-200 to-amber-200 rounded-full opacity-20 blur-xl"></div>
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-r from-amber-200 to-yellow-200 rounded-full opacity-20 blur-xl"></div>
          </div>

          <CardHeader className="pb-3 relative z-10">
          <div>
            {/* Title and author are now in the fixed top bar */}
          </div>
          
          {description && (
            <p className="text-muted-foreground mt-3 text-lg leading-relaxed">{description}</p>
          )}
        </CardHeader>

        <CardContent className="space-y-2">
          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-3 py-1 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border border-orange-200 rounded-full">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Timing and Servings */}
          {(prepTime || cookTime || totalTime || servings || difficulty) && (
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground bg-muted/30 rounded-xl p-3">
              {prepTime && (
                <div className="flex items-center bg-background/50 rounded-lg px-3 py-2 shadow-sm">
                  <ClockIcon className="h-4 w-4 mr-2 text-orange-500" />
                  <span>Prep: {prepTime} min</span>
                </div>
              )}
              {cookTime && (
                <div className="flex items-center bg-background/50 rounded-lg px-3 py-2 shadow-sm">
                  <ClockIcon className="h-4 w-4 mr-2 text-amber-500" />
                  <span>Cook: {cookTime} min</span>
                </div>
              )}
              {totalTime && (
                <div className="flex items-center bg-background/50 rounded-lg px-3 py-2 shadow-sm">
                  <ClockIcon className="h-4 w-4 mr-2 text-orange-500" />
                  <span>Total: {totalTime} min</span>
                </div>
              )}
              {servings && (
                <div className="flex items-center bg-background/50 rounded-lg px-3 py-2 shadow-sm">
                  <UtensilsIcon className="h-4 w-4 mr-2 text-orange-500" />
                  <span>Serves: {servings}</span>
                </div>
              )}
              {difficulty && (
                <div className="flex items-center bg-background/50 rounded-lg px-3 py-2 shadow-sm">
                  <ChefHatIcon className="h-4 w-4 mr-2 text-orange-500" />
                  <span>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span>
                </div>
              )}
            </div>
          )}

          {/* Ingredients Section */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Ingredients</h3>
            <ScrollArea className="h-40 w-full rounded-md border p-4">
              <ul className="space-y-2">
                {ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      <span className="font-medium">{ingredient.quantity}</span> {ingredient.name}
                      {ingredient.preparation && (
                        <span className="text-muted-foreground"> ({ingredient.preparation})</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>

          {/* Instructions Section */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Instructions</h3>
            <ol className="space-y-3">
              {instructions.map((step, index) => (
                <li key={index} className="flex">
                  <span className="font-semibold mr-2 min-w-[24px]">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Nutrition Info */}
          {nutritionInfo && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Nutrition Info (per serving)</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {nutritionInfo.caloriesPerServing !== undefined && (
                  <div className="text-center p-2 bg-secondary rounded">
                    <div className="text-2xl font-bold">{nutritionInfo.caloriesPerServing}</div>
                    <div className="text-xs text-muted-foreground">Calories</div>
                  </div>
                )}
                {nutritionInfo.proteinG !== undefined && (
                  <div className="text-center p-2 bg-secondary rounded">
                    <div className="text-2xl font-bold">{nutritionInfo.proteinG}g</div>
                    <div className="text-xs text-muted-foreground">Protein</div>
                  </div>
                )}
                {nutritionInfo.carbsG !== undefined && (
                  <div className="text-center p-2 bg-secondary rounded">
                    <div className="text-2xl font-bold">{nutritionInfo.carbsG}g</div>
                    <div className="text-xs text-muted-foreground">Carbs</div>
                  </div>
                )}
                {nutritionInfo.fatG !== undefined && (
                  <div className="text-center p-2 bg-secondary rounded">
                    <div className="text-2xl font-bold">{nutritionInfo.fatG}g</div>
                    <div className="text-xs text-muted-foreground">Fat</div>
                  </div>
                )}
                {nutritionInfo.fiberG !== undefined && (
                  <div className="text-center p-2 bg-secondary rounded">
                    <div className="text-2xl font-bold">{nutritionInfo.fiberG}g</div>
                    <div className="text-xs text-muted-foreground">Fiber</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tips & Variations */}
          {tipsVariations && tipsVariations.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Tips & Variations</h3>
              <ul className="space-y-2">
                {tipsVariations.map((tip, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Customization Notes */}
          {customizationNotes && customizationNotes.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Customization Notes</h3>
              <ul className="space-y-2">
                {customizationNotes.map((note, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6">
          <div className="text-sm text-muted-foreground">
            {generatedAt ? `Generated: ${new Date(generatedAt).toLocaleString()}` : 'AI Generated Recipe'}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPDF}
            className="rounded-xl border-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export as PDF
          </Button>
        </CardFooter>
        </div> {/* Close the inner relative div */}
        
      </Card>
    </motion.div>
  );
}
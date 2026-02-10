import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText, FileDown, Copy, Check } from 'lucide-react';
import { Recipe } from '@/types';
import { exportRecipe } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';

interface ExportButtonProps {
  recipe: Recipe;
  className?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ recipe, className }) => {
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'markdown' | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExport = async (format: 'pdf' | 'markdown') => {
    if (!recipe) return;

    setExporting(true);
    setExportFormat(format);
    setCopied(false);

    try {
      if (format === 'markdown') {
        // For markdown, we'll copy to clipboard instead of downloading
        const markdownContent = generateMarkdown(recipe);
        await navigator.clipboard.writeText(markdownContent);
        setCopied(true);

        // Reset copied status after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      } else {
        // For PDF, call the API
        const result = await exportRecipe(recipe.id, format);

        if (result.success && result.url) {
          // Create a temporary link and trigger download
          const link = document.createElement('a');
          link.href = result.url;
          link.download = `${recipe.title.replace(/\s+/g, '_')}.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          throw new Error('Export failed');
        }
      }
    } catch (error) {
      console.error(`Error exporting recipe as ${format}:`, error);
      alert(`Failed to export recipe as ${format}`);
    } finally {
      setExporting(false);
      setExportFormat(null);
    }
  };

  const generateMarkdown = (recipe: Recipe): string => {
    let markdown = `# ${recipe.title}\n\n`;

    if (recipe.ingredients && recipe.ingredients.length > 0) {
      markdown += "## Ingredients\n\n";
      recipe.ingredients.forEach(ingredient => {
        markdown += `- ${ingredient}\n`;
      });
      markdown += "\n";
    }

    if (recipe.instructions && recipe.instructions.length > 0) {
      markdown += "## Instructions\n\n";
      recipe.instructions.forEach((instruction, index) => {
        markdown += `${index + 1}. ${instruction}\n\n`;
      });
    }

    if (recipe.reasoning) {
      markdown += "## Reasoning\n\n";
      markdown += `${recipe.reasoning}\n\n`;
    }

    if (recipe.tipsVariations && recipe.tipsVariations.length > 0) {
      markdown += "## Variations\n\n";
      recipe.tipsVariations.forEach(variation => {
        markdown += `- ${variation}\n`;
      });
    }

    return markdown;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={className}>
          {exporting ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export Recipe
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={exporting}>
          {exporting && exportFormat === 'pdf' ? (
            <Spinner size="sm" className="mr-2" />
          ) : (
            <FileDown className="h-4 w-4 mr-2" />
          )}
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('markdown')} disabled={exporting}>
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2 text-green-500" />
              Copied to Clipboard!
            </>
          ) : exporting && exportFormat === 'markdown' ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Copying...
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy as Markdown
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButton;
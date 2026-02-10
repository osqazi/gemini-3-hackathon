import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorDetails } from '@/lib/error-handling';

interface ErrorFallbackProps {
  error: ErrorDetails;
  resetError: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-destructive">Something went wrong!</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{error.userFriendlyMessage || error.message}</p>
        <Button onClick={resetError}>
          Try Again
        </Button>
      </CardContent>
    </Card>
  );
};
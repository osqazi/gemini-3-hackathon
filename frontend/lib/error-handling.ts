import { toast } from '@/hooks/use-toast';

// Define error types
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  VOICE_RECOGNITION_ERROR = 'VOICE_RECOGNITION_ERROR',
  IMAGE_UPLOAD_ERROR = 'IMAGE_UPLOAD_ERROR',
  RECIPE_GENERATION_ERROR = 'RECIPE_GENERATION_ERROR',
  PROFILE_UPDATE_ERROR = 'PROFILE_UPDATE_ERROR',
  PDF_EXPORT_ERROR = 'PDF_EXPORT_ERROR',
  OFFLINE_ERROR = 'OFFLINE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Error details interface
export interface ErrorDetails {
  type: ErrorType;
  message: string;
  code?: string;
  timestamp: Date;
  details?: any;
  userFriendlyMessage?: string;
}

// Error handler class
export class ErrorHandler {
  static handle(error: any, context?: string): ErrorDetails {
    // Determine error type and create appropriate error details
    const errorDetails: ErrorDetails = {
      type: ErrorType.UNKNOWN_ERROR,
      message: error.message || 'An unknown error occurred',
      timestamp: new Date(),
      details: error
    };

    // Identify specific error types
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorDetails.type = ErrorType.NETWORK_ERROR;
      errorDetails.userFriendlyMessage = 'Network connection failed. Please check your internet connection.';
    } else if (error.name === 'TimeoutError') {
      errorDetails.type = ErrorType.TIMEOUT_ERROR;
      errorDetails.userFriendlyMessage = 'Request timed out. Please try again.';
    } else if (error.status === 401) {
      errorDetails.type = ErrorType.AUTHENTICATION_ERROR;
      errorDetails.userFriendlyMessage = 'Authentication expired. Please log in again.';
    } else if (error.status === 403) {
      errorDetails.type = ErrorType.AUTHORIZATION_ERROR;
      errorDetails.userFriendlyMessage = 'Access denied. You do not have permission to perform this action.';
    } else if (error.status === 404) {
      errorDetails.type = ErrorType.NOT_FOUND_ERROR;
      errorDetails.userFriendlyMessage = 'The requested resource was not found.';
    } else if (error.status === 429) {
      errorDetails.type = ErrorType.RATE_LIMIT_ERROR;
      errorDetails.userFriendlyMessage = 'Too many requests. Please wait before trying again.';
    } else if (error.status >= 500) {
      errorDetails.type = ErrorType.SERVER_ERROR;
      errorDetails.userFriendlyMessage = 'Server error. Please try again later.';
    } else if (error.name === 'SpeechRecognitionError') {
      errorDetails.type = ErrorType.VOICE_RECOGNITION_ERROR;
      errorDetails.userFriendlyMessage = 'Voice recognition failed. Please try speaking again or type your input.';
    } else if (error.name === 'ValidationError') {
      errorDetails.type = ErrorType.VALIDATION_ERROR;
      errorDetails.userFriendlyMessage = error.message || 'Invalid input provided.';
    } else if (error.name === 'OfflineError') {
      errorDetails.type = ErrorType.OFFLINE_ERROR;
      errorDetails.userFriendlyMessage = 'You are currently offline. Some features may not be available.';
    }

    // Add context if provided
    if (context) {
      errorDetails.message = `${context}: ${errorDetails.message}`;
    }

    // Log the error
    console.error('Error caught:', errorDetails);

    return errorDetails;
  }

  static showErrorToast(errorDetails: ErrorDetails): void {
    toast({
      title: 'Error Occurred',
      description: errorDetails.userFriendlyMessage || errorDetails.message,
      variant: 'destructive',
    });
  }

  static showWarningToast(message: string): void {
    toast({
      title: 'Warning',
      description: message,
      variant: 'default',
    });
  }

  static showSuccessToast(message: string): void {
    toast({
      title: 'Success',
      description: message,
    });
  }
}

// Specific error classes
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class OfflineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OfflineError';
  }
}

// Higher-order function to wrap async operations with error handling
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string,
  options: { showErrorToast?: boolean; rethrow?: boolean } = {}
): T {
  const { showErrorToast = true, rethrow = true } = options;

  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorDetails = ErrorHandler.handle(error, context);

      if (showErrorToast) {
        ErrorHandler.showErrorToast(errorDetails);
      }

      if (rethrow) {
        throw error;
      }

      return undefined as unknown as ReturnType<T>;
    }
  }) as T;
}

// Validation utilities
export class Validator {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): boolean {
    // At least 8 characters, one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  static validateProfileData(profileData: any): ErrorDetails[] {
    const errors: ErrorDetails[] = [];

    // Validate dietary preferences
    if (profileData.diet && typeof profileData.diet !== 'string') {
      errors.push({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Diet must be a string',
        timestamp: new Date(),
        userFriendlyMessage: 'Diet preference must be text.'
      });
    }

    // Validate allergies
    if (profileData.allergies && !Array.isArray(profileData.allergies)) {
      errors.push({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Allergies must be an array',
        timestamp: new Date(),
        userFriendlyMessage: 'Allergies must be a list of items.'
      });
    }

    // Validate skill level
    if (profileData.skill_level && typeof profileData.skill_level !== 'string') {
      errors.push({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Skill level must be a string',
        timestamp: new Date(),
        userFriendlyMessage: 'Cooking skill level must be text.'
      });
    }

    // Validate age
    if (profileData.age !== undefined && profileData.age !== null) {
      const age = Number(profileData.age);
      if (isNaN(age) || age < 0 || age > 150) {
        errors.push({
          type: ErrorType.VALIDATION_ERROR,
          message: 'Age must be between 0 and 150',
          timestamp: new Date(),
          userFriendlyMessage: 'Please enter a valid age between 0 and 150.'
        });
      }
    }

    return errors;
  }

  static validateRecipeData(recipeData: any): ErrorDetails[] {
    const errors: ErrorDetails[] = [];

    if (!recipeData.title || typeof recipeData.title !== 'string' || recipeData.title.trim().length === 0) {
      errors.push({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Recipe must have a valid title',
        timestamp: new Date(),
        userFriendlyMessage: 'Recipe must have a title.'
      });
    }

    if (!recipeData.ingredients || !Array.isArray(recipeData.ingredients) || recipeData.ingredients.length === 0) {
      errors.push({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Recipe must have ingredients',
        timestamp: new Date(),
        userFriendlyMessage: 'Recipe must include ingredients.'
      });
    }

    if (!recipeData.instructions || !Array.isArray(recipeData.instructions) || recipeData.instructions.length === 0) {
      errors.push({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Recipe must have instructions',
        timestamp: new Date(),
        userFriendlyMessage: 'Recipe must include cooking instructions.'
      });
    }

    return errors;
  }
}

// Error boundary component interface
export interface ErrorBoundaryState {
  hasError: boolean;
  error: ErrorDetails | null;
}

// Fallback UI for error boundaries
export const ErrorFallback = ({ error, resetError }: { error: ErrorDetails; resetError: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <h2 className="text-2xl font-bold text-destructive mb-4">Something went wrong!</h2>
      <p className="text-muted-foreground mb-4">{error.userFriendlyMessage || error.message}</p>
      <button
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
        onClick={resetError}
      >
        Try Again
      </button>
    </div>
  );
};
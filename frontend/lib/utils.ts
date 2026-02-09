import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format file size in bytes to human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string (e.g., "1.2 MB", "512 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate if a file is of a valid image type
 * @param file - File object to validate
 * @returns Boolean indicating if file is valid image type
 */
export function isValidImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  return validTypes.includes(file.type);
}

/**
 * Validate if a file is within the allowed size limit
 * @param file - File object to validate
 * @param maxFileSizeMB - Maximum file size in MB
 * @returns Boolean indicating if file size is valid
 */
export function isValidFileSize(file: File, maxFileSizeMB: number): boolean {
  const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;
  return file.size <= maxFileSizeBytes;
}

/**
 * Generate a UUID v4 string
 * @returns A randomly generated UUID string
 */
export function generateUUID(): string {
  // Modern browsers support crypto.randomUUID
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

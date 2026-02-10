'use client';

import { usePathname } from 'next/navigation';
import LoadingBar from '@/components/ui/loading-bar';

export default function DynamicLoadingBar() {
  const pathname = usePathname();

  // Don't show loading bar on error pages to avoid SSR issues
  if (pathname?.includes('/error') || pathname === '/not-found' || pathname?.includes('_not-found')) {
    return null;
  }

  return <LoadingBar />;
}
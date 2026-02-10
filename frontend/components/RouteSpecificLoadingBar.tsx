'use client';

import { usePathname } from 'next/navigation';
import LoadingBar from '@/components/ui/loading-bar';
import { useEffect, useState } from 'react';

export default function RouteSpecificLoadingBar() {
  const pathname = usePathname();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Only render the loading bar on specific routes, not on error/not-found pages
    const validRoutes = [
      '/',
      '/chat',
      '/chefs-board',
      '/guest',
      '/profile',
      '/user/',
      '/main/',
      '/chat/'
    ];
    
    const isValidRoute = validRoutes.some(route => 
      pathname === route || pathname.startsWith(route)
    );
    
    const isNotErrorOrNotFound = !pathname.includes('/error') && 
                                 pathname !== '/not-found' && 
                                 !pathname.includes('_not-found');
    
    setShouldRender(isValidRoute && isNotErrorOrNotFound);
  }, [pathname]);

  if (!shouldRender) {
    return null;
  }

  return <LoadingBar />;
}
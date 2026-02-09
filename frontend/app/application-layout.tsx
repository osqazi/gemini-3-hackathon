'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/navbar';

export default function ApplicationLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Pages where navbar should NOT be shown
  const hideNavbarPaths = ['/', '/auth/signin', '/auth/signup'];
  const shouldHideNavbar = hideNavbarPaths.some(path => pathname === path || pathname.startsWith(path + '/'));

  return (
    <>
      {!shouldHideNavbar && <Navbar />}
      <main className={!shouldHideNavbar ? "flex-grow" : ""}>
        {children}
      </main>
    </>
  );
}
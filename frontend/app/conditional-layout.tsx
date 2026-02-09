'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';

export default function ConditionalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Pages where navbar should NOT be shown
  const hideNavbarPaths = ['/', '/auth/signin', '/auth/signup'];
  const shouldShowNavbar = !hideNavbarPaths.some(path => pathname === path || pathname.startsWith(path + '/'));

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <main className={shouldShowNavbar ? "flex-grow" : ""}>
        {children}
      </main>
      <Footer />
    </>
  );
}
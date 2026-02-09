import { ReactNode } from 'react';
import Navbar from '@/components/navbar';

export default function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}
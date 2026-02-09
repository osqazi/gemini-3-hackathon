// This is a shared layout for pages that need the navbar
import { ReactNode } from 'react';
import Navbar from '@/components/navbar';

type Props = {
  children: ReactNode;
};

export default function AppLayout({ children }: Props) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}
import { ReactNode } from 'react';
import SessionProvider from '@/components/auth/SessionProvider';
import { GuestModeProvider } from '@/components/auth/guest-mode';

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SessionProvider>
      <GuestModeProvider>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </GuestModeProvider>
    </SessionProvider>
  );
}
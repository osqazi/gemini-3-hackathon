import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import SessionProvider from '@/components/auth/SessionProvider';
import { GuestModeProvider } from '@/components/auth/guest-mode';
import ConditionalLayout from './conditional-layout';
import Footer from '@/components/footer';
import LoadingBar from '@/components/ui/loading-bar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RecipeRAG - AI-Powered Recipe Generator',
  description: 'Upload your ingredients and get personalized recipes powered by Gemini AI',
};

// Root layout will wrap content with conditional navbar
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "min-h-screen bg-background font-sans antialiased")}>
        <SessionProvider>
          <GuestModeProvider>
            <div className="flex flex-col min-h-screen bg-background">
              <LoadingBar />
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
              {/* Footer is included in ConditionalLayout to avoid duplication */}
            </div>
          </GuestModeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
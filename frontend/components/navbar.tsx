'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ChefHat,
  User,
  LogOut,
  Camera,
  MessageCircle,
  Menu
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';

import { useState } from 'react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      // Sign out from NextAuth
      await import('next-auth/react').then(({ signOut }) => {
        signOut({ redirect: true, callbackUrl: '/' });
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <nav className="border-b sticky top-0 z-50 bg-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            href={status === 'authenticated' && session?.user ? '/chefs-board' : '/'}
            className="flex items-center space-x-2"
          >
            <div className="relative w-16 h-8 overflow-visible">
              <img src="/images/app.ico" alt="Logo" className="h-16 w-16 absolute top-0 left-0 transform -translate-y-2 cursor-pointer" /> {/* Doubled from h-8 w-8, shifted down to overflow from bottom */}
            </div>
            <span className="text-xl font-bold cursor-pointer">RecipeRAG</span>
          </Link>

          {/* Navigation Links - Centered on desktop */}
          <div className="hidden md:flex items-center space-x-6 absolute left-1/2 transform -translate-x-1/2">
            <Link href="/chefs-board" className="flex items-center space-x-1 text-sm font-medium hover:text-orange-500 transition-colors">
              <ChefHat className="h-4 w-4" />
              <span>Chef's Board</span>
            </Link>
            <Link
              href={status === 'authenticated' && session?.user ? `/user/${session.user.id}` : `/guest`}
              className="flex items-center space-x-1 text-sm font-medium hover:text-orange-500 transition-colors"
            >
              <Camera className="h-4 w-4" />
              <span>Snap2Cook</span>
            </Link>
            <Link href="/chat" className="flex items-center space-x-1 text-sm font-medium hover:text-orange-500 transition-colors">
              <MessageCircle className="h-4 w-4" />
              <span>RecipeRAG AI Assistant</span>
            </Link>
          </div>

          {/* Mobile menu button - shown on small screens */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="p-2">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md p-0">
                  <div className="p-4">
                    <div className="flex flex-col space-y-4">
                      {/* Mobile Navigation Links */}
                      <Link
                        href="/chefs-board"
                        className="flex items-center space-x-2 text-base font-medium hover:text-orange-500 transition-colors py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <ChefHat className="h-5 w-5" />
                        <span>Chef's Board</span>
                      </Link>
                      <Link
                        href={status === 'authenticated' && session?.user ? `/user/${session.user.id}` : `/guest`}
                        className="flex items-center space-x-2 text-base font-medium hover:text-orange-500 transition-colors py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Camera className="h-5 w-5" />
                        <span>Snap2Cook</span>
                      </Link>
                      <Link
                        href="/chat"
                        className="flex items-center space-x-2 text-base font-medium hover:text-orange-500 transition-colors py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <MessageCircle className="h-5 w-5" />
                        <span>RecipeRAG AI Assistant</span>
                      </Link>

                      {/* User Menu or Guest Indicator for Mobile */}
                      {status === 'authenticated' && session?.user ? (
                        // Authenticated user menu
                        <div className="pt-4 border-t">
                          <div className="flex items-center space-x-3 mb-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={session.user.image || ''} alt={session.user.name || 'User'} />
                              <AvatarFallback>
                                {session.user.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{session.user.name}</p>
                              <p className="text-sm text-gray-500">Signed in</p>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <Link
                              href={`/user/${session.user.id}`}
                              className="flex items-center space-x-2 text-base font-medium hover:text-orange-500 transition-colors py-2"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <User className="h-5 w-5" />
                              <span>Dashboard</span>
                            </Link>
                            <Link
                              href="/profile"
                              className="flex items-center space-x-2 text-base font-medium hover:text-orange-500 transition-colors py-2"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <User className="h-5 w-5" />
                              <span>Your Cooking Preferences</span>
                            </Link>
                            <button
                              onClick={() => {
                                handleSignOut();
                                setMobileMenuOpen(false);
                              }}
                              className="flex items-center space-x-2 text-left text-base font-medium hover:text-orange-500 transition-colors py-2 w-full"
                            >
                              <LogOut className="h-5 w-5" />
                              <span>Sign out</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Guest indicator with sign in/up links
                        <div className="pt-4 border-t">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                            <div>
                              <p className="font-medium">Guest</p>
                              <p className="text-sm text-gray-500">Not signed in</p>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                router.push('/auth/signin');
                                setMobileMenuOpen(false);
                              }}
                            >
                              Sign In
                            </Button>
                            <Button
                              className="w-full"
                              onClick={() => {
                                router.push('/auth/signup');
                                setMobileMenuOpen(false);
                              }}
                            >
                              Sign Up
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Desktop User Menu - Shown on medium and larger screens */}
            <div className="hidden md:flex items-center space-x-4">
              {status === 'authenticated' && session?.user ? (
                // Authenticated user menu
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 p-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user.image || ''} alt={session.user.name || 'User'} />
                        <AvatarFallback>
                          {session.user.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="ml-2 hidden sm:inline-block">{session.user.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/user/${session.user.id}`} className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Your Cooking Preferences
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                // Guest indicator with sign in/up links
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">Guest</span>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => router.push('/auth/signin')}>
                      Sign In
                    </Button>
                    <Button size="sm" onClick={() => router.push('/auth/signup')}>
                      Sign Up
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
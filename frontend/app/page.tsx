'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { ArrowRight, Sparkles, ChefHat, Zap, Heart, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { HeroBackground, IngredientGrid, PageBackground } from '@/components/ui/theme-images';

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Handle redirects based on session status
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      // If user is authenticated, redirect to Chef's Board page
      router.push('/chefs-board');
    }
  }, [status, session, router]);

  const handleTryAsGuest = () => {
    router.push('/guest');
  };

  const handleSignIn = () => {
    router.push('/auth/signin');
  };

  const handleSignUp = () => {
    router.push('/auth/signup');
  };

  const features = [
    {
      icon: <ChefHat className="h-8 w-8" />,
      title: "AI-Powered Recipes",
      description: "Get personalized recipes based on your ingredients and preferences"
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: "Smart Suggestions",
      description: "AI understands dietary restrictions and health conditions"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Quick & Easy",
      description: "Generate recipes in seconds with our multimodal AI"
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Health Conscious",
      description: "Nutrition insights and healthy alternatives included"
    }
  ];

  // Show landing page only for unauthenticated users
  if (status === 'authenticated' && session?.user?.id) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#2d2d2d', backgroundImage: 'none' }}> {/* Dark grey background */}
      <PageBackground />
      {/* Top right corner sign in */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          size="sm"
          className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg flex items-center"
          onClick={handleSignIn}
        >
          <LogIn className="mr-2 h-4 w-4" />
          Already Member? Please Login
        </Button>
      </div>
      {/* Hero Section */}
      <section className="pt-12 pb-8 md:pt-16 md:pb-10 lg:pt-20 lg:pb-12" style={{ backgroundColor: 'transparent', minHeight: '700px' }}> {/* Reduced bottom margin by ~70% */}
        <div className="container mx-auto px-4">
          <HeroBackground>
            <div className="text-center max-w-4xl mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                  Snap, Share & Savor: <span className="text-orange-300">AI-Powered Recipes</span> with Global Chefs
                </h1>
                <p className="text-xl text-orange-100 mb-10 max-w-2xl mx-auto">
                  Upload ingredients or cuisine images, get AI-crafted recipes instantly. Join our community of chefs sharing culinary masterpieces worldwide.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col sm:flex-row justify-center gap-4"
              >
                <Button
                  size="lg"
                  className="px-8 py-6 text-lg bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg"
                  onClick={handleTryAsGuest}
                >
                  Cook as Guest
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  className="px-8 py-6 text-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg"
                  onClick={() => router.push('/chefs-board')}
                >
                  Explore Chef's Board
                </Button>
                <Button
                  size="lg"
                  className="px-8 py-6 text-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg"
                  onClick={handleSignUp}
                >
                  Join Now. Its Free!
                </Button>
              </motion.div>
            </div>
          </HeroBackground>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16" style={{ backgroundColor: 'transparent', color: 'inherit' }}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 text-white">Amazing Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-center text-orange-500 mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Ingredient Grid Visualization */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-center mb-8 text-white">Visualize Your Ingredients</h3>
            <div className="max-w-4xl mx-auto">
              <IngredientGrid className="w-full" />
            </div>
          </div>

          {/* Chef's Board Community Section */}
          <div className="mt-20">
            <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-2xl p-8 md:p-12 shadow-2xl">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-6">
                    <ChefHat className="h-16 w-16 text-white" />
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">Join Our Culinary Community</h3>
                  <p className="text-lg text-white/90 mb-6 max-w-2xl">
                    Discover thousands of delicious recipes shared by chefs worldwide on our Chef's Board.
                    Explore, save, and get inspired by the creativity of our culinary community.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                    <Button
                      size="lg"
                      className="px-8 py-4 text-lg bg-white text-orange-600 hover:bg-gray-100 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      onClick={() => router.push('/chefs-board')}
                    >
                      Explore Chef's Board
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16" style={{ backgroundColor: 'rgba(50,50,50,0.85)', color: 'white' }}>
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4 text-white">Ready to Cook Like a Pro?</h2>
            <p className="text-lg text-gray-200 mb-8">
              Join thousands of home cooks who are already creating amazing meals with our AI chef.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                size="lg"
                className="px-8 py-6 text-lg bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleTryAsGuest}
              >
                Start Cooking Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              {!session && (
                <Button
                  size="lg"
                  className="px-8 py-6 text-lg bg-white hover:bg-gray-100 text-gray-900"
                  onClick={handleSignUp}
                >
                  Create Account
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
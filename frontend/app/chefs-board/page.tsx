'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChefHatIcon, ClockIcon, UtensilsIcon, FlameIcon, StarIcon, SearchIcon, FilterIcon } from 'lucide-react';
import RecipeCard from '@/components/recipe-card/recipe-card';
import Link from 'next/link';

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: Array<{
    name: string;
    quantity: string;
    preparation?: string;
  }>;
  instructions: string[];
  prep_time?: number;
  cook_time?: number;
  total_time?: number;
  servings?: number;
  difficulty?: string;
  nutrition_info?: {
    caloriesPerServing?: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
    fiberG?: number;
  };
  tips_variations?: string[];
  author?: string;
  generated_at: string;
  updated_at?: string;
  images?: string[];
  tags?: string[];
  customization_notes?: string[];
  source_recipe_id?: string;
  rag_context?: any;
  user_id: string;
  username: string; // Added username field
}

export default function ChefsBoardPage() {
  const { data: session, status } = useSession();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyMyRecipes, setShowOnlyMyRecipes] = useState(false); // Toggle for showing only user's recipes

  // Statistics state - these will hold the total counts from the database
  const [totalRecipesCount, setTotalRecipesCount] = useState(0);
  const [easyRecipesCount, setEasyRecipesCount] = useState(0);
  const [quickMealsCount, setQuickMealsCount] = useState(0);
  const [chefsContributingCount, setChefsContributingCount] = useState(0);
  const [sortBy, setSortBy] = useState('generated_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Function to handle sort changes and reset pagination
  const handleSortChange = (value: string) => {
    setSortBy(value);
    // Reset to first page when sort changes
    setPage(1);
    setHasMore(true);
    setRecipes([]); // Clear existing recipes to avoid duplicates
    fetchPublicRecipes(1, false, showOnlyMyRecipes);
  };

  const handleSortOrderChange = (value: string) => {
    setSortOrder(value);
    // Reset to first page when sort order changes
    setPage(1);
    setHasMore(true);
    setRecipes([]); // Clear existing recipes to avoid duplicates
    fetchPublicRecipes(1, false, showOnlyMyRecipes);
  };
  const [filters, setFilters] = useState({
    difficulty: 'all', // Changed from empty string to 'all' to avoid empty value error
    minTime: '',
    maxTime: '',
    servings: ''
  });

  // Fetch public recipes from backend with pagination
  const fetchPublicRecipes = async (pageNum: number, append = false, useMyRecipesFilter = showOnlyMyRecipes) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const offset = (pageNum - 1) * 20;
      const queryParams = new URLSearchParams({
        sort_by: sortBy,
        sort_order: sortOrder,
        search: searchTerm,
        limit: '20',
        offset: offset.toString()
      });

      // Add user-specific filter if showing only user's recipes and user is authenticated
      if (useMyRecipesFilter && session?.user?.name) {
        queryParams.append('username', session.user.name);
      } else {
        // When not showing only user's recipes, make sure we don't send an empty username
        // This is already handled by the condition above, but just to be sure
      }

      // Add filters if they exist
      if (filters.difficulty && filters.difficulty !== 'all') queryParams.append('difficulty', filters.difficulty);
      if (filters.minTime) queryParams.append('min_time', filters.minTime);
      if (filters.maxTime) queryParams.append('max_time', filters.maxTime);
      if (filters.servings) queryParams.append('servings', filters.servings);

      // Use the backend API URL directly
      const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      let response;
      let data;
      
      try {
        response = await fetch(`${BACKEND_URL}/api/v1/public-recipes?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          credentials: 'include', // Include credentials (cookies) for cross-origin requests
        });

        // Check if we got a response at all
        if (!response.ok) {
          // Try to get error details
          const errorText = await response.text().catch(() => '');
          console.error('API Error:', errorText);
          
          // Check if this looks like an HTML error page (e.g., 404 page)
          if (errorText.includes('<!DOCTYPE html>') || errorText.includes('<html')) {
            console.error('Received HTML error page instead of API response - Hugging Face deployment may not have this endpoint');
            
            // Provide empty data as fallback for Hugging Face deployment
            if (!append) setRecipes([]);
            setHasMore(false);
            return;
          }
          
          throw new Error(`Failed to fetch recipes: ${response.status} ${response.statusText}`);
        }

        data = await response.json();

        // Check if response data is valid
        if (!data || !Array.isArray(data.recipes)) {
          console.error('Invalid response format from API:', data);
          if (!append) setRecipes([]); // Clear recipes if this was the initial load
          setHasMore(false);
          return;
        }
      } catch (error: any) {
        // Handle CORS errors and network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          console.error('CORS or network error when fetching recipes:', error);
          
          // Provide empty data as fallback for CORS/network issues
          if (!append) setRecipes([]);
          setHasMore(false);
          return;
        }
        
        console.error('Unexpected error fetching recipes:', error);
        throw error;
      }

      if (append) {
        setRecipes(prev => {
          // Create a set of existing recipe IDs to avoid duplicates
          const existingIds = new Set(prev.map(recipe => recipe.id));
          // Filter out any recipes that already exist in the current list
          const newRecipes = data.recipes.filter((recipe: Recipe) => !existingIds.has(recipe.id));
          return [...prev, ...newRecipes];
        });
      } else {
        setRecipes(data.recipes || []);
      }

      // If we received fewer recipes than requested, we've reached the end
      if (data.recipes && data.recipes.length < 20) {
        setHasMore(false);
      } else if (data.recipes) {
        setHasMore(true);
      }
    } catch (error) {
      console.error('Error fetching public recipes:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };


  // Handle infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000 && // Trigger 1000px before bottom
        !loadingMore &&
        hasMore
      ) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPublicRecipes(nextPage, true, showOnlyMyRecipes);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, page, fetchPublicRecipes]);

  // Function to fetch total statistics from the database
  const fetchStatistics = async () => {
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      let response;
      let stats;
      
      try {
        response = await fetch(`${BACKEND_URL}/api/v1/public-recipes/stats`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          credentials: 'include', // Include credentials (cookies) for cross-origin requests
        });

        if (response.ok) {
          // Check if response is JSON or HTML error page
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            console.error('Received HTML error page instead of API response for stats - Hugging Face deployment may not have this endpoint');
            // Fallback to calculating from loaded recipes
            setTotalRecipesCount(recipes.length);
            setEasyRecipesCount(recipes.filter(r => r.difficulty === 'easy').length);
            setQuickMealsCount(recipes.filter(r => r.total_time && r.total_time <= 30).length);
            setChefsContributingCount(new Set(recipes.map(r => r.user_id)).size);
            return;
          }
          
          stats = await response.json();

          // Validate the stats response
          if (stats && typeof stats === 'object') {
            setTotalRecipesCount(stats.total_recipes || 0);
            setEasyRecipesCount(stats.easy_recipes || 0);
            setQuickMealsCount(stats.quick_meals || 0);
            setChefsContributingCount(stats.chefs_contributing || 0);
          } else {
            console.error('Invalid stats response from API:', stats);
            // Fallback to calculating from loaded recipes
            setTotalRecipesCount(recipes.length);
            setEasyRecipesCount(recipes.filter(r => r.difficulty === 'easy').length);
            setQuickMealsCount(recipes.filter(r => r.total_time && r.total_time <= 30).length);
            setChefsContributingCount(new Set(recipes.map(r => r.user_id)).size);
          }
        } else {
          // Check if we got an HTML error page
          const errorText = await response.text();
          if (errorText.includes('<!DOCTYPE html>') || errorText.includes('<html')) {
            console.error('Received HTML error page instead of API response for stats - Hugging Face deployment may not have this endpoint');
          } else {
            console.warn('Stats endpoint not available, falling back to calculated values');
          }
          
          // Fallback to calculating from loaded recipes if stats endpoint doesn't exist
          setTotalRecipesCount(recipes.length);
          setEasyRecipesCount(recipes.filter(r => r.difficulty === 'easy').length);
          setQuickMealsCount(recipes.filter(r => r.total_time && r.total_time <= 30).length);
          setChefsContributingCount(new Set(recipes.map(r => r.user_id)).size);
        }
      } catch (error: any) {
        // Handle CORS errors and network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          console.error('CORS or network error when fetching stats:', error);
          
          // Fallback to calculating from loaded recipes for CORS/network issues
          setTotalRecipesCount(recipes.length);
          setEasyRecipesCount(recipes.filter(r => r.difficulty === 'easy').length);
          setQuickMealsCount(recipes.filter(r => r.total_time && r.total_time <= 30).length);
          setChefsContributingCount(new Set(recipes.map(r => r.user_id)).size);
          return;
        }
        
        console.error('Unexpected error fetching stats:', error);
        // Fallback to calculating from loaded recipes
        setTotalRecipesCount(recipes.length);
        setEasyRecipesCount(recipes.filter(r => r.difficulty === 'easy').length);
        setQuickMealsCount(recipes.filter(r => r.total_time && r.total_time <= 30).length);
        setChefsContributingCount(new Set(recipes.map(r => r.user_id)).size);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Fallback to calculating from loaded recipes
      setTotalRecipesCount(recipes.length);
      setEasyRecipesCount(recipes.filter(r => r.difficulty === 'easy').length);
      setQuickMealsCount(recipes.filter(r => r.total_time && r.total_time <= 30).length);
      setChefsContributingCount(new Set(recipes.map(r => r.user_id)).size);
    }
  };

  // Initial fetch when filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setRecipes([]); // Clear existing recipes to avoid duplicates
    fetchPublicRecipes(1, false, showOnlyMyRecipes);
  }, [searchTerm, sortBy, sortOrder, filters, showOnlyMyRecipes]);

  // Fetch statistics when the page loads or when recipes change
  useEffect(() => {
    fetchStatistics();
  }, []);

  // Update statistics when recipes change (for fallback calculations)
  useEffect(() => {
    if (recipes.length > 0) {
      // Only update if stats haven't been loaded from the API yet (still 0)
      if (totalRecipesCount === 0) {
        setTotalRecipesCount(recipes.length);
        setEasyRecipesCount(recipes.filter(r => r.difficulty === 'easy').length);
        setQuickMealsCount(recipes.filter(r => r.total_time && r.total_time <= 30).length);
        setChefsContributingCount(new Set(recipes.map(r => r.user_id)).size);
      }
    }
  }, [recipes, totalRecipesCount]);

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const closeRecipeDetail = () => {
    setSelectedRecipe(null);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    // Reset to first page when filters change
    setPage(1);
    setHasMore(true);
    setRecipes([]); // Clear existing recipes to avoid duplicates
    fetchPublicRecipes(1, false, showOnlyMyRecipes);
  };

  // Format time in a readable way
  const formatTime = (time?: number) => {
    if (!time) return 'N/A';
    if (time < 60) return `${time} min`;
    return `${Math.floor(time / 60)}h ${time % 60}m`;
  };

  // Format difficulty badge
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 pb-12">
      {/* Header with title and Cook Now button */}
      <div className="bg-white shadow-sm sticky top-14 z-40"> {/* Changed from top-0 to top-14 to account for navbar height, increased z-index to ensure it stays on top */}
        <div className="container mx-auto px-4 py-4"> {/* Reduced padding to make it slimmer */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Chef's Board</h1>
              <h2 className="text-sm font-medium text-muted-foreground hidden md:block">Discover delicious recipes shared by our community</h2>
            </div>
            <div className="flex gap-2">
              <Link href="/chat">
                <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm h-10 rounded-xl transition-all duration-300 hover:scale-105 shadow-md">
                  <ChefHatIcon className="h-4 w-4 mr-2" />
                  Cook Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics Section - Based on total recipes in database */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="text-3xl font-bold" id="total-recipes-stat">{totalRecipesCount}</div>
            <div className="text-sm opacity-90 font-medium">Total Recipes</div>
            <div className="mt-2 h-1 bg-white/30 rounded-full">
              <div className="h-1 bg-white rounded-full" style={{ width: `${Math.min(100, (totalRecipesCount / 50) * 100)}%` }}></div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="text-3xl font-bold" id="easy-recipes-stat">{easyRecipesCount}</div>
            <div className="text-sm opacity-90 font-medium">Easy Recipes</div>
            <div className="mt-2 h-1 bg-white/30 rounded-full">
              <div className="h-1 bg-white rounded-full" style={{ width: `${Math.min(100, (easyRecipesCount / 20) * 100)}%` }}></div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="text-3xl font-bold" id="quick-meals-stat">{quickMealsCount}</div>
            <div className="text-sm opacity-90 font-medium">Quick Meals</div>
            <div className="mt-2 h-1 bg-white/30 rounded-full">
              <div className="h-1 bg-white rounded-full" style={{ width: `${Math.min(100, (quickMealsCount / 15) * 100)}%` }}></div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="text-3xl font-bold" id="chefs-contributing-stat">{chefsContributingCount}</div>
            <div className="text-sm opacity-90 font-medium">Chefs Contributing</div>
            <div className="mt-2 h-1 bg-white/30 rounded-full">
              <div className="h-1 bg-white rounded-full" style={{ width: `${Math.min(100, (chefsContributingCount / 100) * 100)}%` }}></div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8">
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
                {/* Search Input - spans 2 columns on larger screens */}
                <div className="sm:col-span-2 lg:col-span-3 xl:col-span-2">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search recipes..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        // Reset to first page when search term changes
                        setPage(1);
                        setHasMore(true);
                        setRecipes([]); // Clear existing recipes to avoid duplicates
                        fetchPublicRecipes(1, false, showOnlyMyRecipes);
                      }}
                      className="w-full pl-10 py-3 rounded-xl border-0 bg-background/50 shadow-sm focus:ring-2 focus:ring-orange-500 focus:shadow-md transition-all duration-300 h-12"
                    />
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="py-3 rounded-xl border-0 bg-background/50 shadow-sm focus:ring-2 focus:ring-orange-500 focus:shadow-md transition-all duration-300 h-12">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generated_at">Newest First</SelectItem>
                      <SelectItem value="title">Title A-Z</SelectItem>
                      <SelectItem value="total_time">Time</SelectItem>
                      <SelectItem value="difficulty">Difficulty</SelectItem>
                      <SelectItem value="servings">Servings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Order */}
                <div>
                  <Select value={sortOrder} onValueChange={handleSortOrderChange}>
                    <SelectTrigger className="py-3 rounded-xl border-0 bg-background/50 shadow-sm focus:ring-2 focus:ring-orange-500 focus:shadow-md transition-all duration-300 h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Descending</SelectItem>
                      <SelectItem value="asc">Ascending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filter by Difficulty */}
                <div>
                  <Select value={filters.difficulty} onValueChange={(value) => handleFilterChange('difficulty', value)}>
                    <SelectTrigger className="py-3 rounded-xl border-0 bg-background/50 shadow-sm focus:ring-2 focus:ring-orange-500 focus:shadow-md transition-all duration-300 h-12">
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Difficulties</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filter by Time Range */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="number"
                      placeholder="Min time"
                      value={filters.minTime}
                      onChange={(e) => handleFilterChange('minTime', e.target.value)}
                      className="w-full py-3 rounded-xl border-0 bg-background/50 shadow-sm focus:ring-2 focus:ring-orange-500 focus:shadow-md transition-all duration-300 h-12 text-sm"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Max time"
                      value={filters.maxTime}
                      onChange={(e) => handleFilterChange('maxTime', e.target.value)}
                      className="w-full py-3 rounded-xl border-0 bg-background/50 shadow-sm focus:ring-2 focus:ring-orange-500 focus:shadow-md transition-all duration-300 h-12 text-sm"
                    />
                  </div>
                </div>

                {/* Filter by Servings */}
                <div>
                  <Input
                    type="number"
                    placeholder="Servings"
                    value={filters.servings}
                    onChange={(e) => handleFilterChange('servings', e.target.value)}
                    className="w-full py-3 rounded-xl border-0 bg-background/50 shadow-sm focus:ring-2 focus:ring-orange-500 focus:shadow-md transition-all duration-300 h-12"
                  />
                </div>

                {/* Switch for showing only user's recipes - only show if user is authenticated */}
                <div className="flex items-center justify-center">
                  {status === 'authenticated' ? (
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs sm:text-sm ${!showOnlyMyRecipes ? 'text-orange-500 font-medium' : 'text-muted-foreground'}`}>All</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={showOnlyMyRecipes}
                          onClick={() => {
                            const newShowOnlyMyRecipes = !showOnlyMyRecipes;
                            setShowOnlyMyRecipes(newShowOnlyMyRecipes);
                            // Reset to first page when toggling
                            setPage(1);
                            setHasMore(true);
                            setRecipes([]); // Clear existing recipes to avoid duplicates
                            // Pass the new state value directly to ensure correct filtering
                            fetchPublicRecipes(1, false, newShowOnlyMyRecipes);
                          }}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                            showOnlyMyRecipes
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                              : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              showOnlyMyRecipes ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`text-xs sm:text-sm ${showOnlyMyRecipes ? 'text-orange-500 font-medium' : 'text-muted-foreground'}`}>Mine</span>
                      </div>
                    </div>
                  ) : (
                    // Empty div to maintain grid layout when toggle is hidden
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-xs sm:text-sm text-muted-foreground">All</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        )}

        {/* No Recipes Found */}
        {!loading && recipes.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto bg-gradient-to-r from-orange-100 to-amber-100 w-24 h-24 rounded-full flex items-center justify-center mb-6">
              <ChefHatIcon className="mx-auto h-12 w-12 text-orange-400" />
            </div>
            <h3 className="mt-4 text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">No recipes found</h3>
            <p className="mt-2 text-lg text-muted-foreground">Be the first to share a recipe on Chef's Board!</p>
            <div className="mt-8">
              <Link href="/chat">
                <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-lg py-6 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  Create Your First Recipe
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Recipe Grid */}
        {!loading && recipes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recipes.map((recipe, index) => (
              <Card
                key={`${recipe.id}-${index}`} // Use both id and index to ensure uniqueness
                className={`cursor-pointer transform transition-all duration-500 hover:scale-105 overflow-hidden bg-gradient-to-b from-white to-muted/30 ${
                  session?.user?.name === recipe.username 
                    ? 'animate-glow border-2 border-orange-400' 
                    : 'border-0 shadow-md hover:shadow-lg'
                } ${index === 0 ? 'animate-fade-in-up' : ''}`}
                style={{ animationDelay: `${index * 100}ms`, zIndex: 0 }} // Ensure recipe cards are behind header
                onClick={() => handleRecipeClick(recipe)}
              >
                <div className="relative overflow-hidden">
                  {/* User's recipe tag in top-left corner */}
                  {session?.user?.name === recipe.username && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md">
                        My Recipe
                      </span>
                    </div>
                  )}
                  
                  {/* Recipe Image Placeholder */}
                  <div className="h-40 bg-gradient-to-r from-orange-100 to-amber-100 flex items-center justify-center">
                    <div className="text-center">
                      <ChefHatIcon className="h-12 w-12 text-orange-400 mx-auto mb-2" />
                      <span className="text-xs text-muted-foreground">Recipe Image</span>
                    </div>
                  </div>

                  {/* Difficulty Badge Overlay */}
                  {recipe.difficulty && (
                    <div className="absolute top-3 right-3">
                      <Badge className={`${getDifficultyColor(recipe.difficulty)} text-xs px-2 py-1 shadow-md`}>
                        {recipe.difficulty}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardHeader className="pb-3 pt-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold line-clamp-2 text-foreground">{recipe.title}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{recipe.description}</p>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {/* Author and Date */}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>by {recipe.username}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(recipe.generated_at).toLocaleDateString()}</span>
                    </div>

                    {/* Timing Info */}
                    <div className="flex flex-wrap gap-3 text-sm">
                      {recipe.total_time && (
                        <div className="flex items-center text-muted-foreground">
                          <ClockIcon className="h-4 w-4 mr-1 text-orange-500" />
                          <span>{formatTime(recipe.total_time)}</span>
                        </div>
                      )}

                      {recipe.servings && (
                        <div className="flex items-center text-muted-foreground">
                          <UtensilsIcon className="h-4 w-4 mr-1 text-orange-500" />
                          <span>Serves {recipe.servings}</span>
                        </div>
                      )}
                    </div>

                    {/* Nutrition Info */}
                    {recipe.nutrition_info?.caloriesPerServing && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <FlameIcon className="h-4 w-4 mr-1 text-orange-500" />
                        <span>{recipe.nutrition_info.caloriesPerServing} cal/serving</span>
                      </div>
                    )}

                    {/* Tags */}
                    {recipe.tags && recipe.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {recipe.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                            {tag}
                          </Badge>
                        ))}
                        {recipe.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs px-2 py-1">
                            +{recipe.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="flex justify-center items-center py-8">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
              <p className="text-transparent text-muted-foreground">Loading more recipes...</p>
            </div>
          </div>
        )}

        {/* End of Results Message */}
        {!loading && !loadingMore && !hasMore && recipes.length > 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center bg-gradient-to-r from-orange-100 to-amber-100 p-4 rounded-full mb-4">
              <ChefHatIcon className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">You've reached the end!</h3>
            <p className="text-muted-foreground mt-2">All recipes have been loaded.</p>
          </div>
        )}

      </div>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/50 to-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border-0 shadow-xl">
            <Button
              variant="outline"
              size="sm"
              onClick={closeRecipeDetail}
              className="absolute top-4 right-4 rounded-full h-10 w-10 p-0 bg-white/80 backdrop-blur-sm shadow-md hover:bg-red-50 hover:text-red-600 transition-all duration-300 z-10"
            >
              <span className="text-lg font-bold">×</span>
            </Button>

            <RecipeCard
              id={selectedRecipe.id}
              title={selectedRecipe.title}
              description={selectedRecipe.description}
              ingredients={selectedRecipe.ingredients || []}
              instructions={selectedRecipe.instructions || []}
              prepTime={selectedRecipe.prep_time}
              cookTime={selectedRecipe.cook_time}
              totalTime={selectedRecipe.total_time}
              servings={selectedRecipe.servings}
              difficulty={selectedRecipe.difficulty as any}
              nutritionInfo={selectedRecipe.nutrition_info}
              tipsVariations={selectedRecipe.tips_variations}
              author={`By ${selectedRecipe.username}`}
              generatedAt={selectedRecipe.generated_at}
              tags={selectedRecipe.tags}
              customizationNotes={selectedRecipe.customization_notes}
              images={selectedRecipe.images}
              onClose={() => setSelectedRecipe(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
export async function GET() {
  try {
    // For the sample data, we'll calculate statistics based on the sample recipes
    // In a real application, this would come from the database
    
    // Import the sample recipes from the public-recipes route
    // Since we can't directly import from another route file, we'll recreate the logic
    const sampleRecipes = [
      {
        id: '1',
        title: 'Classic Margherita Pizza',
        difficulty: 'medium',
        total_time: 27,
        servings: 2,
        user_id: 'user1',
        username: 'Mario Rossi'
      },
      {
        id: '2',
        title: 'Chicken Tikka Masala',
        difficulty: 'medium',
        total_time: 45,
        servings: 4,
        user_id: 'user2',
        username: 'Priya Sharma'
      },
      {
        id: '3',
        title: 'Caesar Salad',
        difficulty: 'easy',
        total_time: 10,
        servings: 2,
        user_id: 'user3',
        username: 'Antoine Dubois'
      },
      {
        id: '4',
        title: 'Chocolate Chip Cookies',
        difficulty: 'easy',
        total_time: 25,
        servings: 24,
        user_id: 'user4',
        username: 'Emma Johnson'
      },
      {
        id: '5',
        title: 'Vegetable Stir Fry',
        difficulty: 'easy',
        total_time: 23,
        servings: 3,
        user_id: 'user5',
        username: 'Kenji Tanaka'
      }
    ];

    // Calculate statistics
    const totalRecipes = sampleRecipes.length;
    const easyRecipes = sampleRecipes.filter(r => r.difficulty === 'easy').length;
    const quickMeals = sampleRecipes.filter(r => r.total_time && r.total_time <= 30).length;
    const uniqueChefs = new Set(sampleRecipes.map(r => r.user_id)).size;

    const stats = {
      total_recipes: totalRecipes,
      easy_recipes: easyRecipes,
      quick_meals: quickMeals,
      chefs_contributing: uniqueChefs
    };

    return Response.json(stats);
  } catch (error) {
    console.error('Error fetching public recipes stats:', error);
    
    // Return default stats in case of error
    return Response.json({
      total_recipes: 0,
      easy_recipes: 0,
      quick_meals: 0,
      chefs_contributing: 0
    });
  }
}
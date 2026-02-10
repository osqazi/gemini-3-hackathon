import { NextRequest } from 'next/server';

// Sample public recipes data
const sampleRecipes = [
  {
    id: '1',
    title: 'Classic Margherita Pizza',
    description: 'A timeless Italian classic with fresh tomatoes, mozzarella, and basil.',
    ingredients: [
      { name: 'Pizza dough', quantity: '1 ball' },
      { name: 'Tomato sauce', quantity: '1/2 cup' },
      { name: 'Fresh mozzarella', quantity: '8 oz', preparation: 'sliced' },
      { name: 'Fresh basil leaves', quantity: '1/4 cup' },
      { name: 'Olive oil', quantity: '2 tbsp' },
      { name: 'Salt', quantity: 'to taste' }
    ],
    instructions: [
      'Preheat oven to 475°F (245°C).',
      'Roll out pizza dough on floured surface to 12-inch circle.',
      'Transfer to pizza stone or baking sheet.',
      'Spread tomato sauce evenly over dough, leaving 1-inch border.',
      'Add mozzarella slices and drizzle with olive oil.',
      'Season with salt.',
      'Bake for 10-12 minutes until crust is golden and cheese is bubbly.',
      'Top with fresh basil before serving.'
    ],
    prep_time: 15,
    cook_time: 12,
    total_time: 27,
    servings: 2,
    difficulty: 'medium',
    nutrition_info: {
      caloriesPerServing: 350,
      proteinG: 15,
      carbsG: 45,
      fatG: 12,
      fiberG: 2
    },
    tips_variations: [
      'Use San Marzano tomatoes for authentic flavor',
      'Add a pinch of oregano for extra Italian taste'
    ],
    author: 'Chef Mario',
    generated_at: '2024-01-15T10:30:00Z',
    user_id: 'user1',
    username: 'Mario Rossi',
    tags: ['Italian', 'Vegetarian', 'Quick Meal'],
    customization_notes: 'Can add mushrooms or olives as toppings'
  },
  {
    id: '2',
    title: 'Chicken Tikka Masala',
    description: 'Creamy and flavorful Indian dish with tender chicken in spiced tomato sauce.',
    ingredients: [
      { name: 'Chicken breast', quantity: '1 lb', preparation: 'cut into cubes' },
      { name: 'Yogurt', quantity: '1/2 cup' },
      { name: 'Ginger-garlic paste', quantity: '1 tbsp' },
      { name: 'Garam masala', quantity: '1 tsp' },
      { name: 'Cumin', quantity: '1 tsp' },
      { name: 'Coriander', quantity: '1 tsp' },
      { name: 'Tomato puree', quantity: '1 can (15 oz)' },
      { name: 'Heavy cream', quantity: '1/2 cup' },
      { name: 'Onion', quantity: '1 large', preparation: 'finely chopped' },
      { name: 'Garlic', quantity: '3 cloves', preparation: 'minced' },
      { name: 'Ginger', quantity: '1 tbsp', preparation: 'minced' }
    ],
    instructions: [
      'Marinate chicken in yogurt, ginger-garlic paste, and half the spices for 1 hour.',
      'Cook marinated chicken in a skillet until browned, about 6-8 minutes.',
      'In same pan, sauté onion until translucent.',
      'Add garlic, ginger, and remaining spices; cook 1 minute.',
      'Add tomato puree and simmer 10 minutes.',
      'Stir in cream and cooked chicken.',
      'Simmer 5 more minutes until sauce thickens.',
      'Serve with basmati rice or naan.'
    ],
    prep_time: 20,
    cook_time: 25,
    total_time: 45,
    servings: 4,
    difficulty: 'medium',
    nutrition_info: {
      caloriesPerServing: 420,
      proteinG: 35,
      carbsG: 15,
      fatG: 25,
      fiberG: 3
    },
    tips_variations: [
      'Use Greek yogurt for thicker marinade',
      'Adjust spice level to your preference'
    ],
    author: 'Chef Priya',
    generated_at: '2024-01-16T09:15:00Z',
    user_id: 'user2',
    username: 'Priya Sharma',
    tags: ['Indian', 'Spicy', 'Dinner'],
    customization_notes: 'Can substitute tofu for vegetarian version'
  },
  {
    id: '3',
    title: 'Caesar Salad',
    description: 'Crisp romaine lettuce with creamy Caesar dressing and croutons.',
    ingredients: [
      { name: 'Romaine lettuce', quantity: '2 heads', preparation: 'washed and chopped' },
      { name: 'Parmesan cheese', quantity: '1/2 cup', preparation: 'shredded' },
      { name: 'Croutons', quantity: '1 cup' },
      { name: 'Caesar dressing', quantity: '1/3 cup' },
      { name: 'Lemon juice', quantity: '2 tbsp' },
      { name: 'Garlic', quantity: '2 cloves', preparation: 'minced' },
      { name: 'Anchovy paste', quantity: '1 tsp' },
      { name: 'Olive oil', quantity: '2 tbsp' },
      { name: 'Black pepper', quantity: 'to taste' }
    ],
    instructions: [
      'In a large bowl, whisk together lemon juice, garlic, anchovy paste, and olive oil.',
      'Add romaine lettuce and toss to coat.',
      'Add dressing and toss until well combined.',
      'Top with Parmesan cheese and croutons.',
      'Season with black pepper.',
      'Serve immediately.'
    ],
    prep_time: 10,
    cook_time: 0,
    total_time: 10,
    servings: 2,
    difficulty: 'easy',
    nutrition_info: {
      caloriesPerServing: 280,
      proteinG: 8,
      carbsG: 12,
      fatG: 20,
      fiberG: 4
    },
    tips_variations: [
      'Make your own croutons for extra crunch',
      'Add grilled chicken to make it a meal'
    ],
    author: 'Chef Antoine',
    generated_at: '2024-01-17T11:45:00Z',
    user_id: 'user3',
    username: 'Antoine Dubois',
    tags: ['Salad', 'Healthy', 'Quick Meal'],
    customization_notes: 'Can add avocado or bacon bits for extra flavor'
  },
  {
    id: '4',
    title: 'Chocolate Chip Cookies',
    description: 'Soft and chewy chocolate chip cookies that are perfect with milk.',
    ingredients: [
      { name: 'All-purpose flour', quantity: '2 1/4 cups' },
      { name: 'Baking soda', quantity: '1 tsp' },
      { name: 'Salt', quantity: '1 tsp' },
      { name: 'Unsalted butter', quantity: '1 cup', preparation: 'softened' },
      { name: 'Brown sugar', quantity: '3/4 cup' },
      { name: 'White sugar', quantity: '3/4 cup' },
      { name: 'Vanilla extract', quantity: '2 tsp' },
      { name: 'Eggs', quantity: '2 large' },
      { name: 'Chocolate chips', quantity: '2 cups' }
    ],
    instructions: [
      'Preheat oven to 375°F (190°C).',
      'Mix flour, baking soda, and salt in a bowl.',
      'Cream butter and sugars until fluffy.',
      'Beat in eggs and vanilla.',
      'Gradually blend in flour mixture.',
      'Stir in chocolate chips.',
      'Drop rounded tablespoons onto ungreased cookie sheets.',
      'Bake 9-11 minutes until golden brown.',
      'Cool on baking sheet for 2 minutes before transferring to wire rack.'
    ],
    prep_time: 15,
    cook_time: 10,
    total_time: 25,
    servings: 24,
    difficulty: 'easy',
    nutrition_info: {
      caloriesPerServing: 150,
      proteinG: 2,
      carbsG: 22,
      fatG: 8,
      fiberG: 1
    },
    tips_variations: [
      'Chill dough for chewier cookies',
      'Add nuts for extra texture'
    ],
    author: 'Chef Emma',
    generated_at: '2024-01-18T14:20:00Z',
    user_id: 'user4',
    username: 'Emma Johnson',
    tags: ['Dessert', 'Baking', 'Snack'],
    customization_notes: 'Can substitute white chocolate chips for variety'
  },
  {
    id: '5',
    title: 'Vegetable Stir Fry',
    description: 'Colorful vegetables stir-fried in a savory sauce served over rice.',
    ingredients: [
      { name: 'Broccoli florets', quantity: '2 cups' },
      { name: 'Bell peppers', quantity: '2', preparation: 'sliced' },
      { name: 'Carrots', quantity: '2', preparation: 'julienned' },
      { name: 'Snap peas', quantity: '1 cup' },
      { name: 'Soy sauce', quantity: '3 tbsp' },
      { name: 'Sesame oil', quantity: '1 tbsp' },
      { name: 'Garlic', quantity: '3 cloves', preparation: 'minced' },
      { name: 'Ginger', quantity: '1 tbsp', preparation: 'minced' },
      { name: 'Cornstarch', quantity: '1 tbsp' },
      { name: 'Vegetable broth', quantity: '1/4 cup' },
      { name: 'Green onions', quantity: '2', preparation: 'sliced' }
    ],
    instructions: [
      'Heat sesame oil in a wok or large skillet over high heat.',
      'Add garlic and ginger, stir-fry for 30 seconds.',
      'Add harder vegetables first (carrots, broccoli), stir-fry 3 minutes.',
      'Add softer vegetables (peppers, snap peas), stir-fry 2 minutes.',
      'Mix soy sauce, cornstarch, and broth; pour into wok.',
      'Stir until sauce thickens, about 1 minute.',
      'Remove from heat, garnish with green onions.',
      'Serve over steamed rice or noodles.'
    ],
    prep_time: 15,
    cook_time: 8,
    total_time: 23,
    servings: 3,
    difficulty: 'easy',
    nutrition_info: {
      caloriesPerServing: 120,
      proteinG: 4,
      carbsG: 18,
      fatG: 4,
      fiberG: 5
    },
    tips_variations: [
      'Add tofu or tempeh for protein',
      'Use any vegetables you have on hand'
    ],
    author: 'Chef Kenji',
    generated_at: '2024-01-19T12:10:00Z',
    user_id: 'user5',
    username: 'Kenji Tanaka',
    tags: ['Vegetarian', 'Quick Meal', 'Healthy'],
    customization_notes: 'Can add chili flakes for spicy version'
  }
];

export async function GET(req: NextRequest) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sort_by') || 'generated_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const difficulty = searchParams.get('difficulty') || '';
    const minTime = searchParams.get('min_time') || '';
    const maxTime = searchParams.get('max_time') || '';
    const servings = searchParams.get('servings') || '';
    const username = searchParams.get('username') || '';

    // Filter recipes based on search term
    let filteredRecipes = sampleRecipes.filter(recipe => {
      const matchesSearch = !search || 
        recipe.title.toLowerCase().includes(search.toLowerCase()) ||
        recipe.description.toLowerCase().includes(search.toLowerCase()) ||
        recipe.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase())) ||
        recipe.ingredients.some(ingredient => 
          ingredient.name.toLowerCase().includes(search.toLowerCase())
        );
      
      const matchesDifficulty = !difficulty || difficulty === 'all' || recipe.difficulty === difficulty;
      const matchesMinTime = !minTime || !recipe.total_time || recipe.total_time >= parseInt(minTime);
      const matchesMaxTime = !maxTime || !recipe.total_time || recipe.total_time <= parseInt(maxTime);
      const matchesServings = !servings || !recipe.servings || recipe.servings.toString() === servings;
      const matchesUsername = !username || recipe.username === username;

      return matchesSearch && matchesDifficulty && matchesMinTime && 
             matchesMaxTime && matchesServings && matchesUsername;
    });

    // Sort recipes
    filteredRecipes.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'total_time':
          comparison = (a.total_time || 0) - (b.total_time || 0);
          break;
        case 'difficulty':
          comparison = (a.difficulty || '').localeCompare(b.difficulty || '');
          break;
        case 'servings':
          comparison = (a.servings || 0) - (b.servings || 0);
          break;
        case 'generated_at':
        default:
          comparison = new Date(a.generated_at).getTime() - new Date(b.generated_at).getTime();
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Apply pagination
    const paginatedRecipes = filteredRecipes.slice(offset, offset + limit);

    // Prepare response
    const response = {
      recipes: paginatedRecipes,
      total: filteredRecipes.length,
      offset,
      limit
    };

    return Response.json(response);
  } catch (error) {
    console.error('Error fetching public recipes:', error);
    
    return Response.json(
      { 
        recipes: [], 
        total: 0,
        error: 'Failed to fetch recipes'
      },
      { status: 500 }
    );
  }
}
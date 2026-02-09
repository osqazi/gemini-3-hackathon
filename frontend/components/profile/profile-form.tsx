'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

interface ProfileFormProps {
  initialPreferences?: any;
  onSave: (preferences: any) => void;
  loading?: boolean;
}

export default function ProfileForm({ initialPreferences = {}, onSave, loading = false }: ProfileFormProps) {
  // Handle migration from old structure to new structure
  const migratedPreferences = {
    diet: typeof initialPreferences.diet === 'string' ? initialPreferences.diet : '',
    allergies: Array.isArray(initialPreferences.allergies) ? initialPreferences.allergies : [],
    skill_level: typeof initialPreferences.skill_level === 'string' ? initialPreferences.skill_level : '',
    likes: Array.isArray(initialPreferences.likes) ? initialPreferences.likes : 
           Array.isArray(initialPreferences.likes_dislikes) ? initialPreferences.likes_dislikes : [],
    dislikes: Array.isArray(initialPreferences.dislikes) ? initialPreferences.dislikes : [],
    cuisine_preferences: Array.isArray(initialPreferences.cuisine_preferences) ? initialPreferences.cuisine_preferences : [],
    cooking_time_preference: typeof initialPreferences.cooking_time_preference === 'string' ? initialPreferences.cooking_time_preference : '',
    health_focus: Array.isArray(initialPreferences.health_focus) ? initialPreferences.health_focus : 
                  Array.isArray(initialPreferences.health_conditions) ? initialPreferences.health_conditions : [],
    daily_calorie_target: typeof initialPreferences.daily_calorie_target === 'number' ? initialPreferences.daily_calorie_target :
                           (Array.isArray(initialPreferences.health_focus) && initialPreferences.health_focus.length > 0 ? 
                            typeof initialPreferences.calorie_goal === 'number' ? initialPreferences.calorie_goal : 0 : 0),
    // Keep old fields for backward compatibility
    age: initialPreferences.age !== undefined ? initialPreferences.age : null,
    gender: initialPreferences.gender !== undefined ? initialPreferences.gender : null,
    pregnancy: typeof initialPreferences.pregnancy === 'boolean' ? initialPreferences.pregnancy : false,
    doctor_restrictions: typeof initialPreferences.doctor_restrictions === 'string' ? initialPreferences.doctor_restrictions : ''
  };

  const [preferences, setPreferences] = useState(migratedPreferences);

  // Update local state when initialPreferences prop changes
  useEffect(() => {
    setPreferences(migratedPreferences);
  }, [initialPreferences]); // eslint-disable-line react-hooks/exhaustive-deps

  const [newAllergy, setNewAllergy] = useState('');
  const [newLike, setNewLike] = useState('');
  const [newDislike, setNewDislike] = useState('');
  const [newCuisine, setNewCuisine] = useState('');

  const handleAddAllergy = () => {
    if (newAllergy.trim() && !preferences.allergies.includes(newAllergy.trim())) {
      setPreferences({
        ...preferences,
        allergies: [...preferences.allergies, newAllergy.trim()]
      });
      setNewAllergy('');
    }
  };

  const handleRemoveAllergy = (index: number) => {
    const updated = [...preferences.allergies];
    updated.splice(index, 1);
    setPreferences({ ...preferences, allergies: updated });
  };

  const handleAddLike = () => {
    if (newLike.trim() && !preferences.likes.includes(newLike.trim())) {
      setPreferences({
        ...preferences,
        likes: [...preferences.likes, newLike.trim()]
      });
      setNewLike('');
    }
  };

  const handleRemoveLike = (index: number) => {
    const updated = [...preferences.likes];
    updated.splice(index, 1);
    setPreferences({ ...preferences, likes: updated });
  };

  const handleAddDislike = () => {
    if (newDislike.trim() && !preferences.dislikes.includes(newDislike.trim())) {
      setPreferences({
        ...preferences,
        dislikes: [...preferences.dislikes, newDislike.trim()]
      });
      setNewDislike('');
    }
  };

  const handleRemoveDislike = (index: number) => {
    const updated = [...preferences.dislikes];
    updated.splice(index, 1);
    setPreferences({ ...preferences, dislikes: updated });
  };

  const handleToggleHealthFocus = (focus: string) => {
    const updated = [...preferences.health_focus];
    const index = updated.indexOf(focus);
    if (index > -1) {
      updated.splice(index, 1);
    } else {
      updated.push(focus);
    }
    setPreferences({ ...preferences, health_focus: updated });
  };

  const handleAddCuisine = () => {
    if (newCuisine.trim() && !preferences.cuisine_preferences.includes(newCuisine.trim())) {
      setPreferences({
        ...preferences,
        cuisine_preferences: [...preferences.cuisine_preferences, newCuisine.trim()]
      });
      setNewCuisine('');
    }
  };

  const handleRemoveCuisine = (index: number) => {
    const updated = [...preferences.cuisine_preferences];
    updated.splice(index, 1);
    setPreferences({ ...preferences, cuisine_preferences: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Prepare data in the new structure format with validation
    const updatedPreferences = {
      ...preferences,
      // Ensure arrays are properly formatted
      allergies: Array.isArray(preferences.allergies) ? preferences.allergies : [],
      likes: Array.isArray(preferences.likes) ? preferences.likes : [],
      dislikes: Array.isArray(preferences.dislikes) ? preferences.dislikes : [],
      cuisine_preferences: Array.isArray(preferences.cuisine_preferences) ? preferences.cuisine_preferences : [],
      health_focus: Array.isArray(preferences.health_focus) ? preferences.health_focus : [],
      // Ensure numbers are properly formatted
      daily_calorie_target: typeof preferences.daily_calorie_target === 'number' ? preferences.daily_calorie_target : 0,
      // Remove legacy fields from submission
      likes_dislikes: undefined,
      health_conditions: undefined
    };

    onSave(updatedPreferences);
    toast({
      title: "Profile Saved",
      description: "Your cooking preferences have been saved successfully.",
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Your Cooking Preferences</CardTitle>
          <CardDescription>Customize your recipe preferences for personalized recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Diet Type */}
            <div>
              <Label htmlFor="diet">Diet Type</Label>
              <Select
                value={preferences.diet}
                onValueChange={(value) => setPreferences({ ...preferences, diet: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select diet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="omnivore">Omnivore</SelectItem>
                  <SelectItem value="vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                  <SelectItem value="pescatarian">Pescatarian</SelectItem>
                  <SelectItem value="keto">Keto</SelectItem>
                  <SelectItem value="paleo">Paleo</SelectItem>
                  <SelectItem value="gluten-free">Gluten-Free</SelectItem>
                  <SelectItem value="dairy-free">Dairy-Free</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cooking Skill Level */}
            <div>
              <Label htmlFor="skill_level">Cooking Skill Level</Label>
              <Select
                value={preferences.skill_level}
                onValueChange={(value) => setPreferences({ ...preferences, skill_level: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select skill level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cooking Time Preference */}
            <div>
              <Label htmlFor="cooking_time_preference">Cooking Time Preference</Label>
              <Select
                value={preferences.cooking_time_preference}
                onValueChange={(value) => setPreferences({ ...preferences, cooking_time_preference: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick">Quick (Under 30 mins)</SelectItem>
                  <SelectItem value="moderate">Moderate (30-60 mins)</SelectItem>
                  <SelectItem value="slow">Slow (Over 60 mins)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Allergies */}
          <div>
            <Label htmlFor="allergies">Food Allergies</Label>
            <div className="flex space-x-2 mt-2">
              <Input
                id="allergies"
                placeholder="Add an allergy (e.g., nuts, dairy)"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAllergy();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddAllergy}>Add</Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {preferences.allergies.map((allergy: string, index: number) => (
                <div key={index} className="flex items-center bg-secondary rounded-full pl-3 pr-2 py-1 text-sm">
                  <span>{allergy}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 rounded-full ml-1"
                    onClick={() => handleRemoveAllergy(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Favorites */}
          <div>
            <Label htmlFor="likes">Favorites</Label>
            <div className="flex space-x-2 mt-2">
              <Input
                id="likes"
                placeholder="Add a favorite food or ingredient (e.g., spicy food, mushrooms)"
                value={newLike}
                onChange={(e) => setNewLike(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLike();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddLike}>Add</Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {preferences.likes.map((like: string, index: number) => (
                <div key={index} className="flex items-center bg-secondary rounded-full pl-3 pr-2 py-1 text-sm">
                  <span>{like}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 rounded-full ml-1"
                    onClick={() => handleRemoveLike(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Avoid */}
          <div>
            <Label htmlFor="dislikes">Avoid</Label>
            <div className="flex space-x-2 mt-2">
              <Input
                id="dislikes"
                placeholder="Add foods to avoid (e.g., mushrooms, cilantro)"
                value={newDislike}
                onChange={(e) => setNewDislike(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDislike();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddDislike}>Add</Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {preferences.dislikes.map((dislike: string, index: number) => (
                <div key={index} className="flex items-center bg-secondary rounded-full pl-3 pr-2 py-1 text-sm">
                  <span>{dislike}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 rounded-full ml-1"
                    onClick={() => handleRemoveDislike(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Cuisine Preferences */}
          <div>
            <Label htmlFor="cuisine_preferences">Cuisine Preferences</Label>
            <div className="flex space-x-2 mt-2">
              <Input
                id="cuisine_preferences"
                placeholder="Add a cuisine (e.g., Mediterranean, Asian, Mexican)"
                value={newCuisine}
                onChange={(e) => setNewCuisine(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCuisine();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddCuisine}>Add</Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {preferences.cuisine_preferences.map((cuisine: string, index: number) => (
                <div key={index} className="flex items-center bg-secondary rounded-full pl-3 pr-2 py-1 text-sm">
                  <span>{cuisine}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 rounded-full ml-1"
                    onClick={() => handleRemoveCuisine(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Health Focus */}
          <div>
            <Label>Health Focus</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              {[
                { value: 'weight_loss', label: 'Weight Loss' },
                { value: 'diabetic_friendly', label: 'Diabetic-Friendly' },
                { value: 'heart_healthy', label: 'Heart Healthy' },
                { value: 'high_protein', label: 'High Protein' }
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={preferences.health_focus.includes(option.value)}
                    onCheckedChange={() => handleToggleHealthFocus(option.value)}
                  />
                  <Label htmlFor={option.value}>{option.label}</Label>
                </div>
              ))}
            </div>

            {/* Conditional Daily Calorie Target Field */}
            {preferences.health_focus.length > 0 && (
              <div className="mt-4">
                <Label htmlFor="daily_calorie_target">Calorie Target</Label>
                <Input
                  id="daily_calorie_target"
                  type="number"
                  value={preferences.daily_calorie_target || ''}
                  onChange={(e) => setPreferences({ ...preferences, daily_calorie_target: parseInt(e.target.value) || 0 })}
                  min="0"
                  placeholder="Enter daily calorie target"
                />
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading ? <span className="text-transparent">Saving...</span> : 'Save Preferences'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
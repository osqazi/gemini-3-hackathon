'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [preferences, setPreferences] = useState({
    diet: '',
    allergies: [] as string[],
    skill_level: '',
    likes_dislikes: [] as string[],
    calorie_goal: 0,
    age: 0,
    gender: '',
    health_conditions: [] as string[],
    pregnancy: false,
    doctor_restrictions: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      loadProfile();
    }
  }, [status]);

  const loadProfile = async () => {
    try {
      const response = await fetch(`/api/v1/profile`);

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.data.preferences);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      if (typeof window !== 'undefined') {
        window.loadingBar?.start();
      }
      const response = await fetch(`/api/v1/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });

      if (response.ok) {
        toast({
          title: 'Profile Updated',
          description: 'Your preferences have been saved successfully.',
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="text-transparent">Loading...</div>
    </div>;
  }

  if (status === 'unauthenticated') {
    // Redirect to sign in - you might want to implement this
    return <div>Please sign in to access your profile.</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Customize your recipe preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="diet">Dietary Preference</Label>
              <Select
                value={preferences.diet}
                onValueChange={(value) => setPreferences({...preferences, diet: value})}
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
                  <SelectItem value="gluten-free">Gluten-Free</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="skill_level">Cooking Skill Level</Label>
              <Select
                value={preferences.skill_level}
                onValueChange={(value) => setPreferences({...preferences, skill_level: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select skill level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="allergies">Food Allergies</Label>
            <Textarea
              id="allergies"
              placeholder="Separate allergens with commas (e.g., nuts, dairy, shellfish)"
              value={preferences.allergies.join(', ')}
              onChange={(e) => setPreferences({
                ...preferences,
                allergies: e.target.value.split(',').map(item => item.trim()).filter(Boolean)
              })}
            />
          </div>

          <div>
            <Label htmlFor="likes_dislikes">Likes/Dislikes</Label>
            <Textarea
              id="likes_dislikes"
              placeholder="What foods do you like or dislike? (e.g., spicy food, mushrooms, tomatoes)"
              value={preferences.likes_dislikes.join(', ')}
              onChange={(e) => setPreferences({
                ...preferences,
                likes_dislikes: e.target.value.split(',').map(item => item.trim()).filter(Boolean)
              })}
            />
          </div>

          <div>
            <Label htmlFor="health_conditions">Health Conditions</Label>
            <Textarea
              id="health_conditions"
              placeholder="Any health conditions that affect your diet? (e.g., diabetes, hypertension)"
              value={preferences.health_conditions.join(', ')}
              onChange={(e) => setPreferences({
                ...preferences,
                health_conditions: e.target.value.split(',').map(item => item.trim()).filter(Boolean)
              })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="calorie_goal">Daily Calorie Goal</Label>
              <Input
                id="calorie_goal"
                type="number"
                value={preferences.calorie_goal}
                onChange={(e) => setPreferences({...preferences, calorie_goal: parseInt(e.target.value) || 0})}
              />
            </div>

            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={preferences.age}
                onChange={(e) => setPreferences({...preferences, age: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="pregnancy"
              checked={preferences.pregnancy}
              onCheckedChange={(checked) => setPreferences({...preferences, pregnancy: Boolean(checked)})}
            />
            <Label htmlFor="pregnancy">I am pregnant</Label>
          </div>

          <div>
            <Label htmlFor="doctor_restrictions">Doctor's Dietary Restrictions</Label>
            <Textarea
              id="doctor_restrictions"
              placeholder="Any special dietary restrictions from your doctor?"
              value={preferences.doctor_restrictions}
              onChange={(e) => setPreferences({...preferences, doctor_restrictions: e.target.value})}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveProfile} disabled={loading}>
            {loading ? <span className="text-transparent">Saving...</span> : 'Save Preferences'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
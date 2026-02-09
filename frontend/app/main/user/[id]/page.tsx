'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Settings,
  Mail,
  Calendar,
  MapPin,
  Cake,
  Camera,
  Heart,
  Leaf,
  User,
  ChefHat
} from 'lucide-react';

export default function UserProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [userData, setUserData] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    joinDate: new Date('2024-01-01'),
    bio: 'Home cook passionate about Italian cuisine and experimenting with new flavors.',
    location: 'San Francisco, CA',
    birthday: 'January 15, 1990',
    preferences: {
      diet: 'Vegetarian',
      allergies: ['Nuts', 'Shellfish'],
      skillLevel: 'Intermediate',
      healthConditions: ['Diabetes'],
      likes: ['Italian', 'Mexican', 'Spicy food'],
      dislikes: ['Mushrooms', 'Beets']
    }
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    router.push('/auth/signin');
    return null;
  }

  // Check if the current session matches the requested user
  if (session?.user?.id !== userId) {
    // Redirect to the user's actual profile if they're trying to access someone else's
    router.push(`/user/${session.user.id}`);
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* Profile Picture and Info */}
        <div className="md:w-1/3">
          <Card>
            <CardHeader className="items-center pb-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={session.user?.image || ''} alt={session.user?.name || 'User'} />
                <AvatarFallback className="text-2xl">
                  {session.user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <CardTitle className="text-2xl">
                  {session.user?.name || userData.name}
                </CardTitle>
                <CardDescription className="break-all mt-1">
                  {session.user?.email || userData.email}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Joined {userData.joinDate.toLocaleDateString()}</span>
              </div>

              {userData.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{userData.location}</span>
                </div>
              )}

              {userData.birthday && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Cake className="h-4 w-4" />
                  <span>{userData.birthday}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Profile Details */}
        <div className="md:w-2/3 space-y-6">
          {/* Bio Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                About Me
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{userData.bio}</p>
            </CardContent>
          </Card>

          {/* Preferences Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Dietary Preference</div>
                  <Badge variant="secondary">{userData.preferences.diet}</Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Cooking Level</div>
                  <Badge variant="secondary">{userData.preferences.skillLevel}</Badge>
                </div>
              </div>

              {userData.preferences.allergies.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Allergies</div>
                  <div className="flex flex-wrap gap-2">
                    {userData.preferences.allergies.map((allergy, index) => (
                      <Badge key={index} variant="destructive">{allergy}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {userData.preferences.healthConditions.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Health Conditions</div>
                  <div className="flex flex-wrap gap-2">
                    {userData.preferences.healthConditions.map((condition, index) => (
                      <Badge key={index} variant="outline">{condition}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {userData.preferences.likes.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Likes</div>
                  <div className="flex flex-wrap gap-2">
                    {userData.preferences.likes.map((like, index) => (
                      <Badge key={index} variant="default">
                        <Heart className="h-3 w-3 mr-1" />
                        {like}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {userData.preferences.dislikes.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Dislikes</div>
                  <div className="flex flex-wrap gap-2">
                    {userData.preferences.dislikes.map((dislike, index) => (
                      <Badge key={index} variant="outline">
                        <ChefHat className="h-3 w-3 mr-1" />
                        {dislike}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              className="flex-1"
              onClick={() => router.push('/profile')} // Go to editable profile page
            >
              <Settings className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/chat')}
            >
              <ChefHat className="h-4 w-4 mr-2" />
              My Recipes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
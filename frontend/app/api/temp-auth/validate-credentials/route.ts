import { NextRequest } from 'next/server';
import { UserApiResponse } from '@/lib/user-api';

// Simple in-memory storage for demo purposes
// In a real application, this would be replaced with a proper database
const users: Array<{
  id: string;
  email: string;
  password: string;
  username: string;
}> = [
  {
    id: '1',
    email: 'owais@gmail.com',
    password: '123456789',
    username: 'Owais',
  },
  {
    id: '2',
    email: 'demo@example.com',
    password: 'password123',
    username: 'Demo User',
  },
];

export async function POST(req: NextRequest) {
  try {
    const { email, password }: { email: string; password: string } = await req.json();

    // Find user by email and password
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      const response: UserApiResponse = {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          provider: 'credentials',
          is_active: true,
          is_verified: true,
        }
      };

      return Response.json(response);
    } else {
      const response: UserApiResponse = {
        success: false,
        message: 'Invalid email or password'
      };

      return Response.json(response, { status: 401 });
    }
  } catch (error) {
    console.error('Validate credentials error:', error);
    
    const response: UserApiResponse = {
      success: false,
      message: 'Internal server error'
    };

    return Response.json(response, { status: 500 });
  }
}
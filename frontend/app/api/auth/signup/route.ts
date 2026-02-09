'use server';

import { NextRequest } from 'next/server';
import { userApi } from '@/lib/user-api';
import { signIn } from 'next-auth/react';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { fullName, email, password } = await request.json();

    if (!fullName || !email || !password) {
      return Response.json(
        { error: 'Full name, email, and password are required' },
        { status: 400 }
      );
    }

    // Register the user with full name as username
    const response = await userApi.register({
      email,
      password,
      username: fullName,
    });

    if (!response.success) {
      return Response.json(
        { error: response.message || 'Failed to register user' },
        { status: 400 }
      );
    }

    // Return success response
    return Response.json({
      success: true,
      message: 'User registered successfully',
      user: response.user
    });
  } catch (error) {
    console.error('Signup error:', error);
    return Response.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
import { NextRequest } from 'next/server';
import { auth } from '@/auth/auth';

// Proxy requests to the backend service
const BACKEND_URL = process.env.API_BASE_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    // Get the session to identify the user
    const session = await auth();

    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = (session.user as any)?.dbId || session.user?.id; // Use database ID if available
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Proxy the request to the backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId, // Pass user ID to backend
      },
    });

    const backendData = await backendResponse.json();

    return new Response(JSON.stringify(backendData), {
      status: backendResponse.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the session to identify the user
    const session = await auth();

    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = (session.user as any)?.dbId || session.user?.id; // Use database ID if available
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();

    // Proxy the request to the backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId, // Pass user ID to backend
      },
      body: JSON.stringify(body), // Forward the entire body
    });

    const backendData = await backendResponse.json();

    return new Response(JSON.stringify(backendData), {
      status: backendResponse.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
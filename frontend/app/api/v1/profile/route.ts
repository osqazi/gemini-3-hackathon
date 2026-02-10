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

    // Prepare headers, copying cookies from the original request for session handling
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-User-ID': userId, // Pass user ID to backend
    };

    // Copy cookies from the original request to maintain session
    const cookies = request.headers.get('cookie');
    if (cookies) {
      headers['cookie'] = cookies;
    }

    // Proxy the request to the backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/profile`, {
      method: 'GET',
      headers,
      credentials: 'include', // Include credentials (cookies) for cross-origin requests
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

    // Prepare headers, copying cookies from the original request for session handling
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-User-ID': userId, // Pass user ID to backend
    };

    // Copy cookies from the original request to maintain session
    const cookies = request.headers.get('cookie');
    if (cookies) {
      headers['cookie'] = cookies;
    }

    // Proxy the request to the backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/profile`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body), // Forward the entire body
      credentials: 'include', // Include credentials (cookies) for cross-origin requests
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
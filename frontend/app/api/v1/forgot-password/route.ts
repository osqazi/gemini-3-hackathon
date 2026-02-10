import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare headers, copying cookies from the original request for session handling
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Copy cookies from the original request to maintain session
    const cookies = request.headers.get('cookie');
    if (cookies) {
      headers['cookie'] = cookies;
    }

    // Forward the request to the backend API
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8000'}/api/v1/user/forgot-password`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email }),
      credentials: 'include', // Include credentials (cookies) for cross-origin requests
    });

    const backendData = await backendResponse.json();

    return new Response(JSON.stringify(backendData), {
      status: backendResponse.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Forgot password proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while processing your request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
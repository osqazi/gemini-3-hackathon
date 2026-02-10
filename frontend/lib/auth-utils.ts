import { signIn, signOut, getCsrfToken } from 'next-auth/react';
import { userApi } from './user-api';

/**
 * Ensures that the NextAuth session is synchronized with the backend session
 * This is particularly important for cross-origin setups where frontend and backend
 * are on different domains
 */
export async function syncAuthSession(email?: string, password?: string) {
  try {
    // First, try to get the current NextAuth session
    const session = await fetch('/api/auth/session', {
      credentials: 'include' // Include credentials for cross-origin requests
    });
    const sessionData = await session.json();
    
    if (sessionData?.user) {
      // Session exists, try to sync with backend
      if (email) {
        const response = await userApi.lookupOrCreate({
          email,
          provider: 'credentials',
          username: email.split('@')[0],
        });
        
        if (response.success && response.user) {
          return { success: true, user: response.user };
        }
      }
    }
    
    return { success: false, user: null };
  } catch (error) {
    console.error('Error syncing auth session:', error);
    return { success: false, user: null };
  }
}

/**
 * Performs a complete authentication flow with proper session handling
 */
export async function completeAuthFlow(
  email: string, 
  password: string, 
  isSignUp: boolean = false,
  fullName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // For sign up, first register the user via API
    if (isSignUp) {
      const registerResponse = await userApi.register({
        email,
        password,
        username: fullName
      });

      if (!registerResponse.success) {
        return { success: false, error: registerResponse.message || 'Registration failed' };
      }
    }

    // Then authenticate with NextAuth
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false, // We'll handle redirects manually
    });

    if (result?.error) {
      return { success: false, error: result.error };
    }

    if (result?.ok) {
      // Sync the session with the backend
      await syncAuthSession(email, password);
      return { success: true };
    } else {
      return { success: false, error: 'Authentication failed' };
    }
  } catch (error) {
    console.error('Complete auth flow error:', error);
    return { success: false, error: 'An error occurred during authentication' };
  }
}

/**
 * Signs out from both NextAuth and backend
 */
export async function completeSignOut() {
  try {
    await signOut({ redirect: false });
    // Optionally notify backend about logout
    // await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/logout`, {
    //   method: 'POST',
    //   credentials: 'include'
    // });
  } catch (error) {
    console.error('Sign out error:', error);
  }
}
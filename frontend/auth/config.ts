import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { userApi } from '@/lib/user-api';
import type { NextAuthConfig } from 'next-auth';

// Define the auth configuration
export const authConfig: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        fullName: { label: 'Full Name', type: 'text' },
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials || !credentials.email || !credentials.password) {
          console.log('Missing credentials');
          return null;
        }

        try {
          // First, try to validate existing credentials
          const response = await userApi.validateCredentials({
            email: credentials.email as string,
            password: credentials.password as string
          });

          console.log('Validate credentials response:', response);

          if (response.success && response.user) {
            // User exists and credentials are valid
            return {
              id: response.user.id,
              email: response.user.email,
              name: response.user.username || response.user.email.split('@')[0],
            } as any; // Type assertion to bypass strict typing
          } else {
            console.log('Credential validation failed:', response.message);
          }
        } catch (validationError) {
          console.error('Validation failed:', validationError);
          // Don't return null immediately, try registration as fallback
        }

        // If validation failed, try to register the user (for first-time sign-ups)
        // Note: This auto-registration on sign-in might not be desired behavior
        // You might want to separate sign-up and sign-in flows
        try {
          const registerResponse = await userApi.register({
            email: credentials.email as string,
            password: credentials.password as string,
            username: credentials.email.split('@')[0] // Use email prefix as username for auto-registration
          });

          console.log('Register response:', registerResponse);

          if (registerResponse.success && registerResponse.user) {
            // User registered successfully, return user data
            return {
              id: registerResponse.user.id,
              email: registerResponse.user.email,
              name: registerResponse.user.username || registerResponse.user.email.split('@')[0],
            } as any; // Type assertion to bypass strict typing
          } else {
            console.log('Registration failed:', registerResponse.message);
          }
        } catch (registrationError) {
          console.error('Registration failed:', registrationError);
        }

        // If both validation and registration failed, check if it's a network issue
        // If the backend is unreachable, we might want to provide a more informative error
        console.log('Both validation and registration failed - checking for network issues');
        
        // Attempt a simple connectivity test to the backend
        try {
          const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
          const testResponse = await fetch(`${backendUrl}/api/health`, { method: 'GET' }).catch(() => null);
          
          if (!testResponse || !testResponse.ok) {
            console.log('Backend connectivity issue detected - backend may be unreachable');
            // Still return null, but we now have more information about why
          }
        } catch (connectivityError) {
          console.log('Could not reach backend for connectivity test');
        }

        // If both validation and registration failed
        console.log('Authorization failed - returning null');
        return null;
      }
    })
  ],
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',  // Cross-site for production, lax for development
        path: '/',
        secure: process.env.NODE_ENV === 'production',  // Use secure cookies in production
      }
    }
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      try {
        // Determine provider and provider ID
        const provider = account?.provider || 'credentials';
        const providerId = account?.providerAccountId || null;

        console.log('Sign in callback:', { email: user.email, provider, providerId });

        // Only make API calls for non-Google providers or if we have necessary user data
        if (provider !== 'google' || (user.email && user.name)) {
          // Create or lookup user in backend database
          const response = await userApi.lookupOrCreate({
            email: user.email!,
            provider: provider,
            provider_id: providerId || undefined,
            username: user.name || user.email!.split('@')[0],
            password: undefined // Only for credentials login, which is handled separately
          });

          console.log('User API response:', response);

          if (response.success && response.user) {
            return true;
          }

          console.error('Sign in failed:', response);
          return false;
        }

        // If it's Google provider and we have minimal user data, allow sign-in
        return true;
      } catch (error) {
        console.error('Sign in error:', error);
        // Don't fail the sign-in just because of API issues - user can still be authenticated
        // The user data can be synced later in the session callback
        return true;
      }
    },

    async jwt({ token, user, account, profile, trigger }) {
      if (user) {
        // User object is available during sign in
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }

      if (account) {
        // Store provider info in token
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
      }

      return token;
    },

    async session({ session, token, user }) {
      // Add user ID and provider info to session
      session.user.id = token.id as string;
      (session.user as any).provider = token.provider as string | undefined;

      // Fetch user info from backend API to ensure consistency
      try {
        const response = await userApi.lookupOrCreate({
          email: session.user.email!,
          provider: (session.user as any).provider || 'credentials',
          username: session.user.name || session.user.email!.split('@')[0],
        });

        if (response.success && response.user) {
          session.user.dbId = response.user.id;
          session.user.isVerified = response.user.is_verified;
          session.user.isActive = response.user.is_active;
        }
      } catch (error) {
        console.error('Session error:', error);
        // Don't fail the session if the API call fails - just continue with basic user info
      }

      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  }
};

export default authConfig;
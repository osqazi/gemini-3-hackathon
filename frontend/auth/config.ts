import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { userApi } from '@/lib/user-api';

// Define the auth configuration
export const authConfig = {
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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // First, try to validate existing credentials
          const response = await userApi.validateCredentials({
            email: credentials.email,
            password: credentials.password
          });

          if (response.success && response.user) {
            // User exists and credentials are valid
            return {
              id: response.user.id,
              email: response.user.email,
              name: response.user.username || response.user.email.split('@')[0],
            };
          }
        } catch (validationError) {
          console.log('Validation failed, attempting registration:', validationError);
        }

        // If validation failed, try to register the user (for first-time sign-ups)
        try {
          const registerResponse = await userApi.register({
            email: credentials.email,
            password: credentials.password,
            username: credentials.fullName // Use full name as username
          });

          if (registerResponse.success && registerResponse.user) {
            // User registered successfully, return user data
            return {
              id: registerResponse.user.id,
              email: registerResponse.user.email,
              name: registerResponse.user.username || credentials.fullName || registerResponse.user.email.split('@')[0],
            };
          }
        } catch (registrationError) {
          console.error('Registration failed:', registrationError);
        }

        // If both validation and registration failed
        return null;
      }
    })
  ],
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Determine provider and provider ID
        const provider = account?.provider || 'credentials';
        const providerId = account?.providerAccountId || null;

        console.log('Sign in callback:', { email: user.email, provider, providerId });

        // Create or lookup user in backend database
        const response = await userApi.lookupOrCreate({
          email: user.email,
          provider: provider,
          provider_id: providerId,
          username: user.name || user.email.split('@')[0],
          password: null // Only for credentials login, which is handled separately
        });

        console.log('User API response:', response);

        if (response.success && response.user) {
          return true;
        }

        console.error('Sign in failed:', response);
        return false;
      } catch (error) {
        console.error('Sign in error:', error);
        return false;
      }
    },

    async jwt({ token, user, account, profile }) {
      if (user) {
        // User object is available during sign in
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }

      if (account && profile) {
        // Store provider info in token
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
      }

      return token;
    },

    async session({ session, token }) {
      // Add user ID and provider info to session
      session.user.id = token.id as string;
      session.user.provider = token.provider as string;

      // Fetch user info from backend API to ensure consistency
      try {
        const response = await userApi.lookupOrCreate({
          email: session.user.email,
          provider: session.user.provider || 'credentials',
          username: session.user.name || session.user.email.split('@')[0],
        });

        if (response.success && response.user) {
          session.user.dbId = response.user.id;
          session.user.isVerified = response.user.is_verified;
          session.user.isActive = response.user.is_active;
        }
      } catch (error) {
        console.error('Session error:', error);
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
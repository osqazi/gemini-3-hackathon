import NextAuth from 'next-auth';
import authConfig from './config';

// Export the handlers and auth functions
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut
} = NextAuth(authConfig);
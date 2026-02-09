import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's database ID */
      dbId?: string;
      /** Whether the user's email is verified */
      isVerified?: boolean;
      /** Whether the user account is active */
      isActive?: boolean;
    } & DefaultSession["user"];
  }

  /** Extending the built-in User type */
  interface User {
    /** The user's database ID */
    dbId?: string;
    /** Whether the user's email is verified */
    isVerified?: boolean;
    /** Whether the user's account is active */
    isActive?: boolean;
  }
}
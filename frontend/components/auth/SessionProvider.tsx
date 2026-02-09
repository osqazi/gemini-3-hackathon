'use client';

import { SessionProvider as NextAuthProvider } from 'next-auth/react';
import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export default function SessionProvider({ children }: Props) {
  return <NextAuthProvider>{children}</NextAuthProvider>;
}
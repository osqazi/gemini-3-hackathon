// Layout for user profile pages to ensure they have the main layout with navbar
import { ReactNode } from 'react';

export default function UserLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
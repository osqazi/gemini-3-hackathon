import MainLayout from '../main-layout';

export default function WithNavLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'APISIX Forge',
  description: 'API Gateway sécurisé avec WAF intégré',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </body>
    </html>
  );
}

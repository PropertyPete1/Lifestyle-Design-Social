import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Lifestyle Design Social',
  description: 'Auto-post your real estate videos to Instagram and YouTube.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        <nav className="p-4 bg-gray-900 border-b border-gray-700 flex justify-center space-x-6 text-sm font-medium">
          <Link href="/dashboard" className="hover:underline">📋 Dashboard</Link>
          <Link href="/dashboard/analytics" className="hover:underline">📈 Analytics</Link>
        </nav>
        <main className="p-4">{children}</main>
      </body>
    </html>
  );
} 
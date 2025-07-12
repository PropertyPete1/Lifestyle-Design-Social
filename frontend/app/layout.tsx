import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Real Estate Auto-Posting SaaS',
  description: 'Automate your real estate social media posting across Instagram, TikTok, and YouTube',
  keywords: ['real estate', 'social media', 'automation', 'instagram', 'tiktok', 'youtube'],
  authors: [{ name: 'Real Estate Auto-Posting Team' }],
  robots: 'index, follow',
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://yourdomain.com',
    siteName: 'Real Estate Auto-Posting SaaS',
    title: 'Real Estate Auto-Posting SaaS',
    description: 'Automate your real estate social media posting across Instagram, TikTok, and YouTube',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Real Estate Auto-Posting SaaS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Real Estate Auto-Posting SaaS',
    description: 'Automate your real estate social media posting across Instagram, TikTok, and YouTube',
    images: ['/twitter-image.jpg'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}

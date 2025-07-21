import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../sentry.client.config";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lifestyle Design Social",
  description: "Automated posting system for real estate videos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        {children}
      </body>
    </html>
  );
}

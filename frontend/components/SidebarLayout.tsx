'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/dashboard', label: '🏠 Dashboard' },
  { href: '/upload', label: '📤 Upload' },
  { href: '/cartoon', label: '🎨 Cartoon' },
  { href: '/analytics', label: '📊 Analytics' },
  { href: '/schedule', label: '📅 Schedule' },
  { href: '/tools/caption-generator', label: '✍️ Caption Generator' },
];

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-black text-white">
      <aside className="w-60 bg-gray-900 p-6 space-y-4">
        <h2 className="text-2xl font-bold mb-6">⚙️ AutoPost AI</h2>
        <nav className="space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-4 py-2 rounded hover:bg-gray-700 ${
                pathname === link.href ? 'bg-gray-700 font-semibold' : 'text-gray-300'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 bg-gray-950">{children}</main>
    </div>
  );
} 
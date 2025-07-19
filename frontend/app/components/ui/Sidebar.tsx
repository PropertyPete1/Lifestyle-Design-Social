import { Home, Calendar, BarChart2, Settings, UploadCloud } from 'lucide-react';
import Link from 'next/link';

const navItems = [
  { name: 'Upload', href: '/upload', icon: UploadCloud },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
  { name: 'Analytics', href: '/analytics', icon: BarChart2 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="h-full w-64 bg-zinc-900 text-white flex flex-col p-4">
      <h1 className="text-2xl font-bold mb-8">📲 Lifestyle Design</h1>
      <nav className="flex flex-col gap-4">
        {navItems.map(({ name, href, icon: Icon }) => (
          <Link key={name} href={href} className="flex items-center gap-3 hover:text-blue-400">
            <Icon className="w-5 h-5" />
            <span>{name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
} 
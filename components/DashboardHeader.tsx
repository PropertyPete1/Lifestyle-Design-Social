import Link from 'next/link';

export function DashboardHeader() {
  return (
    <header className="bg-gray-900 text-white p-4">
      <nav className="flex gap-6">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/upload">Upload</Link>
        <Link href="/scheduler">Scheduler</Link>
        <Link href="/captions">Enhancer</Link>
        <Link href="/captions/full">Smart Enhancer</Link>
      </nav>
    </header>
  );
} 
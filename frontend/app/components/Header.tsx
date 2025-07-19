'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/upload', label: 'Upload' },
  { href: '/calendar', label: 'Calendar' },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="w-full px-6 py-4 border-b border-neutral-700 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold tracking-wide text-white">Lifestyle Design Social</Link>
      <nav className="space-x-6">
        {navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'text-sm',
              pathname === href ? 'text-white font-semibold' : 'text-neutral-400 hover:text-white'
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  )
} 
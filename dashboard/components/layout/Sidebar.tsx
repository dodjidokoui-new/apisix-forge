'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/', label: 'Overview' },
  { href: '/routes', label: 'Routes' },
  { href: '/consumers', label: 'Consumers' },
  { href: '/waf', label: 'WAF' },
  { href: '/settings', label: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="px-6 py-5 border-b border-zinc-800">
        <span className="text-white font-semibold text-lg">APISIX Forge</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`block px-3 py-2 rounded-md text-sm transition-colors ${
              pathname === href
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-6 py-4 border-t border-zinc-800">
        <span className="text-xs text-zinc-500">v0.1.0</span>
      </div>
    </aside>
  );
}

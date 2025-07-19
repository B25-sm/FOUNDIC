import React from 'react';
import AuthUser from './AuthUser';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/dna-match', label: 'DNA Match', icon: '🧬' },
  { href: '/pods', label: 'Pods', icon: '🚀' },
  { href: '/wall', label: 'Wall', icon: '💡' },
  { href: '/jobs', label: 'Jobs', icon: '💼' },
  { href: '/investors', label: 'Investors', icon: '💰' },
  { href: '/admin', label: 'Admin', icon: '🛡️' },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col fixed top-0 left-0 h-screen w-64 bg-midnight-900/95 border-r border-midnight-800 z-40 pt-16 shadow-midnight-xl">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center py-6">
          <a href="/" className="text-gold-950 font-extrabold text-2xl tracking-tight">Foundic</a>
        </div>
        <nav className="flex-1 flex flex-col gap-1 px-4">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg nav-link hover:bg-midnight-800 transition-colors duration-200 font-medium"
            >
              <span className="text-xl">{link.icon}</span>
              <span>{link.label}</span>
            </a>
          ))}
        </nav>
        <div className="mt-auto px-4 py-6 border-t border-midnight-800">
          <AuthUser />
        </div>
      </div>
    </aside>
  );
} 
"use client";

import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../src/firebase';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/wall', label: 'Feed', icon: '📱' },
  { href: '/chat', label: 'Chat', icon: '💬' },
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/dna-match', label: 'DNA Match', icon: '🧬' },
  { href: '/pods', label: 'Pods', icon: '🚀' },
  { href: '/opportunities', label: 'Opportunities', icon: '💼' },
  { href: '/investors', label: 'Investors', icon: '💰' },
];

// Only you (the founder) can access admin features
const FOUNDER_EMAILS = [
  'saimahendra222@gmail.com',
  'mahendra10kcoders@gmail.com',
];

export default function Sidebar() {
  const [user] = useAuthState(auth);
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const pathname = usePathname();

  React.useEffect(() => {
    if (user) {
      const getUserRole = async () => {
        const userDoc = await getDoc(doc(getFirestore(), 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role || 'founder');
        }
      };
      getUserRole();
    }
  }, [user]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 right-4 z-50 p-3 bg-white/95 dark:bg-midnight-950/95 backdrop-blur-md border border-gray-200 dark:border-midnight-800 rounded-lg text-gray-700 dark:text-gray-300 hover:text-gold-950 transition-colors shadow-lg"
        aria-label="Toggle menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white/95 dark:bg-midnight-950/95 backdrop-blur-md border-r border-gray-200 dark:border-midnight-800
        transform transition-transform duration-300 z-30 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-midnight-800">
            <div className="flex items-center justify-between">
              <a href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gold-950 rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-lg">F</span>
                </div>
                <span className="text-gray-900 dark:text-white font-bold text-xl tracking-tight">Foundic</span>
              </a>
              <button
                onClick={closeSidebar}
                className="lg:hidden p-1 text-gray-600 dark:text-gray-300 hover:text-gold-950 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-2">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-gold-950 hover:bg-gray-100 dark:hover:bg-midnight-800 rounded-lg transition-colors duration-200 group ${
                  pathname === link.href ? 'bg-gold-950 text-white' : ''
                }`}
              >
                <span className="text-lg group-hover:scale-110 transition-transform">{link.icon}</span>
                <span className="font-medium">{link.label}</span>
              </a>
            ))}
            
            {/* Admin Link - Only show to founder */}
            {user && FOUNDER_EMAILS.includes(user.email?.toLowerCase() || '') && userRole === 'admin' && (
              <a
                href="/admin"
                onClick={closeSidebar}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-gold-950 hover:bg-gray-100 dark:hover:bg-midnight-800 rounded-lg transition-colors duration-200 group"
              >
                <span className="text-lg group-hover:scale-110 transition-transform">🛡️</span>
                <span className="font-medium">Admin</span>
              </a>
            )}
          </nav>
        </div>
      </div>
    </>
  );
} 
"use client";

import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../src/firebase';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { usePathname } from 'next/navigation';

const navLinks = [
  { 
    href: '/wall', 
    label: 'Feed', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  },
  { 
    href: '/chat', 
    label: 'Chat', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    )
  },
  { 
    href: '/dashboard', 
    label: 'Dashboard', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  { 
    href: '/dna-match', 
    label: 'DNA Match', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )
  },
  { 
    href: '/pods', 
    label: 'Pods', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  { 
    href: '/opportunities', 
    label: 'Opportunities', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
      </svg>
    )
  },
  { 
    href: '/investors', 
    label: 'Investors', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
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
        className="lg:hidden fixed top-4 right-4 z-50 p-3 bg-white/95 dark:bg-midnight-950/95 backdrop-blur-md border border-gray-200 dark:border-midnight-800 rounded-lg text-gray-700 dark:text-gray-300 hover:text-teal-500 transition-colors shadow-lg"
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
        fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-slate-900 to-slate-800 shadow-2xl
        transform transition-transform duration-300 z-30 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6">
            <div className="flex items-center justify-between">
              <a href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-xl">F</span>
                </div>
                <span className="text-white font-bold text-xl tracking-tight">oundic</span>
              </a>
              <button
                onClick={closeSidebar}
                className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 space-y-1">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeSidebar}
                className={`flex items-center gap-4 px-4 py-3.5 text-gray-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200 group ${
                  pathname === link.href ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg' : ''
                }`}
              >
                <div className={`flex-shrink-0 ${pathname === link.href ? 'text-white' : 'text-gray-400 group-hover:text-teal-400'} transition-colors`}>
                  {link.icon}
                </div>
                <span className="font-medium text-sm">{link.label}</span>
              </a>
            ))}
            
            {/* Admin Link - Only show to founder */}
            {user && FOUNDER_EMAILS.includes(user.email?.toLowerCase() || '') && userRole === 'admin' && (
              <a
                href="/admin"
                onClick={closeSidebar}
                className={`flex items-center gap-4 px-4 py-3.5 text-gray-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200 group ${
                  pathname === '/admin' ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg' : ''
                }`}
              >
                <div className={`flex-shrink-0 ${pathname === '/admin' ? 'text-white' : 'text-gray-400 group-hover:text-teal-400'} transition-colors`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="font-medium text-sm">Admin</span>
              </a>
            )}
          </nav>

          {/* Bottom Section */}
          <div className="p-4 border-t border-slate-700">
            <div className="text-xs text-gray-400 text-center">
              © 2025 Foundic
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 

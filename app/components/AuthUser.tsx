"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from 'firebase/auth';
import { auth } from '../../src/firebase';

export default function AuthUser() {
  const [user] = useAuthState(auth);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    return (
      <a 
        href="/login" 
        className="btn-primary text-sm px-4 py-2"
      >
        Sign In
      </a>
    );
  }

  const displayName = user.displayName || user.email?.split('@')[0] || 'User';
  const avatarInitial = displayName[0].toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-midnight-800 transition-colors duration-200 group"
      >
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-500 rounded-full flex items-center justify-center text-midnight-950 font-bold text-sm sm:text-base">
          {avatarInitial}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-support truncate max-w-24">
            {displayName}
          </div>
          <div className="text-xs text-support/60 truncate max-w-24">
            {user.email}
          </div>
        </div>
        <svg 
          className={`w-4 h-4 text-support/60 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-midnight-900 border border-midnight-700 rounded-lg shadow-midnight-xl z-50">
          <div className="p-4 border-b border-midnight-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-midnight-950 font-bold">
                {avatarInitial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-support truncate">{displayName}</div>
                <div className="text-sm text-support/60 truncate">{user.email}</div>
              </div>
            </div>
          </div>
          
          <div className="p-2">
            <a
              href="/profile"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 w-full px-3 py-2 text-support hover:text-teal-500 hover:bg-midnight-800 rounded-lg transition-colors duration-200"
            >
              <span className="text-lg">👤</span>
              <span>Profile</span>
            </a>
            <a
              href="/profile/edit"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 w-full px-3 py-2 text-support hover:text-teal-500 hover:bg-midnight-800 rounded-lg transition-colors duration-200"
            >
              <span className="text-lg">✏️</span>
              <span>Edit Profile</span>
            </a>
            <a
              href="/dashboard"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 w-full px-3 py-2 text-support hover:text-teal-500 hover:bg-midnight-800 rounded-lg transition-colors duration-200"
            >
              <span className="text-lg">📊</span>
              <span>Dashboard</span>
            </a>
            <a
              href="/settings"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 w-full px-3 py-2 text-support hover:text-teal-500 hover:bg-midnight-800 rounded-lg transition-colors duration-200"
            >
              <span className="text-lg">⚙️</span>
              <span>Settings</span>
            </a>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors duration-200"
            >
              <span className="text-lg">🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 

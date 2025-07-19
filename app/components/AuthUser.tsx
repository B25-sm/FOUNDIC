"use client";

import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../src/firebase';

export default function AuthUser() {
  const [user, loading] = useAuthState(auth);

  if (loading) return <div className="text-support/60 text-xs">Loading...</div>;
  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      {user.photoURL && (
        <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full border border-gold-950 shadow-glow" />
      )}
      <span className="font-medium text-support text-sm truncate max-w-[120px]">{user.displayName || user.email}</span>
      <button
        className="btn-ghost text-xs px-2 py-1 ml-2"
        onClick={() => auth.signOut()}
        title="Sign out"
      >
        Sign Out
      </button>
    </div>
  );
} 
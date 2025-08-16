"use client";

import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../src/firebase';

// Only you (the founder) can see admin link
const FOUNDER_EMAILS = [
  'saimahendra222@gmail.com',
  'mahendra10kcoders@gmail.com',
];

export default function AdminLink() {
  const [user] = useAuthState(auth);
  const isFounder = user && FOUNDER_EMAILS.includes(user.email?.toLowerCase() || '');
  
  if (!isFounder) return null;
  
  return (
    <a href="/admin" className="nav-link px-3 py-2 rounded-lg hover:bg-midnight-800 transition-colors duration-200">
      Admin
    </a>
  );
}

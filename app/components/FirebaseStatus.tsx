"use client";

import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, limit } from 'firebase/firestore';
import { db } from '../../src/firebase';

export default function FirebaseStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Try to read from users collection (which should exist)
        const usersRef = collection(db, 'users');
        await getDocs(usersRef);
        setStatus('connected');
      } catch (err: any) {
        console.error('Firebase connection error:', err);
        setStatus('error');
        setError(err.message || 'Unknown error');
      }
    };

    checkConnection();
  }, []);

  if (status === 'checking') {
    return (
      <div className="fixed bottom-4 right-4 bg-midnight-800 text-support px-3 py-2 rounded-lg text-sm">
        🔄 Checking Firebase connection...
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="fixed bottom-4 right-4 bg-red-900 text-white px-3 py-2 rounded-lg text-sm max-w-xs">
        ⚠️ Firebase Error: {error}
        <div className="text-xs mt-1">
          Check your internet connection and Firebase project settings.
        </div>
      </div>
    );
  }

  return null; // Don't show anything when connected
}

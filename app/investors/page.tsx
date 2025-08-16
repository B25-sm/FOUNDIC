"use client";

import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../src/firebase';
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import app from '../../src/firebase';
import AuthGuard from '../components/AuthGuard';

const db = getFirestore(app);

type Founder = {
  id: string;
  displayName?: string;
  email?: string;
  survey?: Record<string, string>;
};

export default function InvestorsPage() {
  const [user] = useAuthState(auth);
  const [founders, setFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const q = query(collection(db, 'users'), where('role', '==', 'founder'));
      const snap = await getDocs(q);
      // Placeholder: sort by survey completion (as a proxy for activity)
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Founder));
      data.sort((a, b) => (b.survey ? 1 : 0) - (a.survey ? 1 : 0));
      setFounders(data);
      setLoading(false);
    })();
  }, []);

  const handleInterest = (founderId: string) => {
    // Placeholder: show alert, in real app would write to Firestore
    alert('Interest expressed! (This would notify the founder in a real app)');
  };

  return (
    <AuthGuard>
      <main className="min-h-screen flex flex-col items-center bg-midnight-950 text-support px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="w-full max-w-2xl lg:max-w-4xl">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold gradient-text mb-4 sm:mb-6">Investor Connect</h1>
          <p className="mb-6 text-sm sm:text-base text-support/80">Browse and connect with top founders, ranked by traction and activity.</p>
          <div className="flex flex-col gap-4 sm:gap-6">
            {loading ? (
              <div className="text-support/60 text-center text-sm sm:text-base">Loading founders...</div>
            ) : founders.length === 0 ? (
              <div className="text-support/60 text-center text-sm sm:text-base">No founders found yet.</div>
            ) : founders.map(f => (
              <div key={f.id} className="card p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 animate-fade-in-up">
                <span className="font-semibold text-support/90 flex-1 text-sm sm:text-base">{f.displayName || f.email}</span>
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="badge badge-info text-xs sm:text-sm">{f.survey ? 'Active' : 'New'}</span>
                  <button className="btn-primary text-xs sm:text-sm" onClick={() => handleInterest(f.id)}>Express Interest</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </AuthGuard>
  );
} 
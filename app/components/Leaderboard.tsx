import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import app from '../../src/firebase';

const db = getFirestore(app);

type Founder = {
  id: string;
  displayName?: string;
  email?: string;
  fcoin?: number;
};

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const userSnap = await getDocs(collection(db, 'users'));
      const users = userSnap.docs.map(d => ({ id: d.id, ...d.data() } as Founder));
      // Calculate F-Coins from posts
      const postSnap = await getDocs(collection(db, 'posts'));
      const fcoinMap: Record<string, number> = {};
      postSnap.docs.forEach(p => {
        const authorId = p.data().authorId;
        if (authorId) fcoinMap[authorId] = (fcoinMap[authorId] || 0) + 10; // 10 F-Coins per post
      });
      users.forEach(u => { u.fcoin = fcoinMap[u.id] || 0; });
      const founders = users.filter(u => (u as any).role === 'founder');
      founders.sort((a, b) => (b.fcoin || 0) - (a.fcoin || 0));
      setLeaders(founders.slice(0, 5));
      setLoading(false);
    })();
  }, []);

  return (
    <div className="card p-6 mb-8 animate-fade-in-up">
      <h2 className="text-lg font-bold mb-4">Top Founders Leaderboard</h2>
      {loading ? (
        <div className="text-support/60 text-center">Loading leaderboard...</div>
      ) : leaders.length === 0 ? (
        <div className="text-support/60 text-center">No founders yet.</div>
      ) : (
        <ol className="flex flex-col gap-2 list-decimal pl-6">
          {leaders.map((u, i) => (
            <li key={u.id} className="flex items-center gap-3">
              <span className="font-semibold text-support/90">{u.displayName || u.email}</span>
              <span className="badge badge-info ml-2">{u.fcoin} F-Coins</span>
              {i === 0 && <span className="ml-2 text-teal-500 font-bold">🏆</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
} 

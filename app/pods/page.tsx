"use client";

import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../src/firebase';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, Timestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import app from '../../src/firebase';
import AuthGuard from '../components/AuthGuard';
import { createPodInterestNotification } from '../utils/notifications';

const db = getFirestore(app);

const COMP_TYPES = [
  { value: 'equity', label: 'Equity' },
  { value: 'barter', label: 'Barter' },
  { value: 'rev', label: 'Rev-share' },
];

export default function PodsPage() {
  const [user] = useAuthState(auth);
  const [pods, setPods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [comp, setComp] = useState(COMP_TYPES[0].value);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'pods'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setPods(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !goal.trim() || !user) return;
    setCreating(true);
    await addDoc(collection(db, 'pods'), {
      title,
      goal,
      comp,
      members: [user.uid],
      createdBy: user.uid,
      createdAt: Timestamp.now(),
    });
    setTitle('');
    setGoal('');
    setComp(COMP_TYPES[0].value);
    setShowForm(false);
    setCreating(false);
  };

  const handleJoin = async (podId: string, members: string[], createdBy: string) => {
    if (!user || members.includes(user.uid)) return;
    const podRef = doc(db, 'pods', podId);
    await updateDoc(podRef, {
      members: arrayUnion(user.uid),
    });

    // Create pod interest notification for the pod creator
    if (createdBy && createdBy !== user.uid) {
      await createPodInterestNotification(createdBy, user.uid, podId);
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen flex flex-col items-center bg-midnight-950 text-support px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="w-full max-w-2xl lg:max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold gradient-text">Mission Pods</h1>
            <button className="btn-primary text-sm sm:text-base" onClick={() => setShowForm(v => !v)}>{showForm ? 'Cancel' : 'Create Pod'}</button>
          </div>
          {showForm && (
            <form className="card p-4 sm:p-6 mb-6 sm:mb-8 flex flex-col gap-3 animate-fade-in-up" onSubmit={handleCreate}>
              <input
                className="input-field text-sm sm:text-base"
                type="text"
                placeholder="Pod title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
              <input
                className="input-field text-sm sm:text-base"
                type="text"
                placeholder="Main goal for this sprint"
                value={goal}
                onChange={e => setGoal(e.target.value)}
                required
              />
              <select
                className="input-field text-sm sm:text-base"
                value={comp}
                onChange={e => setComp(e.target.value)}
                required
              >
                {COMP_TYPES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <button className="btn-secondary mt-2 text-sm sm:text-base" type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create Pod'}</button>
            </form>
          )}
          <div className="flex flex-col gap-4 sm:gap-6">
            {loading ? (
              <div className="text-support/60 text-center text-sm sm:text-base">Loading pods...</div>
            ) : pods.length === 0 ? (
              <div className="text-support/60 text-center text-sm sm:text-base">No pods yet. Create the first one!</div>
            ) : pods.map(pod => (
              <div key={pod.id} className="card p-4 sm:p-6 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="font-semibold text-support text-base sm:text-lg">{pod.title}</span>
                    <span className="badge badge-info text-xs sm:text-sm">{COMP_TYPES.find(c => c.value === pod.comp)?.label}</span>
                  </div>
                  <span className="text-xs text-support/60 sm:ml-auto">{pod.createdAt?.toDate ? pod.createdAt.toDate().toLocaleString() : 'now'}</span>
                </div>
                <div className="text-support/80 mb-3 sm:mb-2 text-left text-sm sm:text-base">Goal: {pod.goal}</div>
                <div className="flex flex-col sm:flex-row sm:gap-4 sm:items-center text-support/70 text-sm">
                  <span>Members: {pod.members?.length || 1}</span>
                  <button className="btn-secondary text-xs sm:text-sm mt-2 sm:mt-0" onClick={() => handleJoin(pod.id, pod.members || [], pod.createdBy)} disabled={pod.members?.includes(user?.uid)}>Join Pod</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </AuthGuard>
  );
} 
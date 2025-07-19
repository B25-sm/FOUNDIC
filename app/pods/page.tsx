"use client";

import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../src/firebase';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, Timestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import app from '../../src/firebase';

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

  const handleJoin = async (podId: string, members: string[]) => {
    if (!user || members.includes(user.uid)) return;
    const podRef = doc(db, 'pods', podId);
    await updateDoc(podRef, {
      members: arrayUnion(user.uid),
    });
  };

  return (
    <main className="min-h-screen flex flex-col items-center bg-midnight-950 text-support px-2 py-8">
      <div className="max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold gradient-text">Mission Pods</h1>
          <button className="btn-primary" onClick={() => setShowForm(v => !v)}>{showForm ? 'Cancel' : 'Create Pod'}</button>
        </div>
        {showForm && (
          <form className="card p-6 mb-8 flex flex-col gap-3 animate-fade-in-up" onSubmit={handleCreate}>
            <input
              className="input-field"
              type="text"
              placeholder="Pod title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
            <input
              className="input-field"
              type="text"
              placeholder="Main goal for this sprint"
              value={goal}
              onChange={e => setGoal(e.target.value)}
              required
            />
            <select
              className="input-field"
              value={comp}
              onChange={e => setComp(e.target.value)}
              required
            >
              {COMP_TYPES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <button className="btn-secondary mt-2" type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create Pod'}</button>
          </form>
        )}
        <div className="flex flex-col gap-6">
          {loading ? (
            <div className="text-support/60 text-center">Loading pods...</div>
          ) : pods.length === 0 ? (
            <div className="text-support/60 text-center">No pods yet. Create the first one!</div>
          ) : pods.map(pod => (
            <div key={pod.id} className="card p-6 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-support text-lg">{pod.title}</span>
                <span className="badge badge-info ml-2">{COMP_TYPES.find(c => c.value === pod.comp)?.label}</span>
                <span className="ml-auto text-xs text-support/60">{pod.createdAt?.toDate ? pod.createdAt.toDate().toLocaleString() : 'now'}</span>
              </div>
              <div className="text-support/80 mb-2 text-left">Goal: {pod.goal}</div>
              <div className="flex gap-4 items-center text-support/70 text-sm">
                <span>Members: {pod.members?.length || 1}</span>
                <button className="btn-secondary text-xs" onClick={() => handleJoin(pod.id, pod.members || [])} disabled={pod.members?.includes(user?.uid)}>Join Pod</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
} 
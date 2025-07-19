"use client";

import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../src/firebase';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import app from '../../src/firebase';

const db = getFirestore(app);

const SURVEY_QUESTIONS = [
  { key: 'workStyle', label: 'Preferred work style', options: ['Async', 'Real-time', 'Hybrid'] },
  { key: 'riskTolerance', label: 'Risk tolerance', options: ['High', 'Medium', 'Low'] },
  { key: 'vision', label: 'Vision alignment', options: ['Disruptive', 'Steady growth', 'Community impact'] },
  { key: 'commitment', label: 'Weekly commitment', options: ['<10h', '10-20h', '20h+'] },
  { key: 'values', label: 'Core value', options: ['Integrity', 'Speed', 'Creativity', 'Resilience'] },
];

function calcCompatibility(a, b) {
  let score = 0;
  SURVEY_QUESTIONS.forEach(q => {
    if (a[q.key] && b[q.key] && a[q.key] === b[q.key]) score++;
  });
  return Math.round((score / SURVEY_QUESTIONS.length) * 100);
}

type UserWithSurvey = {
  id: string;
  displayName?: string;
  email?: string;
  survey?: Record<string, string>;
  compatibility?: number;
};

export default function DnaMatchPage() {
  const [user] = useAuthState(auth);
  const [survey, setSurvey] = useState({});
  const [saved, setSaved] = useState(false);
  const [matches, setMatches] = useState<UserWithSurvey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      const data = snap.data() || {};
      setSurvey(data.survey || {});
      setSaved(!!data.survey);
    });
  }, [user]);

  const handleSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid), { survey }, { merge: true });
    setSaved(true);
  };

  useEffect(() => {
    if (!user || !saved) return;
    (async () => {
      setLoading(true);
      const q = query(collection(db, 'users'), where('survey', '!=', null));
      const snap = await getDocs(q);
      const others = snap.docs.filter(d => d.id !== user.uid).map(d => ({ id: d.id, ...d.data() } as UserWithSurvey));
      const mySurvey = survey;
      const scored = others.map(u => ({
        ...u,
        compatibility: calcCompatibility(mySurvey, u.survey || {}),
      })).sort((a, b) => b.compatibility - a.compatibility);
      setMatches(scored);
      setLoading(false);
    })();
  }, [user, saved, survey]);

  return (
    <main className="min-h-screen flex flex-col items-center bg-midnight-950 text-support px-2 py-8">
      <div className="max-w-xl w-full">
        <div className="card p-8 mb-8 animate-fade-in-up">
          <h1 className="text-2xl font-bold gradient-text mb-2">Co-Founder DNA Match</h1>
          <p className="mb-4 text-support/80">Take the survey to find your most compatible co-founders based on mindset, values, and work-style.</p>
          <form className="flex flex-col gap-4" onSubmit={handleSurvey}>
            {SURVEY_QUESTIONS.map(q => (
              <div key={q.key} className="text-left">
                <label className="block font-semibold mb-1">{q.label}</label>
                <select
                  className="input-field w-full"
                  value={survey[q.key] || ''}
                  onChange={e => setSurvey(s => ({ ...s, [q.key]: e.target.value }))}
                  required
                >
                  <option value="" disabled>Select...</option>
                  {q.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ))}
            <button className="btn-primary mt-4" type="submit">{saved ? 'Update Survey' : 'Save & Find Matches'}</button>
          </form>
        </div>
        {saved && (
          <div className="card p-6 animate-fade-in-up">
            <h2 className="text-lg font-bold mb-4">Your Top Matches</h2>
            {loading ? (
              <div className="text-support/60 text-center">Finding matches...</div>
            ) : matches.length === 0 ? (
              <div className="text-support/60 text-center">No matches found yet. Invite more founders!</div>
            ) : (
              <div className="flex flex-col gap-4">
                {matches.slice(0, 5).map(m => (
                  <div key={m.id} className="bg-midnight-800/60 rounded-lg px-4 py-3 flex items-center gap-4">
                    <span className="font-semibold text-support/90 flex-1">{m.displayName || m.email}</span>
                    <span className="badge badge-info">{m.compatibility}% match</span>
                    <button className="btn-secondary text-xs">Message</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
} 
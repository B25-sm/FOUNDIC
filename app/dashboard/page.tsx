"use client";

import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../src/firebase';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import app from '../../src/firebase';
import OnboardingModal from '../components/OnboardingModal';
import { useRouter } from 'next/navigation';
import ValuationEstimator from '../components/ValuationEstimator';
import Leaderboard from '../components/Leaderboard';

const db = getFirestore(app);

type UserWithSurvey = {
  id: string;
  displayName?: string;
  email?: string;
  survey?: Record<string, string>;
  compatibility?: number;
};

function useUserRole(uid: string | undefined) {
  const [role, setRole] = React.useState<string | null>(null);
  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, 'users', uid)).then(snap => {
      setRole(snap.data()?.role || 'founder');
    });
  }, [uid]);
  return role;
}

export default function DashboardPage() {
  const [user] = useAuthState(auth);
  const role = useUserRole(user?.uid);
  const [fcoin, setFcoin] = useState(0);
  const [podInvites, setPodInvites] = useState<any[]>([]);
  const [recentMatches, setRecentMatches] = useState<UserWithSurvey[]>([]);
  const [analytics, setAnalytics] = useState({ users: 0, posts: 0, pods: 0 });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    // F-Coin stats (placeholder: count posts as F-Coins)
    getDocs(query(collection(db, 'posts'), where('authorId', '==', user.uid))).then(snap => {
      setFcoin(snap.size * 10); // 10 F-Coins per post (example)
    });
    // Pod invites (pods where user is not a member but is invited - placeholder: none)
    setPodInvites([]); // You can implement invites in pods collection if needed
    // Recent matches (from DNA Match)
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      const mySurvey = snap.data()?.survey;
      if (!mySurvey) return setRecentMatches([]);
      getDocs(query(collection(db, 'users'), where('survey', '!=', null))).then(qSnap => {
        const others = qSnap.docs.filter(d => d.id !== user.uid).map(d => ({ id: d.id, ...d.data() } as UserWithSurvey));
        const scored = others.map(u => ({
          ...u,
          compatibility: calcCompatibility(mySurvey, u.survey || {}),
        })).sort((a, b) => b.compatibility - a.compatibility);
        setRecentMatches(scored.slice(0, 3));
      });
    });
    // Analytics
    (async () => {
      const userSnap = await getDocs(collection(db, 'users'));
      const postSnap = await getDocs(collection(db, 'posts'));
      const podsSnap = await getDocs(collection(db, 'pods'));
      setAnalytics({
        users: userSnap.size,
        posts: postSnap.size,
        pods: podsSnap.size,
      });
    })();
    // Onboarding: show if no survey and not dismissed
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      const hasSurvey = !!snap.data()?.survey;
      if (!hasSurvey && !localStorage.getItem('foundic_onboarding_dismissed')) {
        setShowOnboarding(true);
      }
    });
  }, [user]);

  function calcCompatibility(a: any, b: any) {
    let score = 0;
    const keys = ['workStyle', 'riskTolerance', 'vision', 'commitment', 'values'];
    keys.forEach(k => {
      if (a[k] && b[k] && a[k] === b[k]) score++;
    });
    return Math.round((score / keys.length) * 100);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-midnight-950 text-support px-4 py-12">
      <OnboardingModal
        open={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          localStorage.setItem('foundic_onboarding_dismissed', '1');
        }}
        onDnaSurvey={() => {
          setShowOnboarding(false);
          localStorage.setItem('foundic_onboarding_dismissed', '1');
          router.push('/dna-match');
        }}
      />
      <div className="card p-8 max-w-2xl w-full text-center animate-fade-in-up">
        <div className="flex flex-col items-center gap-2 mb-6">
          {user?.photoURL && (
            <img src={user.photoURL} alt="avatar" className="w-16 h-16 rounded-full border border-gold-950 shadow-glow mb-2" />
          )}
          <h1 className="text-2xl font-bold gradient-text">Welcome, {user?.displayName || user?.email}!</h1>
          <span className="badge badge-info mt-1">Role: {role ? role.charAt(0).toUpperCase() + role.slice(1) : '...'}</span>
        </div>
        {/* Analytics widgets */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card p-4 text-center">
            <div className="text-lg font-bold gradient-text">{analytics.users}</div>
            <div className="text-support/70 text-xs">Users</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-lg font-bold gradient-text">{analytics.posts}</div>
            <div className="text-support/70 text-xs">Posts</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-lg font-bold gradient-text">{analytics.pods}</div>
            <div className="text-support/70 text-xs">Pods</div>
          </div>
        </div>
        <ValuationEstimator />
        <Leaderboard />
        {/* F-Coin stats and pod invites */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="feature-card">
            <span className="text-gold-950 text-2xl font-bold">🪙</span>
            <h3 className="mt-2 text-lg font-semibold text-support">F-Coin Balance</h3>
            <p className="mt-1 text-support/80 text-sm">Earn F-Coins for every post, pod, and milestone. (10 F-Coins per post)</p>
            <div className="text-2xl font-bold gradient-text mt-2">{fcoin}</div>
          </div>
          <div className="feature-card">
            <span className="text-gold-950 text-2xl font-bold">📩</span>
            <h3 className="mt-2 text-lg font-semibold text-support">Pod Invites</h3>
            <p className="mt-1 text-support/80 text-sm">See pods you’ve been invited to join. (Coming soon)</p>
            <div className="mt-2 text-support/60 text-sm">{podInvites.length === 0 ? 'No invites yet.' : podInvites.map((p: any) => <div key={p.id}>{p.title}</div>)}</div>
          </div>
        </div>
        {/* Recent matches */}
        <div className="card p-6 mb-8 animate-fade-in-up">
          <h2 className="text-lg font-bold mb-4">Recent DNA Matches</h2>
          {recentMatches.length === 0 ? (
            <div className="text-support/60 text-center">No matches yet. Complete your DNA survey!</div>
          ) : (
            <div className="flex flex-col gap-4">
              {recentMatches.map((m: UserWithSurvey) => (
                <div key={m.id} className="bg-midnight-800/60 rounded-lg px-4 py-3 flex items-center gap-4">
                  <span className="font-semibold text-support/90 flex-1">{m.displayName || m.email}</span>
                  <span className="badge badge-info">{m.compatibility}% match</span>
                  <button className="btn-secondary text-xs">Message</button>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Quick links to features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="feature-card">
            <span className="text-gold-950 text-2xl font-bold">🚀</span>
            <h3 className="mt-2 text-lg font-semibold text-support">Mission Pods</h3>
            <p className="mt-1 text-support/80 text-sm">Join or create a pod, track milestones, and collaborate in real time.</p>
            <a href="/pods" className="btn-primary mt-4">Go to Pods</a>
          </div>
          <div className="feature-card">
            <span className="text-gold-950 text-2xl font-bold">🧬</span>
            <h3 className="mt-2 text-lg font-semibold text-support">DNA Match</h3>
            <p className="mt-1 text-support/80 text-sm">Find your perfect co-founder match and start building together.</p>
            <a href="/dna-match" className="btn-secondary mt-4">Find a Match</a>
          </div>
          <div className="feature-card">
            <span className="text-gold-950 text-2xl font-bold">💡</span>
            <h3 className="mt-2 text-lg font-semibold text-support">Wall</h3>
            <p className="mt-1 text-support/80 text-sm">Share wins, lessons, and connect with the community.</p>
            <a href="/wall" className="btn-primary mt-4">Go to Wall</a>
          </div>
          {role === 'investor' && (
            <div className="feature-card">
              <span className="text-gold-950 text-2xl font-bold">💰</span>
              <h3 className="mt-2 text-lg font-semibold text-support">Investor Connect</h3>
              <p className="mt-1 text-support/80 text-sm">Browse founders, view traction, and connect with startups.</p>
              <a href="/investors" className="btn-secondary mt-4">Find Founders</a>
            </div>
          )}
          {role === 'admin' && (
            <div className="feature-card">
              <span className="text-gold-950 text-2xl font-bold">🛡️</span>
              <h3 className="mt-2 text-lg font-semibold text-support">Admin Panel</h3>
              <p className="mt-1 text-support/80 text-sm">Moderate posts, approve startups, and manage verification.</p>
              <a href="/admin" className="btn-primary mt-4">Go to Admin</a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 
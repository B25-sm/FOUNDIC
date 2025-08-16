"use client";

import React, { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../src/firebase';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    // If user is logged in, redirect to social feed (Wall)
    if (user && !loading) {
      router.push('/wall');
    }
  }, [user, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <main className="relative min-h-screen flex flex-col items-center justify-center bg-white dark:bg-midnight-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-950 mx-auto mb-4"></div>
          <p className="text-gray-900 dark:text-white">Loading...</p>
        </div>
      </main>
    );
  }

  // If user is logged in, don't show the landing page (will redirect)
  if (user) {
    return null;
  }
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-white dark:bg-midnight-950 overflow-hidden">
      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-24 sm:py-32">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-16 h-16 bg-gold-950 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-3xl">F</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white">
            Foundic
          </h1>
        </div>
        <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
          The cleanest, most trusted space for startup founders, co-founders, and investors.<br />
          <span className="text-gold-950 font-bold">Proof-driven. Community-powered. Built for you.</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <a href="/login" className="btn-primary text-lg px-8 py-4">Sign In / Get Started</a>
          <a href="#features" className="btn-secondary text-lg px-8 py-4">Explore Features</a>
        </div>
      </section>

      {/* Trending Teasers */}
      <section className="relative z-10 w-full max-w-6xl mx-auto mt-16 px-4" id="features">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="card p-6 text-center hover:shadow-lg transition-shadow">
            <span className="text-gold-950 text-4xl font-bold">🚀</span>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">Mission Pods</h3>
            <p className="mt-3 text-gray-600 text-sm leading-relaxed">60-day co-building sprints with equity, barter, or rev-share. Track milestones in real time.</p>
          </div>
          <div className="card p-6 text-center hover:shadow-lg transition-shadow">
            <span className="text-gold-950 text-4xl font-bold">🧬</span>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">DNA Match</h3>
            <p className="mt-3 text-gray-600 text-sm leading-relaxed">Find your perfect co-founder match with our mindset and values survey + algorithmic matching.</p>
          </div>
          <div className="card p-6 text-center hover:shadow-lg transition-shadow">
            <span className="text-gold-950 text-4xl font-bold">📈</span>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">Founder Compass</h3>
            <p className="mt-3 text-gray-600 text-sm leading-relaxed">Showcase your live progress, public timeline, and F-Coin rewards. Build in public, get noticed.</p>
          </div>
          <div className="card p-6 text-center hover:shadow-lg transition-shadow">
            <span className="text-gold-950 text-4xl font-bold">💡</span>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">Fail Forward Wall</h3>
            <p className="mt-3 text-gray-600 text-sm leading-relaxed">Share lessons, failures, and pivots. Like, comment, and repost to help others grow.</p>
          </div>
          <div className="card p-6 text-center hover:shadow-lg transition-shadow">
            <span className="text-gold-950 text-4xl font-bold">📢</span>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">Signal Boost Wall</h3>
            <p className="mt-3 text-gray-600 text-sm leading-relaxed">Celebrate micro-wins and milestones. Upvote to boost visibility in the community.</p>
          </div>
          <div className="card p-6 text-center hover:shadow-lg transition-shadow">
            <span className="text-gold-950 text-4xl font-bold">💰</span>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">Investor Connect</h3>
            <p className="mt-3 text-gray-600 text-sm leading-relaxed">Verified founders ranked by traction. Investors browse, connect, and express interest.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-12 mt-20 text-gray-500 text-sm border-t border-gray-200">
        &copy; {new Date().getFullYear()} Foundic. Built for founders, by founders.
      </footer>
    </main>
  );
} 
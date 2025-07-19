import React from 'react';

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-midnight-950 overflow-hidden">
      {/* Animated Space Background */}
      <div className="space-scene">
        <div className="stars" />
        <div className="earth animate-float" />
        <div className="moon animate-float" style={{ animationDelay: '2s' }} />
        <div className="connection-line" />
        <div className="connection-dots" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-24 sm:py-32">
        <h1 className="hero-title gradient-text drop-shadow-glow animate-fade-in-up">
          Foundic
        </h1>
        <p className="hero-subtitle max-w-2xl mx-auto animate-fade-in-up">
          The cleanest, most trusted space for startup founders, co-founders, and investors.<br />
          <span className="gradient-text font-bold">Proof-driven. Community-powered. Built for you.</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-8 animate-fade-in-up">
          <a href="/login" className="btn-primary text-lg">Sign In / Get Started</a>
          <a href="#features" className="btn-secondary text-lg">Explore Features</a>
        </div>
      </section>

      {/* Trending Teasers */}
      <section className="relative z-10 w-full max-w-3xl mx-auto mt-8 animate-fade-in-up" id="features">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="feature-card">
            <span className="text-gold-950 text-3xl font-bold">🚀</span>
            <h3 className="mt-2 text-lg font-semibold text-support">Mission Pods</h3>
            <p className="mt-1 text-support/80 text-sm">60-day co-building sprints with equity, barter, or rev-share. Track milestones in real time.</p>
          </div>
          <div className="feature-card">
            <span className="text-gold-950 text-3xl font-bold">🧬</span>
            <h3 className="mt-2 text-lg font-semibold text-support">DNA Match</h3>
            <p className="mt-1 text-support/80 text-sm">Find your perfect co-founder match with our mindset and values survey + algorithmic matching.</p>
          </div>
          <div className="feature-card">
            <span className="text-gold-950 text-3xl font-bold">📈</span>
            <h3 className="mt-2 text-lg font-semibold text-support">Founder Compass</h3>
            <p className="mt-1 text-support/80 text-sm">Showcase your live progress, public timeline, and F-Coin rewards. Build in public, get noticed.</p>
          </div>
          <div className="feature-card">
            <span className="text-gold-950 text-3xl font-bold">💡</span>
            <h3 className="mt-2 text-lg font-semibold text-support">Fail Forward Wall</h3>
            <p className="mt-1 text-support/80 text-sm">Share lessons, failures, and pivots. Like, comment, and repost to help others grow.</p>
          </div>
          <div className="feature-card">
            <span className="text-gold-950 text-3xl font-bold">📢</span>
            <h3 className="mt-2 text-lg font-semibold text-support">Signal Boost Wall</h3>
            <p className="mt-1 text-support/80 text-sm">Celebrate micro-wins and milestones. Upvote to boost visibility in the community.</p>
          </div>
          <div className="feature-card">
            <span className="text-gold-950 text-3xl font-bold">💰</span>
            <h3 className="mt-2 text-lg font-semibold text-support">Investor Connect</h3>
            <p className="mt-1 text-support/80 text-sm">Verified founders ranked by traction. Investors browse, connect, and express interest.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-8 mt-16 text-support/60 text-xs">
        &copy; {new Date().getFullYear()} Foundic. Built for founders, by founders.
      </footer>
    </main>
  );
} 
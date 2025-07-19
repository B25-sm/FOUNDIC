import React from 'react';

export default function JobsPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-midnight-950 text-support">
      <div className="card p-8 max-w-lg w-full text-center animate-fade-in-up">
        <h1 className="text-3xl font-bold gradient-text mb-4">Jobs Board</h1>
        <p className="mb-6 text-support/80">Founders post opportunities. Apply to join exciting startups and pods.</p>
        <a href="#" className="btn-primary w-full">Browse Jobs</a>
      </div>
    </main>
  );
} 
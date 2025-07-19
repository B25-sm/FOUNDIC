import React, { useState } from 'react';

export default function OnboardingModal({ open, onClose, onDnaSurvey }: { open: boolean; onClose: () => void; onDnaSurvey: () => void }) {
  const [step, setStep] = useState(0);
  if (!open) return null;
  return (
    <div className="modal-overlay z-60 animate-fade-in" onClick={onClose}>
      <div className="modal-content max-w-lg w-full animate-fade-in-up" onClick={e => e.stopPropagation()}>
        {step === 0 && (
          <>
            <h2 className="text-2xl font-bold gradient-text mb-2">Welcome to Foundic!</h2>
            <p className="mb-4 text-support/80">You’ve joined the cleanest, most trusted space for founders, co-founders, and investors.</p>
            <button className="btn-primary w-full mt-4" onClick={() => setStep(1)}>Take a Quick Tour</button>
            <button className="btn-ghost w-full mt-2" onClick={onClose}>Skip</button>
          </>
        )}
        {step === 1 && (
          <>
            <h2 className="text-xl font-bold mb-2">What can you do here?</h2>
            <ul className="text-left mb-4 text-support/80 list-disc pl-5">
              <li>Share wins, lessons, and connect on the Wall</li>
              <li>Find your perfect co-founder with DNA Match</li>
              <li>Join or create Mission Pods for 60-day sprints</li>
              <li>Earn F-Coins for engagement and progress</li>
              <li>Investors can discover and connect with top founders</li>
            </ul>
            <button className="btn-primary w-full mt-2" onClick={() => setStep(2)}>Next</button>
            <button className="btn-ghost w-full mt-2" onClick={onClose}>Skip</button>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-xl font-bold mb-2">Get Matched!</h2>
            <p className="mb-4 text-support/80">Take the DNA survey to find your most compatible co-founders and start building together.</p>
            <button className="btn-primary w-full mt-2" onClick={onDnaSurvey}>Start DNA Survey</button>
            <button className="btn-ghost w-full mt-2" onClick={onClose}>Maybe Later</button>
          </>
        )}
      </div>
    </div>
  );
} 
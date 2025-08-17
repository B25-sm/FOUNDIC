import React, { useState } from 'react';

export default function ValuationEstimator() {
  const [users, setUsers] = useState('');
  const [revenue, setRevenue] = useState('');
  const [growth, setGrowth] = useState('');
  const [valuation, setValuation] = useState<number | null>(null);

  const handleEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple formula: (users * 10) + (revenue * 5) * (growth factor)
    const u = parseInt(users) || 0;
    const r = parseInt(revenue) || 0;
    const g = growth === 'fast' ? 2 : growth === 'steady' ? 1.2 : 1;
    setValuation(Math.round((u * 10 + r * 5) * g));
  };

  return (
    <div className="card p-6 mb-8 animate-fade-in-up">
      <h2 className="text-lg font-bold mb-4">Valuation Estimator</h2>
      <form className="flex flex-col gap-3" onSubmit={handleEstimate}>
        <input
          className="input-field"
          type="number"
          min="0"
          placeholder="Active users"
          value={users}
          onChange={e => setUsers(e.target.value)}
          required
        />
        <input
          className="input-field"
          type="number"
          min="0"
          placeholder="Monthly revenue ($)"
          value={revenue}
          onChange={e => setRevenue(e.target.value)}
          required
        />
        <select
          className="input-field"
          value={growth}
          onChange={e => setGrowth(e.target.value)}
          required
        >
          <option value="" disabled>Growth rate</option>
          <option value="fast">Fast</option>
          <option value="steady">Steady</option>
          <option value="slow">Slow</option>
        </select>
        <button className="btn-primary mt-2" type="submit">Estimate</button>
      </form>
      {valuation !== null && (
        <div className="mt-4 text-xl font-bold gradient-text">Estimated Valuation: ${valuation.toLocaleString()}</div>
      )}
    </div>
  );
} 

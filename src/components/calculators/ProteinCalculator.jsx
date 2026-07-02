import { useState, useCallback } from 'react';
import InputField from '../ui/InputField';
import ResultCard from '../ui/ResultCard';
import { calculateProteinTarget, lbsToKg, PROTEIN_GOAL_LABELS } from '../../lib/calculations';
import { trackCalculatorCompleted } from '../../lib/analytics';

const GOAL_OPTIONS = Object.entries(PROTEIN_GOAL_LABELS).map(([value, { label, desc }]) => ({
  value, label, desc,
}));

export default function ProteinCalculator() {
  const [unit, setUnit] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('unit') : null) || 'imperial');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('muscle_gain');
  const [results, setResults] = useState(null);

  const calculate = useCallback(() => {
    const w = Number(weight);
    if (!w || w < 20 || w > 300) return;
    const w_kg = unit === 'metric' ? w : lbsToKg(w);
    const r = calculateProteinTarget(w_kg, goal);
    setResults(r);
    trackCalculatorCompleted('protein', { goal });
  }, [weight, goal, unit]);

  // Auto-calculate
  const handleWeightChange = (e) => {
    setWeight(e.target.value);
    const w = Number(e.target.value);
    if (w >= 20 && w <= 300) {
      const w_kg = unit === 'metric' ? w : lbsToKg(w);
      setResults(calculateProteinTarget(w_kg, goal));
    }
  };

  const handleGoalChange = (newGoal) => {
    setGoal(newGoal);
    const w = Number(weight);
    if (w >= 20 && w <= 300) {
      const w_kg = unit === 'metric' ? w : lbsToKg(w);
      setResults(calculateProteinTarget(w_kg, newGoal));
      trackCalculatorCompleted('protein', { goal: newGoal });
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Form */}
      <div className="card space-y-5">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Your Details</h2>

        {/* Unit toggle */}
        <div className="segment-control">
          {['metric', 'imperial'].map(u => (
            <button key={u} onClick={() => { setUnit(u); localStorage.setItem('unit', u); calculate(); }}
              className={`segment-option${unit === u ? ' active' : ''}`}>
              {u === 'metric' ? 'Metric' : 'Imperial'}
            </button>
          ))}
        </div>

        <InputField
          id="protein-weight"
          label={`Body Weight (${unit === 'metric' ? 'kg' : 'lbs'})`}
          type="number"
          value={weight}
          onChange={handleWeightChange}
          placeholder={unit === 'metric' ? 'e.g. 80' : 'e.g. 175'}
          min={20} max={300}
          suffix={unit === 'metric' ? 'kg' : 'lbs'}
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Your Goal</label>
          <div className="space-y-1 p-1.5 rounded-xl" style={{ background: 'var(--bg-subtle)' }}>
            {GOAL_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleGoalChange(opt.value)}
                className="w-full text-left p-3 rounded-lg transition-all duration-150"
                style={{
                  background: goal === opt.value ? 'var(--bg-card)' : 'transparent',
                  boxShadow: goal === opt.value ? 'var(--shadow-sm)' : 'none',
                  cursor: 'pointer',
                }}
                aria-pressed={goal === opt.value}
              >
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {opt.label}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {!results ? (
          <div className="card flex flex-col items-center justify-center text-center py-12">
            <div className="w-[56px] h-[56px] rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--accent-light)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M19 10v1c0 3.31-2.69 6-6 6a6 6 0 0 1-6-6v-1m12 0h-2m-8 0H5m7 7v4" />
              </svg>
            </div>
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)', font: '600 16px var(--font-sans)' }}>Enter your weight</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)', font: '400 14px var(--font-sans)' }}>Your protein targets will appear here</p>
          </div>
        ) : (
          <div className="space-y-4 animate-slide-up">
            <ResultCard
              label="DAILY PROTEIN TARGET"
              value={results.daily_g}
              unit="grams/day"
              subLabel={`${results.g_per_kg}g per kg of bodyweight`}
              accentColor="var(--accent-green)"
              size="large"
            />

            <div className="card space-y-3">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Per-Meal Breakdown</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { meals: 3, g: results.per_meal_3 },
                  { meals: 4, g: results.per_meal_4 },
                  { meals: 5, g: results.per_meal_5 },
                ].map(({ meals, g }) => (
                  <div key={meals} className="text-center p-3 rounded-xl"
                    style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                    <div className="font-mono font-bold text-xl" style={{ color: 'var(--accent)' }}>{g}g</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{meals} meals/day</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card space-y-3">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Food Equivalents</h3>
              <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span>🍗 Chicken breast (~31g/100g)</span>
                  <span className="font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>
                    {results.chicken_breasts} servings
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>🥚 Large eggs (~6g/egg)</span>
                  <span className="font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>
                    {results.eggs} eggs
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

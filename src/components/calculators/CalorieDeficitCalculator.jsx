import { useState, useCallback } from 'react';
import InputField from '../ui/InputField';
import ResultCard from '../ui/ResultCard';
import { calculateCalorieDeficit, lbsToKg } from '../../lib/calculations';
import { trackCalculatorCompleted } from '../../lib/analytics';

export default function CalorieDeficitCalculator() {
  const [unit, setUnit] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('unit') : null) || 'imperial');
  const [tdee, setTdee] = useState('');
  const [targetCalories, setTargetCalories] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const calculate = useCallback(() => {
    const tdeeNum = Number(tdee);
    const targetNum = Number(targetCalories);
    const curW = Number(currentWeight);
    const goalW = Number(goalWeight);

    if (!tdeeNum || tdeeNum < 1000 || tdeeNum > 5000) {
      setError('Enter a valid TDEE (1000–5000 kcal)');
      return;
    }
    if (!targetNum || targetNum < 500 || targetNum > 5000) {
      setError('Enter a valid target calorie intake (500–5000 kcal)');
      return;
    }
    if (targetNum > tdeeNum) {
      setError('Target calories must be less than TDEE for a deficit');
      return;
    }
    setError('');

    const curW_kg = unit === 'metric' ? curW : (curW ? lbsToKg(curW) : null);
    const goalW_kg = unit === 'metric' ? goalW : (goalW ? lbsToKg(goalW) : null);

    const r = calculateCalorieDeficit(tdeeNum, targetNum, curW_kg, goalW_kg);
    setResults(r);
    trackCalculatorCompleted('calorie_deficit');
  }, [tdee, targetCalories, currentWeight, goalWeight, unit]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Form */}
      <div className="card space-y-5">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Your Numbers</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Don't know your TDEE? <a href="/" style={{ color: 'var(--accent)' }}>Calculate it first →</a>
          </p>
        </div>

        {/* Unit toggle */}
        <div className="segment-control">
          {['metric', 'imperial'].map(u => (
            <button key={u} onClick={() => { setUnit(u); localStorage.setItem('unit', u); }}
              className={`segment-option${unit === u ? ' active' : ''}`}>
              {u === 'metric' ? 'Metric' : 'Imperial'}
            </button>
          ))}
        </div>

        <InputField
          id="tdee"
          label="Your TDEE (Total Daily Energy Expenditure)"
          type="number"
          value={tdee}
          onChange={e => setTdee(e.target.value)}
          placeholder="e.g. 2400"
          min={1000} max={5000}
          suffix="kcal"
          helpText="How many calories your body burns per day"
        />

        <InputField
          id="targetCalories"
          label="Daily Calorie Target"
          type="number"
          value={targetCalories}
          onChange={e => setTargetCalories(e.target.value)}
          placeholder="e.g. 1900"
          min={500} max={5000}
          suffix="kcal"
          helpText="How many calories you plan to eat per day"
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <InputField
            id="currentWeight"
            label={`Current Weight (${unit === 'metric' ? 'kg' : 'lbs'})`}
            type="number"
            value={currentWeight}
            onChange={e => setCurrentWeight(e.target.value)}
            placeholder={unit === 'metric' ? 'e.g. 85' : 'e.g. 185'}
            suffix={unit === 'metric' ? 'kg' : 'lbs'}
            helpText="Optional — needed for timeline estimate"
          />
          <InputField
            id="goalWeight"
            label={`Goal Weight (${unit === 'metric' ? 'kg' : 'lbs'})`}
            type="number"
            value={goalWeight}
            onChange={e => setGoalWeight(e.target.value)}
            placeholder={unit === 'metric' ? 'e.g. 75' : 'e.g. 165'}
            suffix={unit === 'metric' ? 'kg' : 'lbs'}
            helpText="Optional — needed for timeline estimate"
          />
        </div>

        {error && (
          <p className="text-sm font-medium" style={{ color: 'var(--accent-orange)' }}>{error}</p>
        )}

        <button className="btn-primary w-full justify-center" onClick={calculate}>
          Calculate My Deficit
        </button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {!results ? (
          <div className="card flex flex-col items-center justify-center text-center py-12">
            <div className="w-[56px] h-[56px] rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--accent-light)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)', font: '600 16px var(--font-sans)' }}>Enter your numbers</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)', font: '400 14px var(--font-sans)' }}>Your deficit breakdown will appear here</p>
          </div>
        ) : (
          <div className="space-y-4 animate-slide-up">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard
                label="DAILY DEFICIT"
                value={results.dailyDeficit}
                unit="kcal"
                accentColor="var(--accent-orange)"
                size="medium"
              />
              <ResultCard
                label="WEEKLY DEFICIT"
                value={results.weeklyDeficit}
                unit="kcal"
                accentColor="var(--accent-blue)"
                size="medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ResultCard
                label="WEEKLY LOSS"
                value={unit === 'metric' ? results.weeklyLossKg : results.weeklyLossLbs}
                unit={unit === 'metric' ? 'kg/week' : 'lbs/week'}
                accentColor="var(--accent-green)"
                size="medium"
              />
              {results.weeksToGoal && (
                <ResultCard
                  label="TIME TO GOAL"
                  value={results.weeksToGoal}
                  unit="weeks"
                  subLabel={`≈ ${results.monthsToGoal} month${results.monthsToGoal !== 1 ? 's' : ''}`}
                  size="medium"
                />
              )}
            </div>

            <div className="card">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Rule of thumb: </strong>
                A deficit of ~3,500 kcal per week equals approximately 1 lb (0.45 kg) of fat loss.
                At a {results.dailyDeficit.toLocaleString()} kcal daily deficit, you can expect to lose about {unit === 'metric' ? results.weeklyLossKg + ' kg' : results.weeklyLossLbs + ' lbs'} per week.
                Recalculate every 4–6 weeks as your body weight changes.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

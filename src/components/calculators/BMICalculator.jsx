import { useState } from 'react';
import InputField from '../ui/InputField';
import { calculateBMI, lbsToKg, ftInToCm } from '../../lib/calculations';
import { trackCalculatorCompleted } from '../../lib/analytics';

const BMI_COLORS = {
  blue:   'var(--text-muted)',
  green:  'var(--fat)',
  orange: 'var(--warning)',
  red:    'var(--carbs)',
};

const BMI_RANGES = [
  { range: '< 18.5',   label: 'Underweight',    color: 'blue' },
  { range: '18.5–24.9', label: 'Normal Weight',  color: 'green' },
  { range: '25.0–29.9', label: 'Overweight',     color: 'orange' },
  { range: '≥ 30.0',   label: 'Obese',           color: 'red' },
];

export default function BMICalculator() {
  const [unit, setUnit] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('unit') : null) || 'imperial');
  const [weight, setWeight] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [result, setResult] = useState(null);

  const calculate = (w = weight, hcm = heightCm, hft = heightFt, hin = heightIn, u = unit) => {
    const w_num = Number(w);
    const w_kg = u === 'metric' ? w_num : lbsToKg(w_num);
    const h_cm = u === 'metric' ? Number(hcm) : ftInToCm(Number(hft), Number(hin || 0));
    if (!w_kg || !h_cm || w_kg < 20 || h_cm < 100) return;
    const r = calculateBMI(w_kg, h_cm);
    setResult(r);
    trackCalculatorCompleted('bmi');
  };

  // Calculate needle position on BMI gauge (10–45 range clamped)
  const bmiGaugePosition = result
    ? Math.min(Math.max(((result.bmi - 10) / 35) * 100, 0), 100)
    : 50;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Form */}
      <div className="card space-y-5">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Calculate Your BMI</h2>

        {/* Unit toggle */}
        <div className="segment-control">
          {['metric', 'imperial'].map(u => (
            <button key={u}
              onClick={() => { setUnit(u); localStorage.setItem('unit', u); calculate(weight, heightCm, heightFt, heightIn, u); }}
              className={`segment-option${unit === u ? ' active' : ''}`}>
              {u === 'metric' ? 'Metric' : 'Imperial'}
            </button>
          ))}
        </div>

        {/* Height */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium block" style={{ color: 'var(--text-primary)' }}>Height</label>
          {unit === 'metric' ? (
            <InputField
              id="bmi-heightCm"
              type="number"
              value={heightCm}
              onChange={e => { setHeightCm(e.target.value); calculate(weight, e.target.value, heightFt, heightIn); }}
              placeholder="e.g. 175"
              min={100} max={250}
              suffix="cm"
            />
          ) : (
            <div className="flex gap-2">
              <InputField
                id="bmi-heightFt"
                type="number"
                value={heightFt}
                onChange={e => { setHeightFt(e.target.value); calculate(weight, heightCm, e.target.value, heightIn); }}
                placeholder="5"
                min={3} max={8}
                suffix="ft"
              />
              <InputField
                id="bmi-heightIn"
                type="number"
                value={heightIn}
                onChange={e => { setHeightIn(e.target.value); calculate(weight, heightCm, heightFt, e.target.value); }}
                placeholder="10"
                min={0} max={11}
                suffix="in"
              />
            </div>
          )}
        </div>

        {/* Weight */}
        <InputField
          id="bmi-weight"
          label={`Weight (${unit === 'metric' ? 'kg' : 'lbs'})`}
          type="number"
          value={weight}
          onChange={e => { setWeight(e.target.value); calculate(e.target.value, heightCm, heightFt, heightIn); }}
          placeholder={unit === 'metric' ? 'e.g. 75' : 'e.g. 165'}
          min={30} max={300}
          suffix={unit === 'metric' ? 'kg' : 'lbs'}
        />

        {/* BMI Range table */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-subtle)' }}>
                <th className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>BMI</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Category</th>
              </tr>
            </thead>
            <tbody>
              {BMI_RANGES.map((row, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)', background: result?.color === row.color ? `${BMI_COLORS[row.color]}10` : 'transparent' }}>
                  <td className="px-4 py-2.5 font-mono" style={{ color: BMI_COLORS[row.color] }}>{row.range}</td>
                  <td className="px-4 py-2.5 font-medium" style={{ color: result?.color === row.color ? BMI_COLORS[row.color] : 'var(--text-secondary)' }}>
                    {result?.color === row.color && '→ '}{row.label}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {!result ? (
          <div className="card flex flex-col items-center justify-center text-center py-12">
            <div className="w-[56px] h-[56px] rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--accent-light)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="8" y="2" width="8" height="20" rx="2" ry="2" />
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="10" y1="8" x2="14" y2="8" />
                <line x1="10" y1="12" x2="14" y2="12" />
                <line x1="10" y1="16" x2="14" y2="16" />
              </svg>
            </div>
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)', font: '600 16px var(--font-sans)' }}>Enter your height & weight</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)', font: '400 14px var(--font-sans)' }}>Your BMI will appear here</p>
          </div>
        ) : (
          <div className="space-y-4 animate-slide-up">
            <div className="card text-center">
              <div className="section-label mb-2">YOUR BMI</div>
              <div className="font-mono font-bold" style={{ fontSize: '64px', lineHeight: 1, color: BMI_COLORS[result.color] }}>
                {result.bmi}
              </div>
              <div className="mt-3">
                <span
                  className="badge text-base px-4 py-1.5"
                  style={{
                    background: `${BMI_COLORS[result.color]}20`,
                    color: BMI_COLORS[result.color],
                    border: `1px solid ${BMI_COLORS[result.color]}40`,
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  {result.category}
                </span>
              </div>

              {/* BMI Gauge */}
              <div className="mt-6 relative">
                <div className="h-3 rounded-full overflow-hidden" style={{
                  background: `linear-gradient(to right, var(--text-muted), var(--fat) 30%, var(--warning) 65%, var(--carbs))`,
                }} />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-lg transition-all duration-500"
                  style={{
                    left: `calc(${bmiGaugePosition}% - 10px)`,
                    background: BMI_COLORS[result.color],
                  }}
                />
                <div className="flex justify-between mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span>10</span><span>18.5</span><span>25</span><span>30</span><span>45</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>What's next?</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                BMI is a screening tool, not a diagnosis. The most actionable next step is to calculate how many calories your body burns daily, then set a realistic goal.
              </p>
              <a href="/" className="btn-primary" style={{ width: '100%', justifyContent: 'center', display: 'flex', textDecoration: 'none' }}>
                Calculate Your TDEE &amp; Macros →
              </a>
            </div>

            <div className="disclaimer">
              BMI does not distinguish between muscle and fat. A muscular person may have a high BMI despite low body fat. Use in combination with other health metrics.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

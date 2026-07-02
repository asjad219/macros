import { useState, useEffect, useCallback } from 'react';
import { Share2, Info, AlertTriangle } from 'lucide-react';
import {
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  calculateMacros,
  calculateTimeline,
  lbsToKg,
  ftInToCm,
  kgToLbs,
  cmToFtIn,
  ACTIVITY_LABELS,
  GOAL_LABELS,
  DIET_LABELS,
} from '../../lib/calculations';
import { trackCalculatorCompleted, trackFormulaChanged, trackUnitToggled, trackResultsShared } from '../../lib/analytics';
import DonutChart from '../ui/DonutChart';
import MacroBar from '../ui/MacroBar';
import ResultCard from '../ui/ResultCard';
import ToggleGroup from '../ui/ToggleGroup';
import InputField from '../ui/InputField';

const FORMULA_OPTIONS = [
  { value: 'mifflin', label: 'Mifflin-St Jeor', desc: 'Most accurate for the general population (1990). Recommended for most users.' },
  { value: 'harris',  label: 'Harris-Benedict', desc: 'Revised 1984. Slightly higher estimates. Classic formula used for decades.' },
  { value: 'katch',   label: 'Katch-McArdle', desc: 'Uses lean body mass — most accurate if you know your body fat %.' },
];

const SEX_OPTIONS = [
  { value: 'male',   label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other',  label: 'Other' },
];

const UNIT_OPTIONS = [
  { value: 'metric',   label: 'Metric (kg/cm)' },
  { value: 'imperial', label: 'Imperial (lbs/ft)' },
];

const ACTIVITY_OPTIONS = Object.entries(ACTIVITY_LABELS).map(([value, { label, desc }]) => ({
  value, label, desc,
}));

const GOAL_OPTIONS = Object.entries(GOAL_LABELS).map(([value, { label, desc }]) => ({
  value, label, desc,
}));

const DIET_OPTIONS = Object.entries(DIET_LABELS).map(([value, { label, desc }]) => ({
  value, label, desc,
}));

const DEFAULT_FORM = {
  age: '',
  sex: 'male',
  weightKg: '',
  weightLbs: '',
  heightCm: '',
  heightFt: '',
  heightIn: '',
  activity: 'moderate',
  goal: 'moderate_cut',
  diet: 'standard',
  formula: 'mifflin',
  bodyFatPct: '',
  goalWeightKg: '',
  goalWeightLbs: '',
};

function validate(form, unit, formula) {
  const errors = {};
  const age = Number(form.age);
  if (!form.age || age < 15 || age > 80) errors.age = 'Age must be between 15 and 80';

  if (unit === 'metric') {
    const w = Number(form.weightKg);
    const h = Number(form.heightCm);
    if (!form.weightKg || w < 30 || w > 300) errors.weight = 'Enter a valid weight (30–300 kg)';
    if (!form.heightCm || h < 100 || h > 250) errors.height = 'Enter a valid height (100–250 cm)';
  } else {
    const w = Number(form.weightLbs);
    const ft = Number(form.heightFt);
    const ins = Number(form.heightIn || 0);
    if (!form.weightLbs || w < 66 || w > 660) errors.weight = 'Enter a valid weight (66–660 lbs)';
    if (!form.heightFt || ft < 3 || ft > 8) errors.height = 'Enter a valid height (3–8 ft)';
    if (ins < 0 || ins > 11) errors.heightIn = 'Inches must be 0–11';
  }

  if (formula === 'katch') {
    const bf = Number(form.bodyFatPct);
    if (!form.bodyFatPct || bf < 3 || bf > 60) errors.bodyFat = 'Enter a valid body fat % (3–60%)';
  }

  return errors;
}

export default function TDEECalculator() {
  const [unit, setUnit] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('unit') : null) || 'imperial');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});
  const [copied, setCopied] = useState(false);
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);

  const handleUnitChange = useCallback((newUnit) => {
    // Convert values when toggling
    setForm(prev => {
      const next = { ...prev };
      if (newUnit === 'metric' && prev.weightLbs) {
        next.weightKg = Math.round(lbsToKg(Number(prev.weightLbs)) * 10) / 10;
      } else if (newUnit === 'imperial' && prev.weightKg) {
        next.weightLbs = Math.round(kgToLbs(Number(prev.weightKg)) * 10) / 10;
      }
      if (newUnit === 'metric' && prev.heightFt) {
        next.heightCm = Math.round(ftInToCm(Number(prev.heightFt), Number(prev.heightIn || 0)));
      } else if (newUnit === 'imperial' && prev.heightCm) {
        const { ft, inches } = cmToFtIn(Number(prev.heightCm));
        next.heightFt = ft;
        next.heightIn = inches;
      }
      return next;
    });
    setUnit(newUnit);
    localStorage.setItem('unit', newUnit);
    trackUnitToggled(newUnit);
  }, []);

  const calculate = useCallback(() => {
    const validationErrors = validate(form, unit, form.formula);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    // Resolve to metric internally
    const weight_kg = unit === 'metric'
      ? Number(form.weightKg)
      : lbsToKg(Number(form.weightLbs));
    const height_cm = unit === 'metric'
      ? Number(form.heightCm)
      : ftInToCm(Number(form.heightFt), Number(form.heightIn || 0));
    const age = Number(form.age);
    const body_fat_pct = form.bodyFatPct ? Number(form.bodyFatPct) : null;

    const bmr = calculateBMR({ weight_kg, height_cm, age, sex: form.sex, formula: form.formula, body_fat_pct });
    const tdee = calculateTDEE(bmr, form.activity);
    const targetCalories = calculateTargetCalories(tdee, form.goal, bmr);
    const macros = calculateMacros(targetCalories, form.diet, weight_kg);

    let timeline = null;
    const goalWeight_kg = unit === 'metric'
      ? (form.goalWeightKg ? Number(form.goalWeightKg) : null)
      : (form.goalWeightLbs ? lbsToKg(Number(form.goalWeightLbs)) : null);
    if (goalWeight_kg) {
      timeline = calculateTimeline(tdee, targetCalories, weight_kg, goalWeight_kg);
    }

    const r = { bmr: Math.round(bmr), tdee, targetCalories, macros, timeline, weight_kg };
    setResults(r);
    trackCalculatorCompleted('tdee_macro', { goal: form.goal, diet_type: form.diet, unit_system: unit, formula: form.formula });
  }, [form, unit]);

  // Auto-calculate when all required fields are filled
  useEffect(() => {
    const hasRequiredFields = form.age &&
      (unit === 'metric' ? (form.weightKg && form.heightCm) : (form.weightLbs && form.heightFt));
    if (hasRequiredFields) calculate();
  }, [form, unit]);

  const handleFormChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleFormulaChange = (newFormula) => {
    const old = form.formula;
    setForm(prev => ({ ...prev, formula: newFormula }));
    if (old !== newFormula) trackFormulaChanged(old, newFormula);
  };

  const copyResults = () => {
    if (!results) return;
    const text = `
📊 My CalcMacros Results
━━━━━━━━━━━━━━━━━━━━━
🔥 TDEE: ${results.tdee.toLocaleString()} calories/day
🎯 Target: ${results.targetCalories.toLocaleString()} calories/day
━━━━━━━━━━━━━━━━━━━━━
💪 Protein: ${results.macros.protein.grams}g (${results.macros.protein.calories} kcal)
🍞 Carbs:   ${results.macros.carbs.grams}g (${results.macros.carbs.calories} kcal)
🥑 Fat:     ${results.macros.fat.grams}g (${results.macros.fat.calories} kcal)
━━━━━━━━━━━━━━━━━━━━━
Calculated at macrocalc.app
    `.trim();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      trackResultsShared('clipboard');
    });
  };

  const totalCaloriesToal = results
    ? results.macros.protein.calories + results.macros.carbs.calories + results.macros.fat.calories
    : 0;

  const proteinPct = results && totalCaloriesToal > 0
    ? (results.macros.protein.calories / totalCaloriesToal) * 100 : 0;
  const carbsPct = results && totalCaloriesToal > 0
    ? (results.macros.carbs.calories / totalCaloriesToal) * 100 : 0;
  const fatPct = results && totalCaloriesToal > 0
    ? (results.macros.fat.calories / totalCaloriesToal) * 100 : 0;

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
      {/* ── FORM PANEL ── */}
      <div className="card space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Your Details
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Results update automatically as you type
            </p>
          </div>
          {/* Unit Toggle */}
          <div className="segment-control">
            {UNIT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleUnitChange(opt.value)}
                className={`segment-option${unit === opt.value ? ' active' : ''}`}
              >
                {opt.value === 'metric' ? 'Metric' : 'Imperial'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Age */}
          <InputField
            id="age"
            label="Age"
            type="number"
            value={form.age}
            onChange={handleFormChange('age')}
            placeholder="e.g. 28"
            min={15} max={80}
            suffix="years"
            error={errors.age}
          />

          {/* Sex */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Sex</label>
            <div className="segment-control">
              {SEX_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setForm(prev => ({ ...prev, sex: opt.value }))}
                  className={`segment-option${form.sex === opt.value ? ' active' : ''}`}
                  aria-pressed={form.sex === opt.value}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Height */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Height</label>
          {unit === 'metric' ? (
            <InputField
              id="heightCm"
              type="number"
              value={form.heightCm}
              onChange={handleFormChange('heightCm')}
              placeholder="e.g. 178"
              min={100} max={250}
              suffix="cm"
              error={errors.height}
            />
          ) : (
            <div className="flex gap-2">
              <InputField
                id="heightFt"
                type="number"
                value={form.heightFt}
                onChange={handleFormChange('heightFt')}
                placeholder="5"
                min={3} max={8}
                suffix="ft"
                error={errors.height}
              />
              <InputField
                id="heightIn"
                type="number"
                value={form.heightIn}
                onChange={handleFormChange('heightIn')}
                placeholder="10"
                min={0} max={11}
                suffix="in"
                error={errors.heightIn}
              />
            </div>
          )}
        </div>

        {/* Weight */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Weight</label>
          {unit === 'metric' ? (
            <InputField
              id="weightKg"
              type="number"
              value={form.weightKg}
              onChange={handleFormChange('weightKg')}
              placeholder="e.g. 80"
              min={30} max={300}
              suffix="kg"
              error={errors.weight}
            />
          ) : (
            <InputField
              id="weightLbs"
              type="number"
              value={form.weightLbs}
              onChange={handleFormChange('weightLbs')}
              placeholder="e.g. 175"
              min={66} max={660}
              suffix="lbs"
              error={errors.weight}
            />
          )}
        </div>

        {/* Activity Level */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Activity Level</label>
          <div className="space-y-1 p-1.5 rounded-xl" style={{ background: 'var(--bg-subtle)' }}>
            {ACTIVITY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setForm(prev => ({ ...prev, activity: opt.value }))}
                className="w-full text-left p-3 rounded-lg transition-all duration-150"
                style={{
                  background: form.activity === opt.value ? 'var(--bg-card)' : 'transparent',
                  boxShadow: form.activity === opt.value ? 'var(--shadow-sm)' : 'none',
                  cursor: 'pointer',
                }}
                aria-pressed={form.activity === opt.value}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {opt.label}
                  </span>
                  {form.activity === opt.value && (
                    <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
                  )}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {opt.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Goal */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Goal</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-subtle)' }}>
            {GOAL_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setForm(prev => ({ ...prev, goal: opt.value }))}
                className="text-left p-3 rounded-lg transition-all duration-150"
                style={{
                  background: form.goal === opt.value ? 'var(--bg-card)' : 'transparent',
                  boxShadow: form.goal === opt.value ? 'var(--shadow-sm)' : 'none',
                  cursor: 'pointer',
                }}
                aria-pressed={form.goal === opt.value}
              >
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {opt.label}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {opt.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Diet Type */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Diet Type</label>
          <div className="space-y-1 p-1.5 rounded-xl" style={{ background: 'var(--bg-subtle)' }}>
            {DIET_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setForm(prev => ({ ...prev, diet: opt.value }))}
                className="w-full text-left p-3 rounded-lg transition-all duration-150"
                style={{
                  background: form.diet === opt.value ? 'var(--bg-card)' : 'transparent',
                  boxShadow: form.diet === opt.value ? 'var(--shadow-sm)' : 'none',
                  cursor: 'pointer',
                }}
                aria-pressed={form.diet === opt.value}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {opt.label}
                  </span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {opt.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* BMR Formula */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>BMR Formula</label>
            <button
              onClick={() => setShowFormulaInfo(!showFormulaInfo)}
              className="p-1 rounded-md"
              aria-label="Formula information"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Info size={14} />
            </button>
          </div>
          <div className="segment-control">
            {FORMULA_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleFormulaChange(opt.value)}
                className={`segment-option${form.formula === opt.value ? ' active' : ''}`}
                title={opt.desc}
                aria-pressed={form.formula === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {showFormulaInfo && (
            <div className="rounded-xl p-4 text-sm space-y-2 animate-fade-in" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
              {FORMULA_OPTIONS.map(opt => (
                <div key={opt.value}>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{opt.label}: </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{opt.desc}</span>
                </div>
              ))}
            </div>
          )}
          {/* Body fat input for Katch-McArdle */}
          {form.formula === 'katch' && (
            <InputField
              id="bodyFatPct"
              label="Body Fat Percentage"
              type="number"
              value={form.bodyFatPct}
              onChange={handleFormChange('bodyFatPct')}
              placeholder="e.g. 18"
              min={3} max={60}
              suffix="%"
              helpText="Required for the Katch-McArdle formula"
              error={errors.bodyFat}
            />
          )}
        </div>

        {/* Optional goal weight */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Goal Weight <span className="font-normal" style={{ color: 'var(--text-secondary)' }}>(optional — for timeline estimate)</span>
          </label>
          {unit === 'metric' ? (
            <InputField
              id="goalWeightKg"
              type="number"
              value={form.goalWeightKg}
              onChange={handleFormChange('goalWeightKg')}
              placeholder="e.g. 70"
              min={30} max={300}
              suffix="kg"
            />
          ) : (
            <InputField
              id="goalWeightLbs"
              type="number"
              value={form.goalWeightLbs}
              onChange={handleFormChange('goalWeightLbs')}
              placeholder="e.g. 155"
              min={66} max={660}
              suffix="lbs"
            />
          )}
        </div>
      </div>

      {/* ── RESULTS PANEL ── */}
      <div className="lg:sticky lg:top-20 space-y-4">
        {!results ? (
          <div
            className="card flex flex-col items-center justify-center text-center"
            style={{ gap: '12px', minHeight: '300px' }}
          >
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: '56px', height: '56px', background: 'var(--accent-light)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"/>
              </svg>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Fill in your details
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
              Results appear instantly as you type
            </p>
          </div>
        ) : (
          <>
            {/* Calorie cards */}
            <div className="grid grid-cols-2 gap-3">
              <ResultCard
                label="YOUR TDEE"
                value={results.tdee}
                unit="kcal/day"
                subLabel="Total daily calorie burn"
                accentColor="var(--accent)"
                size="medium"
              />
              <ResultCard
                label="TARGET"
                value={results.targetCalories}
                unit="kcal/day"
                subLabel={GOAL_LABELS[form.goal]?.label}
                accentColor="var(--accent)"
                size="medium"
              />
            </div>

            {/* BMR card */}
            <ResultCard
              label="BASAL METABOLIC RATE (BMR)"
              value={results.bmr}
              unit="kcal/day"
              subLabel="Calories burned at complete rest. Never eat below this long-term."
              size="small"
            />

            {/* Donut chart */}
            <div className="card">
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Macro Split
              </h3>
              <DonutChart
                protein={results.macros.protein.grams}
                carbs={results.macros.carbs.grams}
                fat={results.macros.fat.grams}
                totalCalories={results.targetCalories}
              />
            </div>

            {/* Macro bars */}
            <div className="card space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Daily Macros
              </h3>
              <MacroBar
                macro="protein"
                grams={results.macros.protein.grams}
                calories={results.macros.protein.calories}
                percentage={proteinPct}
              />
              <MacroBar
                macro="carbs"
                grams={results.macros.carbs.grams}
                calories={results.macros.carbs.calories}
                percentage={carbsPct}
              />
              <MacroBar
                macro="fat"
                grams={results.macros.fat.grams}
                calories={results.macros.fat.calories}
                percentage={fatPct}
              />

              {/* Protein floor notice */}
              {results.macros.protein_floor_applied && (
                <div className="protein-floor-notice">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>Protein floor applied — minimum 1.6g/kg to protect muscle mass while in a deficit.</span>
                </div>
              )}
            </div>

            {/* Timeline */}
            {results.timeline && results.timeline.weeks_to_goal && (
              <div className="card">
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Estimated Timeline
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-xl" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                    <div className="font-mono font-bold text-2xl" style={{ color: 'var(--accent)' }}>
                      {unit === 'metric'
                        ? `${results.timeline.weekly_change_kg}kg`
                        : `${results.timeline.weekly_change_lbs}lbs`}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>per week</div>
                  </div>
                  <div className="text-center p-3 rounded-xl" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                    <div className="font-mono font-bold text-2xl" style={{ color: 'var(--accent-orange)' }}>
                      {results.timeline.weeks_to_goal}w
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>to goal weight</div>
                  </div>
                </div>
                <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>
                  ≈ {results.timeline.months_to_goal} month{results.timeline.months_to_goal !== 1 ? 's' : ''} — Recalculate every 4–6 weeks as your body weight changes.
                </p>
              </div>
            )}

            {/* Share button */}
            <button
              onClick={copyResults}
              className="btn-secondary w-full justify-center"
            >
              <Share2 size={16} />
              {copied ? '✓ Copied to clipboard!' : 'Share my results'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

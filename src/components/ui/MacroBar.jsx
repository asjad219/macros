import { useEffect, useRef } from 'react';

const MACRO_COLORS = {
  protein: 'var(--accent)',
  carbs:   'var(--carbs)',
  fat:     'var(--fat)',
};

/**
 * Animated horizontal macro progress bar.
 * Width animates from 0 → value on mount or value change.
 */
export default function MacroBar({ macro, grams, calories, percentage }) {
  const fillRef = useRef(null);

  useEffect(() => {
    if (!fillRef.current) return;
    // Reset first
    fillRef.current.style.width = '0%';
    const id = setTimeout(() => {
      if (fillRef.current) fillRef.current.style.width = `${Math.min(percentage, 100)}%`;
    }, 80);
    return () => clearTimeout(id);
  }, [percentage]);

  const color = MACRO_COLORS[macro] || '#8B949E';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {macro.charAt(0).toUpperCase() + macro.slice(1)}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            {grams}g
          </span>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {calories} kcal
          </span>
        </div>
      </div>
      {/* Track */}
      <div className="macro-bar-track">
        <div
          ref={fillRef}
          className="macro-bar-fill"
          style={{
            width: '0%',
            backgroundColor: color,
            transition: 'width 600ms cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </div>
      <div className="flex justify-end">
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {Math.round(percentage)}% of calories
        </span>
      </div>
    </div>
  );
}

import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom SVG Donut Chart — no external library.
 * Animates stroke-dasharray on mount.
 */
export default function DonutChart({ protein, carbs, fat, totalCalories }) {
  const size = 180;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const totalGrams = protein + carbs + fat;
  if (totalGrams === 0) return null;

  // Calorie-weighted percentages (protein=4cal/g, carbs=4cal/g, fat=9cal/g)
  const proteinCals = protein * 4;
  const carbsCals   = carbs * 4;
  const fatCals     = fat * 9;
  const totalCals   = proteinCals + carbsCals + fatCals;

  const proteinPct = totalCals > 0 ? proteinCals / totalCals : 0;
  const carbsPct   = totalCals > 0 ? carbsCals / totalCals : 0;
  const fatPct     = totalCals > 0 ? fatCals / totalCals : 0;

  // Small gap between segments (in degrees)
  const GAP = 2;
  const gapFraction = GAP / 360;

  const segments = [
    { pct: proteinPct, color: 'var(--protein)', label: 'Protein' },
    { pct: carbsPct,   color: 'var(--carbs)', label: 'Carbs' },
    { pct: fatPct,     color: 'var(--fat)', label: 'Fat' },
  ];

  // Build segments — each occupies (pct - gap) of circle
  let cumulativePct = 0;
  const arcs = segments.map((seg) => {
    const start = cumulativePct;
    const actualPct = Math.max(seg.pct - gapFraction, 0);
    const dash = actualPct * circumference;
    const offset = circumference - start * circumference;
    cumulativePct += seg.pct;
    return { ...seg, dash, offset };
  });

  // Animate refs
  const circleRefs = useRef([]);
  const animFrame = useRef(null);

  const animate = useCallback(() => {
    const duration = 900;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      circleRefs.current.forEach((el, i) => {
        if (!el) return;
        const arc = arcs[i];
        el.style.strokeDasharray = `${arc.dash * eased} ${circumference}`;
        el.style.strokeDashoffset = arc.offset;
      });
      if (progress < 1) animFrame.current = requestAnimationFrame(tick);
    };
    animFrame.current = requestAnimationFrame(tick);
  }, [arcs, circumference]);

  useEffect(() => {
    // Reset then animate
    circleRefs.current.forEach((el) => {
      if (el) el.style.strokeDasharray = `0 ${circumference}`;
    });
    const id = setTimeout(animate, 50);
    return () => {
      clearTimeout(id);
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [protein, carbs, fat, animate, circumference]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke="var(--bg-subtle)"
            strokeWidth={strokeWidth}
          />
          {/* Segments */}
          {arcs.map((arc, i) => (
            <circle
              key={arc.label}
              ref={(el) => (circleRefs.current[i] = el)}
              cx={cx} cy={cy} r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              style={{
                strokeDasharray: `0 ${circumference}`,
                strokeDashoffset: arc.offset,
                transition: 'none',
              }}
            />
          ))}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono font-bold text-2xl leading-none" style={{ color: 'var(--text-primary)' }}>
            {totalCalories.toLocaleString()}
          </span>
          <span className="text-xs font-medium mt-1" style={{ color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
            CALORIES
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap justify-center">
        {[
          { label: 'Protein', grams: protein, color: 'var(--protein)', pct: Math.round(proteinPct * 100) },
          { label: 'Carbs',   grams: carbs,   color: 'var(--carbs)', pct: Math.round(carbsPct * 100) },
          { label: 'Fat',     grams: fat,      color: 'var(--fat)', pct: Math.round(fatPct * 100) },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {item.label} <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.pct}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

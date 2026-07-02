import { useEffect, useRef } from 'react';

/**
 * Count-up animation hook.
 * Animates a number from 0 to target in ~800ms.
 */
function useCountUp(target, duration = 800) {
  const ref = useRef(null);
  const frame = useRef(null);
  const prev = useRef(0);

  useEffect(() => {
    if (!ref.current) return;
    const start = prev.current;
    const diff = target - start;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(start + diff * eased);
      if (ref.current) ref.current.textContent = current.toLocaleString();
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        prev.current = target;
      }
    };
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(tick);
    return () => { if (frame.current) cancelAnimationFrame(frame.current); };
  }, [target, duration]);

  return ref;
}

/**
 * Result card with count-up animation.
 * Uses JetBrains Mono for the number display.
 */
export default function ResultCard({ label, value, unit, subLabel, accentColor, size = 'large', badge }) {
  const numRef = useCountUp(typeof value === 'number' ? value : 0);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '24px 24px',
        borderTop: accentColor ? `3px solid ${accentColor}` : undefined,
      }}
    >
      <div style={{
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
        marginBottom: '8px'
      }}>
        {label}
      </div>
      <div className="flex items-end gap-2 flex-wrap">
        <span
          ref={numRef}
          className="font-mono animate-count-up"
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '40px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1
          }}
        >
          {typeof value === 'number' ? value.toLocaleString() : '—'}
        </span>
        {unit && (
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {unit}
          </span>
        )}
        {badge && (
          <span className={`badge badge-${badge.color} ml-auto`}>{badge.text}</span>
        )}
      </div>
      {subLabel && (
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
          {subLabel}
        </p>
      )}
    </div>
  );
}

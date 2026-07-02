/**
 * Segmented toggle group — for unit system, sex, formula selection.
 */
export default function ToggleGroup({ options, value, onChange, label, id }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <div className="section-label">{label}</div>
      )}
      <div
        className="segment-control"
        role="group"
        aria-label={label}
        id={id}
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`segment-option${value === opt.value ? ' active' : ''}`}
            aria-pressed={value === opt.value}
            title={opt.desc || opt.label}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {/* Show description of selected option */}
      {options.find(o => o.value === value)?.desc && (
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {options.find(o => o.value === value).desc}
        </p>
      )}
    </div>
  );
}

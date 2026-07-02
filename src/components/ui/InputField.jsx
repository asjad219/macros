/**
 * Styled input field — 48px height, 16px font (prevents iOS zoom).
 */
export default function InputField({
  id,
  label,
  type = 'number',
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
  helpText,
  error,
  suffix,
  required,
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {label}
          {required && <span className="ml-1 text-xs" style={{ color: 'var(--accent-orange)' }}>*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          aria-describedby={helpText ? `${id}-help` : undefined}
          aria-invalid={!!error}
          className="input-field"
          style={error ? { borderColor: 'var(--accent-orange)' } : {}}
        />
        {suffix && (
          <span
            className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium pointer-events-none"
            style={{ color: 'var(--text-secondary)' }}
          >
            {suffix}
          </span>
        )}
      </div>
      {helpText && !error && (
        <p id={`${id}-help`} className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {helpText}
        </p>
      )}
      {error && (
        <p className="text-xs font-medium" style={{ color: 'var(--accent-orange)' }}>
          {error}
        </p>
      )}
    </div>
  );
}

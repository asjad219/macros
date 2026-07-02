/**
 * CalcMacros — Analytics Stub
 * Wraps GA4 events. Safe to call even if GA isn't loaded.
 */

function gtag(...args) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

export function trackCalculatorCompleted(calculatorName, params = {}) {
  gtag('event', 'calculator_completed', {
    calculator_name: calculatorName,
    ...params,
  });
}

export function trackFormulaChanged(oldFormula, newFormula) {
  gtag('event', 'formula_changed', {
    old_formula: oldFormula,
    new_formula: newFormula,
  });
}

export function trackUnitToggled(newUnit) {
  gtag('event', 'unit_toggled', { unit: newUnit });
}

export function trackResultsShared(method) {
  gtag('event', 'results_shared', { method });
}

export function trackFAQOpened(index, page) {
  gtag('event', 'faq_opened', { faq_index: index, page });
}

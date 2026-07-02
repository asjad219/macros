/**
 * CalcMacros — Core Calculation Library
 * Pure functions only. No side effects. No imports.
 */

// ─── Unit Converters ───────────────────────────────────────────────────────

export function lbsToKg(lbs) {
  return lbs / 2.20462;
}

export function kgToLbs(kg) {
  return kg * 2.20462;
}

export function ftInToCm(ft, inches = 0) {
  return (ft * 12 + inches) * 2.54;
}

export function cmToFtIn(cm) {
  const totalInches = cm / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { ft, inches };
}

// ─── BMR Formulas ──────────────────────────────────────────────────────────

/**
 * calculateBMR — supports 3 formulas.
 * @param {object} params
 * @param {number} params.weight_kg
 * @param {number} params.height_cm
 * @param {number} params.age
 * @param {'male'|'female'|'other'} params.sex
 * @param {'mifflin'|'harris'|'katch'} params.formula
 * @param {number|null} params.body_fat_pct
 * @returns {number} BMR in kcal/day
 */
export function calculateBMR({ weight_kg, height_cm, age, sex, formula = 'mifflin', body_fat_pct = null }) {
  const isFemale = sex === 'female';

  if (formula === 'katch' && body_fat_pct != null) {
    // Katch-McArdle: uses lean body mass
    const lbm = weight_kg * (1 - body_fat_pct / 100);
    return 370 + 21.6 * lbm;
  }

  if (formula === 'harris') {
    // Harris-Benedict Revised (1984 Roza & Shizgal)
    if (isFemale) {
      return 447.593 + (9.247 * weight_kg) + (3.098 * height_cm) - (4.330 * age);
    }
    return 88.362 + (13.397 * weight_kg) + (4.799 * height_cm) - (5.677 * age);
  }

  // Mifflin-St Jeor (1990) — default
  const base = (10 * weight_kg) + (6.25 * height_cm) - (5 * age);
  return isFemale ? base - 161 : base + 5;
}

// ─── TDEE ──────────────────────────────────────────────────────────────────

export const ACTIVITY_LABELS = {
  sedentary:   { label: 'Sedentary',          desc: 'Desk job, little or no exercise', multiplier: 1.2 },
  light:       { label: 'Lightly Active',      desc: 'Light exercise 1–3 days/week',   multiplier: 1.375 },
  moderate:    { label: 'Moderately Active',   desc: 'Moderate exercise 3–5 days/week',multiplier: 1.55 },
  active:      { label: 'Very Active',         desc: 'Hard exercise 6–7 days/week',    multiplier: 1.725 },
  very_active: { label: 'Extremely Active',    desc: 'Physical job + hard training',   multiplier: 1.9 },
};

/**
 * calculateTDEE
 * @param {number} bmr
 * @param {string} activity
 * @returns {number} TDEE rounded to nearest whole number
 */
export function calculateTDEE(bmr, activity) {
  const multiplier = ACTIVITY_LABELS[activity]?.multiplier ?? 1.55;
  return Math.round(bmr * multiplier);
}

// ─── Goal / Target Calories ────────────────────────────────────────────────

export const GOAL_LABELS = {
  aggressive_cut: { label: 'Aggressive Cut',    desc: '~1 lb/week loss — 500 kcal deficit',   deficit: 500 },
  moderate_cut:   { label: 'Moderate Cut',       desc: '~0.5 lb/week loss — 250 kcal deficit', deficit: 250 },
  maintain:       { label: 'Maintain Weight',    desc: 'Eat at TDEE — maintain current weight', deficit: 0  },
  lean_bulk:      { label: 'Lean Bulk',          desc: '~0.25 lb/week gain — 150 kcal surplus', deficit: -150 },
  bulk:           { label: 'Bulk',               desc: '~0.5 lb/week gain — 300 kcal surplus',  deficit: -300 },
};

/**
 * calculateTargetCalories
 * Enforces minimum of BMR (never eat below basal metabolic rate).
 * @param {number} tdee
 * @param {string} goal
 * @param {number} bmr
 * @returns {number}
 */
export function calculateTargetCalories(tdee, goal, bmr) {
  const { deficit = 0 } = GOAL_LABELS[goal] ?? {};
  const target = tdee - deficit;
  return Math.max(Math.round(target), Math.round(bmr));
}

// ─── Macro Split ───────────────────────────────────────────────────────────

export const DIET_LABELS = {
  standard: {
    label: 'Standard (Balanced)',
    desc: 'Protein 30%, Carbs 40%, Fat 30% — good general starting point',
    protein_pct: 0.30, carbs_pct: 0.40, fat_pct: 0.30,
  },
  high_protein: {
    label: 'High Protein',
    desc: 'Protein 40%, Carbs 35%, Fat 25% — muscle gain and body recomposition',
    protein_pct: 0.40, carbs_pct: 0.35, fat_pct: 0.25,
  },
  low_carb: {
    label: 'Low Carb',
    desc: 'Protein 35%, Carbs 20%, Fat 45% — insulin sensitivity focus',
    protein_pct: 0.35, carbs_pct: 0.20, fat_pct: 0.45,
  },
  keto: {
    label: 'Keto / Very Low Carb',
    desc: 'Protein 25%, Carbs 5%, Fat 70% — ketogenic diet',
    protein_pct: 0.25, carbs_pct: 0.05, fat_pct: 0.70,
  },
};

const PROTEIN_FLOOR_G_PER_KG = 1.6; // minimum to preserve muscle in deficit

/**
 * calculateMacros
 * @param {number} targetCalories
 * @param {string} diet
 * @param {number} weight_kg
 * @returns {{ protein, carbs, fat, protein_floor_applied }}
 */
export function calculateMacros(targetCalories, diet, weight_kg) {
  const { protein_pct, carbs_pct, fat_pct } = DIET_LABELS[diet] ?? DIET_LABELS.standard;

  const proteinCals = targetCalories * protein_pct;
  const carbsCals   = targetCalories * carbs_pct;
  const fatCals     = targetCalories * fat_pct;

  let proteinGrams = Math.round(proteinCals / 4);
  let carbsGrams   = Math.round(carbsCals / 4);
  let fatGrams     = Math.round(fatCals / 9);

  // Protein floor: enforce minimum 1.6g/kg
  let protein_floor_applied = false;
  const minProtein = Math.round(weight_kg * PROTEIN_FLOOR_G_PER_KG);
  if (proteinGrams < minProtein) {
    const deficit_cals = (minProtein - proteinGrams) * 4;
    proteinGrams = minProtein;
    // Take from carbs first, then fat
    const carbsReduction = Math.min(carbsGrams * 4, deficit_cals);
    carbsGrams = Math.round((carbsGrams * 4 - carbsReduction) / 4);
    const remaining = deficit_cals - carbsReduction;
    if (remaining > 0) {
      fatGrams = Math.round((fatGrams * 9 - remaining) / 9);
    }
    protein_floor_applied = true;
  }

  return {
    protein: { grams: proteinGrams, calories: proteinGrams * 4 },
    carbs:   { grams: carbsGrams,   calories: carbsGrams * 4 },
    fat:     { grams: fatGrams,     calories: Math.round(fatGrams * 9) },
    protein_floor_applied,
  };
}

// ─── Timeline ──────────────────────────────────────────────────────────────

/**
 * calculateTimeline
 * @param {number} tdee
 * @param {number} targetCalories
 * @param {number} currentWeight_kg
 * @param {number} goalWeight_kg
 */
export function calculateTimeline(tdee, targetCalories, currentWeight_kg, goalWeight_kg) {
  const dailyDelta = tdee - targetCalories; // positive = deficit, negative = surplus
  if (Math.abs(dailyDelta) < 1) return null;

  const weeklyDelta_kcal = dailyDelta * 7;
  const weeklyChange_kg  = weeklyDelta_kcal / 7700; // ~7700 kcal per kg body fat

  const weightDiff_kg = Math.abs(currentWeight_kg - goalWeight_kg);
  const weeks = Math.abs(Math.round(weightDiff_kg / Math.abs(weeklyChange_kg)));
  const months = Math.round((weeks / 4.33) * 10) / 10;

  return {
    weekly_change_kg:   Math.abs(Math.round(weeklyChange_kg * 100) / 100),
    weekly_change_lbs:  Math.abs(Math.round(kgToLbs(weeklyChange_kg) * 100) / 100),
    weeks_to_goal:      weeks,
    months_to_goal:     months,
  };
}

// ─── BMI ───────────────────────────────────────────────────────────────────

/**
 * calculateBMI
 * @param {number} weight_kg
 * @param {number} height_cm
 */
export function calculateBMI(weight_kg, height_cm) {
  const height_m = height_cm / 100;
  const bmi = Math.round((weight_kg / (height_m * height_m)) * 10) / 10;

  let category, color;
  if      (bmi < 18.5) { category = 'Underweight'; color = 'blue'; }
  else if (bmi < 25)   { category = 'Normal Weight'; color = 'green'; }
  else if (bmi < 30)   { category = 'Overweight'; color = 'orange'; }
  else                 { category = 'Obese'; color = 'red'; }

  return { bmi, category, color };
}

// ─── Protein Target ────────────────────────────────────────────────────────

export const PROTEIN_GOAL_LABELS = {
  muscle_gain:    { label: 'Muscle Gain',          desc: '1.8–2.2g per kg — maximum muscle protein synthesis', g_per_kg: 2.0 },
  body_recomp:    { label: 'Body Recomposition',   desc: '1.6–2.0g per kg — lose fat while maintaining muscle', g_per_kg: 1.8 },
  weight_loss:    { label: 'Weight Loss',           desc: '1.4–1.8g per kg — preserve muscle in a calorie deficit', g_per_kg: 1.6 },
  maintenance:    { label: 'Maintenance',           desc: '1.2–1.6g per kg — general health and muscle maintenance', g_per_kg: 1.4 },
  endurance:      { label: 'Endurance Athlete',     desc: '1.4–1.7g per kg — repair and endurance adaptation', g_per_kg: 1.6 },
};

/**
 * calculateProteinTarget
 * @param {number} weight_kg
 * @param {string} goal
 */
export function calculateProteinTarget(weight_kg, goal) {
  const { g_per_kg } = PROTEIN_GOAL_LABELS[goal] ?? PROTEIN_GOAL_LABELS.maintenance;
  const daily_g = Math.round(weight_kg * g_per_kg);

  // Food equivalents
  const chicken_breasts = Math.ceil(daily_g / 31); // ~100g breast = 31g protein
  const eggs = Math.ceil(daily_g / 6);             // ~6g per large egg

  return {
    daily_g,
    g_per_kg,
    per_meal_3: Math.round(daily_g / 3),
    per_meal_4: Math.round(daily_g / 4),
    per_meal_5: Math.round(daily_g / 5),
    chicken_breasts,
    eggs,
  };
}

// ─── Calorie Deficit ───────────────────────────────────────────────────────

/**
 * calculateCalorieDeficit
 * @param {number} tdee
 * @param {number} targetCalories
 * @param {number|null} currentWeight_kg
 * @param {number|null} goalWeight_kg
 */
export function calculateCalorieDeficit(tdee, targetCalories, currentWeight_kg, goalWeight_kg) {
  const dailyDeficit  = tdee - targetCalories;
  const weeklyDeficit = dailyDeficit * 7;

  // ~7700 kcal per kg of body fat
  const weeklyLossKg  = Math.round((weeklyDeficit / 7700) * 100) / 100;
  const weeklyLossLbs = Math.round(kgToLbs(weeklyLossKg) * 100) / 100;

  let weeksToGoal = null;
  let monthsToGoal = null;
  if (currentWeight_kg && goalWeight_kg && weeklyLossKg > 0) {
    const weightDiff = Math.abs(currentWeight_kg - goalWeight_kg);
    weeksToGoal  = Math.round(weightDiff / weeklyLossKg);
    monthsToGoal = Math.round((weeksToGoal / 4.33) * 10) / 10;
  }

  return { dailyDeficit, weeklyDeficit, weeklyLossKg, weeklyLossLbs, weeksToGoal, monthsToGoal };
}

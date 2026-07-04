# CalcMacros — Priority 1 Calculators PRD
**Version:** 1.0  
**Date:** July 2026  
**Stack:** Astro + Vanilla JavaScript + Tailwind CSS  
**Deployment:** Cloudflare Pages  
**Companion to:** macrocalc-prd.md (v1.0) + macrocalc-v2-update.md

---

## Overview

This document covers the 5 Priority 1 calculators to be added to CalcMacros immediately after the core 6 are live. Each calculator is designed as a standalone Astro page with vanilla JavaScript for all calculation logic — no React, no external libraries. This keeps bundle size at zero and PageSpeed scores at 95+.

**Why vanilla JS instead of React for these?**
The core TDEE/Macro calculator needs React for its complex state (10+ inputs, live updates, donut chart). These 5 calculators are simpler — 2–5 inputs, 1–3 outputs. Vanilla JS is faster to load, easier to maintain, and produces better Core Web Vitals.

**Priority 1 Calculators:**
1. Body Fat Percentage Calculator
2. Ideal Weight Calculator
3. Calorie Burn Calculator
4. Water Intake Calculator
5. Lean Body Mass Calculator

---

## Part 1 — Shared Architecture

### 1.1 Page Template (All 5 Calculators Follow This)

Every calculator page uses this exact structure:

```
BaseLayout.astro (head, meta, schema, GA4, AdSense)
  └── Header.astro
  └── <main>
        ├── Breadcrumb nav
        ├── AdLeaderboard (above hero)
        ├── Hero section (H1 + subtext + badges)
        ├── Calculator widget (vanilla JS)
        ├── AdInArticle (after calculator)
        ├── RelatedCalculators.astro
        ├── SEO content section
        │     ├── H2: What is X?
        │     ├── H2: How to use this calculator
        │     ├── H2: How we calculate X
        │     ├── H2: Understanding your results
        │     ├── AdInArticle (mid-content)
        │     ├── H2: X by goal/category (table)
        │     └── H2: FAQ accordion
        └── Author + Last Updated bar
  └── Footer.astro
```

### 1.2 Vanilla JS Calculator Pattern

All 5 calculators use this exact pattern in their Astro page:

```html
<!-- Calculator widget — pure HTML + inline script -->
<div class="calc-card" id="calculator-widget">
  <!-- Inputs -->
  <div class="calc-form">
    <!-- Input fields, segment controls, selects -->
  </div>

  <!-- Results — hidden until inputs filled -->
  <div class="calc-results" id="results" style="display:none;">
    <!-- Result cards -->
  </div>

  <!-- Empty state — shown until inputs filled -->
  <div class="calc-empty" id="empty-state">
    <!-- Icon + "Fill in your details" -->
  </div>
</div>

<script>
  // All logic inline in the page — no imports needed
  // Runs on every input change
  // Pure functions: calculate() → render()
</script>
```

### 1.3 Shared CSS Classes

All 5 calculators reuse classes already defined in `global.css`:

```
.calc-card          → white card, border, border-radius 16px
.calc-form          → form layout
.calc-input         → input field styling
.segment-control    → pill toggle (Metric/Imperial etc.)
.segment-option     → each pill button
.result-card        → individual result display card
.result-number      → JetBrains Mono 700 large number
.result-label       → uppercase small label
.result-unit        → small unit text
.calc-empty         → empty state centered
.content-section    → SEO content below calculator
.hero               → hero section
.badge              → small pill badge in hero
```

No new CSS needed for these 5 calculators beyond what already exists.

---

## Part 2 — Calculator 1: Body Fat Percentage Calculator

### 2.1 Overview

| Property | Value |
|---|---|
| URL | `/body-fat-calculator` |
| Primary keyword | body fat calculator |
| Monthly searches | 450,000 global |
| Keyword difficulty | Medium |
| CPM estimate | $10–14 |
| Build time | 2 hours |

### 2.2 SEO Metadata

```
Title tag:
"Body Fat Calculator — Free Body Fat % Estimator | CalcMacros"
(58 characters)

Meta description:
"Calculate your body fat percentage free using the US Navy method.
Enter your measurements to find your body fat %, lean mass, and
fat mass instantly. No equipment needed."
(155 characters)

H1: "Body Fat Calculator"

Canonical: https://calcmacros.com/body-fat-calculator
```

### 2.3 Schema Markup

```javascript
const schema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Body Fat Calculator',
  url: 'https://calcmacros.com/body-fat-calculator',
  description: 'Free body fat percentage calculator using the US Navy method.',
  applicationCategory: 'HealthApplication',
  offers: { '@type': 'Offer', price: '0' },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://calcmacros.com/' },
    { '@type': 'ListItem', position: 2, name: 'Body Fat Calculator', item: 'https://calcmacros.com/body-fat-calculator' }
  ]
};
```

### 2.4 Calculator Inputs

| Input | Type | Validation |
|---|---|---|
| Sex | Segment (Male/Female) | Required |
| Unit system | Segment (Metric/Imperial) | Default: Imperial |
| Height | Number | 100–250cm / 36–96in |
| Weight | Number | 30–300kg / 66–660lbs |
| Waist circumference | Number | 40–200cm / 16–80in |
| Neck circumference | Number | 20–80cm / 8–32in |
| Hip circumference (female only) | Number | 50–200cm / 20–80in |

### 2.5 Calculation Logic (US Navy Method)

```javascript
// US Navy Method — most accessible (tape measure only)
// Source: Hodgdon & Beckett (1984), Naval Health Research Center

function calculateBodyFat({ sex, height_cm, weight_kg, waist_cm, neck_cm, hip_cm }) {

  let bodyFatPct;

  if (sex === 'male') {
    // Male formula
    bodyFatPct = 495 / (
      1.0324 - 0.19077 * Math.log10(waist_cm - neck_cm) +
      0.15456 * Math.log10(height_cm)
    ) - 450;
  } else {
    // Female formula (requires hip measurement)
    bodyFatPct = 495 / (
      1.29579 - 0.35004 * Math.log10(waist_cm + hip_cm - neck_cm) +
      0.22100 * Math.log10(height_cm)
    ) - 450;
  }

  bodyFatPct = Math.max(3, Math.min(bodyFatPct, 70)); // clamp to realistic range

  const fatMass_kg = weight_kg * (bodyFatPct / 100);
  const leanMass_kg = weight_kg - fatMass_kg;

  return {
    bodyFatPct: Math.round(bodyFatPct * 10) / 10,
    fatMass_kg: Math.round(fatMass_kg * 10) / 10,
    leanMass_kg: Math.round(leanMass_kg * 10) / 10,
    category: getBodyFatCategory(bodyFatPct, sex),
  };
}

function getBodyFatCategory(pct, sex) {
  if (sex === 'male') {
    if (pct < 6)  return { label: 'Essential Fat',   color: '#8B5CF6' };
    if (pct < 14) return { label: 'Athletic',        color: '#2D6A4F' };
    if (pct < 18) return { label: 'Fitness',         color: '#2D6A4F' };
    if (pct < 25) return { label: 'Average',         color: '#D97706' };
    return             { label: 'Above Average',     color: '#E76F51' };
  } else {
    if (pct < 14) return { label: 'Essential Fat',   color: '#8B5CF6' };
    if (pct < 21) return { label: 'Athletic',        color: '#2D6A4F' };
    if (pct < 25) return { label: 'Fitness',         color: '#2D6A4F' };
    if (pct < 32) return { label: 'Average',         color: '#D97706' };
    return             { label: 'Above Average',     color: '#E76F51' };
  }
}
```

### 2.6 Calculator Outputs

| Output | Format | Display |
|---|---|---|
| Body Fat % | `22.4%` | Large result card, accent top border by category color |
| Category | `Athletic / Fitness / Average` | Colored badge below percentage |
| Fat Mass | `14.2 kg / 31.3 lbs` | Result card, orange border-top |
| Lean Mass | `50.8 kg / 112.0 lbs` | Result card, green border-top |
| Visual gauge | Horizontal bar showing % position in range | Below main result |

### 2.7 Body Fat Category Table (Male / Female)

**Male:**
| Category | Body Fat % | Description |
|---|---|---|
| Essential Fat | 2–5% | Minimum for survival |
| Athletic | 6–13% | Competitive athletes |
| Fitness | 14–17% | Regular exercisers |
| Average | 18–24% | Typical healthy adult |
| Above Average | 25%+ | Health risks increase |

**Female:**
| Category | Body Fat % | Description |
|---|---|---|
| Essential Fat | 10–13% | Minimum for survival |
| Athletic | 14–20% | Competitive athletes |
| Fitness | 21–24% | Regular exercisers |
| Average | 25–31% | Typical healthy adult |
| Above Average | 32%+ | Health risks increase |

### 2.8 FAQ Content (10 Questions)

1. What is a healthy body fat percentage?
2. How accurate is the Navy method body fat calculator?
3. How do I measure my waist for the body fat calculator?
4. What is the difference between body fat percentage and BMI?
5. How can I lower my body fat percentage?
6. What is essential fat and why do I need it?
7. How often should I measure my body fat?
8. Is body fat percentage different for men and women?
9. What body fat percentage is needed for visible abs?
10. How does body fat percentage relate to my TDEE?

### 2.9 Internal Links

- "Calculate your TDEE with your lean body mass" → `/tdee-calculator`
- "Find your lean body mass" → `/lean-body-mass-calculator`
- "Calculate your ideal weight" → `/ideal-weight-calculator`
- "Set your protein target" → `/protein-calculator`

### 2.10 Related Calculators (shown in RelatedCalculators.astro)

- Lean Body Mass Calculator
- Ideal Weight Calculator
- BMI Calculator
- TDEE Calculator

---

## Part 3 — Calculator 2: Ideal Weight Calculator

### 3.1 Overview

| Property | Value |
|---|---|
| URL | `/ideal-weight-calculator` |
| Primary keyword | ideal weight calculator |
| Monthly searches | 350,000 global |
| Keyword difficulty | Medium |
| CPM estimate | $9–13 |
| Build time | 1 hour |

### 3.2 SEO Metadata

```
Title tag:
"Ideal Weight Calculator — Find Your Healthy Goal Weight | CalcMacros"
(61 characters)

Meta description:
"Calculate your ideal body weight using 4 science-backed formulas.
Find your healthy goal weight range by height and sex. Free ideal
weight calculator — no signup."
(154 characters)

H1: "Ideal Weight Calculator"

Canonical: https://calcmacros.com/ideal-weight-calculator
```

### 3.3 Schema Markup

```javascript
const schema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Ideal Weight Calculator',
  url: 'https://calcmacros.com/ideal-weight-calculator',
  description: 'Free ideal weight calculator using 4 validated formulas.',
  applicationCategory: 'HealthApplication',
  offers: { '@type': 'Offer', price: '0' },
};
```

### 3.4 Calculator Inputs

| Input | Type | Validation |
|---|---|---|
| Sex | Segment (Male/Female) | Required |
| Unit system | Segment (Metric/Imperial) | Default: Imperial |
| Height | Number | 130–230cm / 51–90in |
| Age (optional) | Number | 18–80 — used for context only |
| Frame size (optional) | Segment (Small/Medium/Large) | Default: Medium |

### 3.5 Calculation Logic (4 Formulas)

```javascript
// Four validated ideal body weight formulas
// All require height in cm and sex

function calculateIdealWeight({ height_cm, sex, frame = 'medium' }) {

  // Height in inches for formula compatibility
  const height_in = height_cm / 2.54;
  const height_over5ft = Math.max(0, height_in - 60); // inches over 5 feet

  // 1. Devine Formula (1974) — most widely used clinically
  const devine_kg = sex === 'male'
    ? 50 + (2.3 * height_over5ft)
    : 45.5 + (2.3 * height_over5ft);

  // 2. Robinson Formula (1983)
  const robinson_kg = sex === 'male'
    ? 52 + (1.9 * height_over5ft)
    : 49 + (1.7 * height_over5ft);

  // 3. Miller Formula (1983)
  const miller_kg = sex === 'male'
    ? 56.2 + (1.41 * height_over5ft)
    : 53.1 + (1.36 * height_over5ft);

  // 4. Hamwi Formula (1964) — accounts for frame size
  let hamwi_kg = sex === 'male'
    ? 48 + (2.7 * height_over5ft)
    : 45.4 + (2.27 * height_over5ft);

  // Frame size adjustment for Hamwi
  if (frame === 'small') hamwi_kg *= 0.9;
  if (frame === 'large') hamwi_kg *= 1.1;

  // Healthy BMI range (18.5–24.9) weight
  const height_m = height_cm / 100;
  const bmi_low_kg = 18.5 * (height_m * height_m);
  const bmi_high_kg = 24.9 * (height_m * height_m);

  return {
    devine:   Math.round(devine_kg * 10) / 10,
    robinson: Math.round(robinson_kg * 10) / 10,
    miller:   Math.round(miller_kg * 10) / 10,
    hamwi:    Math.round(hamwi_kg * 10) / 10,
    bmi_range_low:  Math.round(bmi_low_kg * 10) / 10,
    bmi_range_high: Math.round(bmi_high_kg * 10) / 10,
    average: Math.round(((devine_kg + robinson_kg + miller_kg) / 3) * 10) / 10,
  };
}
```

### 3.6 Calculator Outputs

| Output | Format | Display |
|---|---|---|
| Average ideal weight | `68.5 kg / 151 lbs` | Primary large result card |
| Healthy weight range | `59.2 – 79.7 kg` | Based on BMI 18.5–24.9 |
| Formula breakdown | 4 cards: Devine / Robinson / Miller / Hamwi | Smaller grid |
| Current vs ideal | If age provided: context note | Helper text |

**Display note:** Show average of 3 formulas (excluding Hamwi unless frame selected) as the primary "recommended" weight. Show all 4 formula results as a secondary breakdown with explanation of each.

### 3.7 Internal Links

- "Now calculate your macros for your goal weight" → `/` (homepage)
- "Find your current body fat percentage" → `/body-fat-calculator`
- "Calculate your calorie deficit to reach goal weight" → `/calorie-deficit-calculator`
- "Check your BMI" → `/bmi-calculator`

### 3.8 FAQ Content (8 Questions)

1. What is the ideal weight for my height?
2. Which ideal weight formula is most accurate?
3. Is ideal weight different for men and women?
4. What is a healthy weight range based on BMI?
5. How does frame size affect ideal weight?
6. Is ideal weight the same as goal weight?
7. How long will it take to reach my ideal weight?
8. Does age affect ideal body weight?

---

## Part 4 — Calculator 3: Calorie Burn Calculator

### 4.1 Overview

| Property | Value |
|---|---|
| URL | `/calorie-burn-calculator` |
| Primary keyword | calorie burn calculator |
| Monthly searches | 300,000 global |
| Secondary keywords | how many calories does running burn, calories burned walking |
| Keyword difficulty | Medium |
| CPM estimate | $9–12 |
| Build time | 2 hours |

### 4.2 SEO Metadata

```
Title tag:
"Calorie Burn Calculator — Calories Burned by Exercise | CalcMacros"
(61 characters)

Meta description:
"Calculate calories burned during any exercise. Running, walking,
cycling, swimming, and 30+ activities. Enter your weight, activity,
and duration for instant results."
(155 characters)

H1: "Calorie Burn Calculator"

Canonical: https://calcmacros.com/calorie-burn-calculator
```

### 4.3 Calculator Inputs

| Input | Type | Options |
|---|---|---|
| Weight | Number | kg or lbs |
| Activity | Select/dropdown | 35 activities grouped by category |
| Duration | Number | Minutes (1–300) |
| Intensity | Segment (Low/Moderate/High) | Adjusts MET value ±15% |

### 4.4 Activity List with MET Values

```javascript
// MET values from Ainsworth et al. (2011)
// Compendium of Physical Activities

const ACTIVITIES = {
  cardio: [
    { id: 'walking_slow',      label: 'Walking (slow, 2mph)',        met: 2.8  },
    { id: 'walking_moderate',  label: 'Walking (moderate, 3mph)',    met: 3.5  },
    { id: 'walking_brisk',     label: 'Walking (brisk, 3.5mph)',     met: 4.3  },
    { id: 'running_5mph',      label: 'Running (5mph / 12min mile)', met: 8.3  },
    { id: 'running_6mph',      label: 'Running (6mph / 10min mile)', met: 9.8  },
    { id: 'running_7mph',      label: 'Running (7mph / 8.5min mile)',met: 11.0 },
    { id: 'running_8mph',      label: 'Running (8mph / 7.5min mile)',met: 11.8 },
    { id: 'cycling_leisure',   label: 'Cycling (leisure, <10mph)',   met: 4.0  },
    { id: 'cycling_moderate',  label: 'Cycling (moderate, 12–14mph)',met: 8.0  },
    { id: 'cycling_vigorous',  label: 'Cycling (vigorous, 16–19mph)',met: 10.0 },
    { id: 'swimming_moderate', label: 'Swimming (moderate effort)',  met: 5.8  },
    { id: 'swimming_vigorous', label: 'Swimming (vigorous effort)',  met: 9.8  },
    { id: 'jump_rope',         label: 'Jump Rope',                   met: 11.8 },
    { id: 'elliptical',        label: 'Elliptical (moderate)',       met: 5.0  },
    { id: 'rowing_moderate',   label: 'Rowing Machine (moderate)',   met: 7.0  },
    { id: 'stair_climbing',    label: 'Stair Climbing',              met: 9.0  },
    { id: 'hiit',              label: 'HIIT / Circuit Training',     met: 8.0  },
  ],
  strength: [
    { id: 'weight_training',   label: 'Weight Training (general)',   met: 3.5  },
    { id: 'powerlifting',      label: 'Powerlifting / Barbell',      met: 6.0  },
    { id: 'bodyweight',        label: 'Bodyweight Training',         met: 3.8  },
    { id: 'crossfit',          label: 'CrossFit',                    met: 9.0  },
    { id: 'kettlebell',        label: 'Kettlebell Training',         met: 8.0  },
  ],
  sports: [
    { id: 'basketball',        label: 'Basketball',                  met: 6.5  },
    { id: 'soccer',            label: 'Soccer / Football',           met: 7.0  },
    { id: 'tennis',            label: 'Tennis (singles)',            met: 7.3  },
    { id: 'badminton',         label: 'Badminton',                   met: 5.5  },
    { id: 'cricket',           label: 'Cricket',                     met: 4.8  },
    { id: 'volleyball',        label: 'Volleyball',                  met: 4.0  },
  ],
  daily: [
    { id: 'yoga',              label: 'Yoga',                        met: 2.5  },
    { id: 'pilates',           label: 'Pilates',                     met: 3.0  },
    { id: 'stretching',        label: 'Stretching',                  met: 2.3  },
    { id: 'dancing',           label: 'Dancing (general)',           met: 4.8  },
    { id: 'hiking',            label: 'Hiking (hills)',              met: 6.0  },
    { id: 'gardening',         label: 'Gardening',                   met: 3.5  },
    { id: 'cleaning',          label: 'House Cleaning',              met: 3.3  },
    { id: 'golf',              label: 'Golf (walking)',              met: 4.3  },
  ],
};
```

### 4.5 Calculation Logic

```javascript
// Calories burned = MET × weight_kg × duration_hours
// Formula from: Ainsworth et al. (2011) Compendium of Physical Activities

function calculateCaloriesBurned({ met, weight_kg, duration_minutes, intensity }) {

  // Intensity adjustment
  const intensityMultiplier = {
    low:      0.85,
    moderate: 1.0,
    high:     1.15,
  }[intensity] || 1.0;

  const adjustedMet = met * intensityMultiplier;
  const duration_hours = duration_minutes / 60;
  const calories = Math.round(adjustedMet * weight_kg * duration_hours);

  // Per-minute rate for context
  const caloriesPerMinute = Math.round((adjustedMet * weight_kg) / 60 * 10) / 10;

  // As % of daily calorie needs context
  // (approximate — assume 2000 cal reference)
  const pctOfDailyNeeds = Math.round((calories / 2000) * 100);

  return {
    calories,
    caloriesPerMinute,
    pctOfDailyNeeds,
    met: Math.round(adjustedMet * 10) / 10,
  };
}
```

### 4.6 Calculator Outputs

| Output | Format | Display |
|---|---|---|
| Calories burned | `324 kcal` | Primary large result card, green border |
| Per minute rate | `5.4 kcal/min` | Secondary card |
| Duration summary | `30 min of Running at 6mph` | Context text |
| % of daily needs | `~16% of a 2,000 cal daily target` | Helper note |
| MET value | `9.8 MET` | Small data point with tooltip explanation |

### 4.7 Internal Links

- "Add to your TDEE calculation" → `/tdee-calculator`
- "Set your calorie deficit goal" → `/calorie-deficit-calculator`
- "Calculate your protein needs for training" → `/protein-calculator`
- "Find your daily calorie burn" → `/` (homepage)

### 4.8 FAQ Content (8 Questions)

1. How many calories does running burn per mile?
2. How many calories does walking 10,000 steps burn?
3. What is a MET value in exercise?
4. Does weight affect how many calories you burn exercising?
5. Is calorie burn from exercise shown on fitness trackers accurate?
6. How many calories should I burn per workout to lose weight?
7. Does muscle mass increase calories burned during exercise?
8. How does exercise calorie burn compare to diet for weight loss?

---

## Part 5 — Calculator 4: Water Intake Calculator

### 5.1 Overview

| Property | Value |
|---|---|
| URL | `/water-intake-calculator` |
| Primary keyword | water intake calculator |
| Monthly searches | 250,000 global |
| Secondary keywords | how much water should I drink, daily water intake |
| Keyword difficulty | Low |
| CPM estimate | $8–11 |
| Build time | 1 hour |
| Competition | Very low — most tools are oversimplified |

### 5.2 SEO Metadata

```
Title tag:
"Water Intake Calculator — How Much Water Should You Drink? | CalcMacros"
(64 characters)

Meta description:
"Calculate your daily water intake based on your weight, activity
level, and climate. Go beyond '8 glasses a day' with a personalized
hydration target. Free."
(152 characters)

H1: "Water Intake Calculator"

Canonical: https://calcmacros.com/water-intake-calculator
```

### 5.3 Calculator Inputs

| Input | Type | Options |
|---|---|---|
| Weight | Number | kg or lbs |
| Activity level | Segment | Sedentary / Active / Very Active |
| Climate | Segment | Temperate / Hot / Very Hot |
| Exercise today | Segment | None / 30 min / 60 min / 90 min+ |
| Pregnant/Breastfeeding (female option) | Toggle | Adds 300–700ml |

### 5.4 Calculation Logic

```javascript
// Base: Institute of Medicine / National Academies recommendation
// + adjustments for activity, climate, exercise

function calculateWaterIntake({
  weight_kg,
  activity,     // 'sedentary' | 'active' | 'very_active'
  climate,      // 'temperate' | 'hot' | 'very_hot'
  exercise_min, // 0 | 30 | 60 | 90
  pregnant,     // boolean
  breastfeeding // boolean
}) {

  // Base: 35ml per kg of bodyweight (European EFSA standard)
  // More accurate than the US "8 glasses" rule
  let water_ml = weight_kg * 35;

  // Activity adjustment
  const activityAdd = {
    sedentary:   0,
    active:      350,
    very_active: 700,
  }[activity] || 0;

  water_ml += activityAdd;

  // Climate adjustment
  const climateAdd = {
    temperate: 0,
    hot:       500,
    very_hot:  1000,
  }[climate] || 0;

  water_ml += climateAdd;

  // Exercise adjustment (approx 500ml per 30 min of sweat-inducing exercise)
  const exerciseAdd = {
    0:  0,
    30: 500,
    60: 750,
    90: 1000,
  }[exercise_min] || 0;

  water_ml += exerciseAdd;

  // Pregnancy / breastfeeding
  if (pregnant)      water_ml += 300;
  if (breastfeeding) water_ml += 700;

  // Convert to multiple units
  const water_l       = Math.round(water_ml / 100) / 10;
  const water_floz    = Math.round(water_ml * 0.033814 * 10) / 10;
  const water_cups    = Math.round((water_ml / 240) * 10) / 10;
  const water_glasses = Math.round(water_ml / 250); // 250ml = standard glass

  return {
    water_ml:     Math.round(water_ml),
    water_l,
    water_floz,
    water_cups,
    water_glasses,
    // Hourly reminder
    hourly_ml: Math.round(water_ml / 16), // spread over 16 waking hours
  };
}
```

### 5.5 Calculator Outputs

| Output | Format | Display |
|---|---|---|
| Daily water (primary) | `2.8 L / 94 fl oz` | Primary large result card, blue border |
| In glasses | `11 glasses of water` | Secondary card |
| Per hour | `175ml per hour` | Helper card (spread over 16 waking hrs) |
| Breakdown | Shows base + activity + climate + exercise additions | Transparent breakdown below results |

**Unique feature:** Show a visual "water bottles" representation. e.g., `= 5.5 standard 500ml bottles`. Makes the number tangible and highly shareable.

### 5.6 Internal Links

- "Calculate your daily calories" → `/` (homepage)
- "Find your protein target" → `/protein-calculator`
- "Calculate calories burned during exercise" → `/calorie-burn-calculator`

### 5.7 Content Sections

**H2: Why "8 glasses a day" is wrong**
Most people have heard the advice to drink 8 glasses of water per day. The problem: this rule ignores your body weight, activity level, climate, and exercise. A 50kg sedentary person and a 100kg athlete cannot have the same water requirement. This calculator uses the European Food Safety Authority (EFSA) standard of 35ml per kg of bodyweight as the base, then adjusts for factors that actually affect hydration needs.

**H2: Signs you're not drinking enough water**
Dehydration at even 1–2% body water loss causes measurable performance decline. Signs include dark urine, headaches, fatigue, reduced exercise performance, difficulty concentrating.

**H2: Does coffee and tea count toward water intake?**
Yes — caffeinated drinks do contribute to daily fluid intake, despite the common belief otherwise. The diuretic effect of caffeine is mild and does not negate the hydration benefit of coffee or tea for most people.

### 5.8 FAQ Content (8 Questions)

1. How much water should I drink per day?
2. Does the 8 glasses of water rule actually work?
3. How does body weight affect how much water I need?
4. Does exercise increase my water needs?
5. Does coffee count as water intake?
6. What color should my urine be to know I'm hydrated?
7. Can I drink too much water?
8. Should I drink more water in hot weather?

---

## Part 6 — Calculator 5: Lean Body Mass Calculator

### 6.1 Overview

| Property | Value |
|---|---|
| URL | `/lean-body-mass-calculator` |
| Primary keyword | lean body mass calculator |
| Monthly searches | 120,000 global |
| Keyword difficulty | Low |
| CPM estimate | $9–12 |
| Build time | 1 hour |
| Why add it | Complements body fat + Katch-McArdle formula needs it |

### 6.2 SEO Metadata

```
Title tag:
"Lean Body Mass Calculator — Calculate Your LBM | CalcMacros"
(53 characters)

Meta description:
"Calculate your lean body mass (LBM) — the weight of everything in
your body except fat. Use your results to get a more accurate TDEE
with Katch-McArdle. Free."
(154 characters)

H1: "Lean Body Mass Calculator"

Canonical: https://calcmacros.com/lean-body-mass-calculator
```

### 6.3 Calculator Inputs

**Method A — With Body Fat % (most accurate):**
| Input | Type |
|---|---|
| Body weight | Number (kg/lbs) |
| Body fat % | Number (5–60%) |

**Method B — Without Body Fat % (estimation formulas):**
| Input | Type |
|---|---|
| Body weight | Number (kg/lbs) |
| Height | Number (cm/in) |
| Sex | Segment (Male/Female) |

### 6.4 Calculation Logic

```javascript
function calculateLBM({ weight_kg, body_fat_pct, height_cm, sex, method }) {

  let lbm_kg;

  if (method === 'body_fat' && body_fat_pct !== null) {
    // Method A: Direct calculation from body fat %
    // Most accurate when body fat % is known
    lbm_kg = weight_kg * (1 - body_fat_pct / 100);

  } else {
    // Method B: Estimation formulas (no body fat % needed)

    // Boer Formula (1984) — most accurate estimation without body fat
    if (sex === 'male') {
      lbm_kg = (0.407 * weight_kg) + (0.267 * height_cm) - 19.2;
    } else {
      lbm_kg = (0.252 * weight_kg) + (0.473 * height_cm) - 48.3;
    }
  }

  const fat_kg = weight_kg - lbm_kg;

  // BMR using Katch-McArdle (most accurate with LBM)
  const bmr_katch = Math.round(370 + (21.6 * lbm_kg));

  return {
    lbm_kg:    Math.round(lbm_kg * 10) / 10,
    lbm_lbs:   Math.round(lbm_kg * 2.20462 * 10) / 10,
    fat_kg:    Math.round(fat_kg * 10) / 10,
    fat_lbs:   Math.round(fat_kg * 2.20462 * 10) / 10,
    body_fat_pct_calc: Math.round((fat_kg / weight_kg) * 1000) / 10,
    bmr_katch,
    // Protein recommendation based on LBM
    protein_g: Math.round(lbm_kg * 2.2), // 1g per lb of LBM
  };
}
```

### 6.5 Calculator Outputs

| Output | Format | Display |
|---|---|---|
| Lean Body Mass | `63.2 kg / 139.3 lbs` | Primary large result, green border |
| Fat Mass | `11.8 kg / 26.0 lbs` | Result card, orange border |
| Body fat % (if calculated) | `15.7%` | Result card |
| BMR (Katch-McArdle) | `1,734 kcal` | Result card, purple border |
| Protein recommendation | `139g protein/day` | Based on 1g per lb LBM |

**Key insight to show:** The Katch-McArdle BMR result with a note: *"This is more accurate than Mifflin-St Jeor for your body composition. Use this in the TDEE calculator for better results."* + link to TDEE calculator.

### 6.6 Internal Links

- "Use this LBM for Katch-McArdle in TDEE calculator" → `/tdee-calculator`
- "Check your body fat percentage" → `/body-fat-calculator`
- "Calculate your protein based on lean mass" → `/protein-calculator`
- "Find your ideal weight" → `/ideal-weight-calculator`

### 6.7 FAQ Content (6 Questions)

1. What is lean body mass?
2. What is the difference between lean body mass and muscle mass?
3. How do I increase my lean body mass?
4. Why does lean body mass matter for calculating calories?
5. What is a good lean body mass for my height?
6. How accurate is the lean body mass calculator without body fat percentage?

---

## Part 7 — Implementation Guide

### 7.1 File Creation Order

Build in this order — each one builds on knowledge from the previous:

```
Day 1: /water-intake-calculator    → Simplest, 2 hours
Day 2: /lean-body-mass-calculator  → Simple, 1.5 hours
Day 3: /ideal-weight-calculator    → Medium, 2 hours
Day 4: /body-fat-calculator        → Medium, 2.5 hours
Day 5: /calorie-burn-calculator    → Longest (activity list), 3 hours
```

### 7.2 File Structure

Each calculator is ONE `.astro` file:

```
src/pages/
├── body-fat-calculator.astro
├── ideal-weight-calculator.astro
├── calorie-burn-calculator.astro
├── water-intake-calculator.astro
└── lean-body-mass-calculator.astro
```

No new component files needed. All JS is inline `<script>` in the `.astro` page.

### 7.3 Astro Page Template (Copy for Each Calculator)

```astro
---
// src/pages/[calculator-name].astro
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from '../components/astro/Header.astro';
import Footer from '../components/astro/Footer.astro';
import RelatedCalculators from '../components/astro/RelatedCalculators.astro';
import { AdLeaderboard, AdInArticle } from '../components/ui/AdUnits.jsx';

const title = '[Calculator Name] — [Keyword] | CalcMacros';
const description = '[Meta description 140–155 chars]';
const canonical = 'https://calcmacros.com/[calculator-url]';

const schema = { /* WebApplication schema */ };
const faqSchema = { /* FAQPage schema */ };
const breadcrumbSchema = { /* BreadcrumbList schema */ };
---

<BaseLayout {title} {description} {canonical} 
  schema={[schema, faqSchema, breadcrumbSchema]}>
  <Header />

  <main>
    <!-- Breadcrumb -->
    <div class="page-container" style="padding-top: 1rem;">
      <nav aria-label="breadcrumb">
        <ol style="list-style:none;padding:0;margin:0;display:flex;
          gap:0.5rem;font-size:0.875rem;color:var(--text-secondary);">
          <li><a href="/" style="color:var(--text-secondary);
            text-decoration:none;">Home</a></li>
          <li>/</li>
          <li aria-current="page">[Calculator Name]</li>
        </ol>
      </nav>
    </div>

    <!-- Hero -->
    <div class="page-container">
      <div style="margin-top:16px;margin-bottom:16px;">
        <AdLeaderboard client:idle />
      </div>
      <section class="hero">
        <h1>[Calculator Name]</h1>
        <p>[One line description of what it does]</p>
      </section>

      <!-- Calculator Widget -->
      <div class="calc-card" id="calc-widget">
        <!-- INPUTS -->
        <div id="calc-form">
          <!-- All inputs here -->
        </div>

        <!-- EMPTY STATE -->
        <div id="empty-state" class="calc-empty">
          <div style="width:56px;height:56px;border-radius:50%;
            background:var(--accent-light);display:flex;
            align-items:center;justify-content:center;margin:0 auto 12px;">
            <!-- Icon SVG here -->
          </div>
          <p style="font-weight:600;color:var(--text-primary);">
            Fill in your details
          </p>
          <p style="font-size:14px;color:var(--text-secondary);">
            Results appear instantly
          </p>
        </div>

        <!-- RESULTS (hidden until calculated) -->
        <div id="results" style="display:none;">
          <!-- Result cards here -->
        </div>
      </div>

      <RelatedCalculators current="/[calculator-url]" />
    </div>

    <!-- SEO Content -->
    <section class="content-section">
      <AdInArticle client:idle />
      <!-- H2, H3, paragraphs, tables, FAQ -->
    </section>
  </main>

  <Footer />
</BaseLayout>

<script>
  // All calculator logic here — vanilla JS only
  // No imports, no external dependencies

  // 1. Get DOM elements
  // 2. Add event listeners to all inputs
  // 3. On any change: calculate() → render()

  function calculate() {
    // Read input values
    // Run formula
    // Return result object
  }

  function render(result) {
    // If no valid result: show empty state, hide results
    // If valid result: hide empty state, show results
    // Update each result card's text content
  }

  // Wire up
  document.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', () => {
      const result = calculate();
      render(result);
    });
  });

  // Segment control clicks
  document.querySelectorAll('.segment-option').forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active from siblings
      btn.parentElement.querySelectorAll('.segment-option')
        .forEach(b => b.classList.remove('active'));
      // Add active to clicked
      btn.classList.add('active');
      // Recalculate
      const result = calculate();
      render(result);
    });
  });
</script>
```

### 7.4 RelatedCalculators.astro Update

Add these new calculator entries to `RelatedCalculators.astro`:

```javascript
const allCalculators = [
  // Existing
  { href: '/',                           title: 'Macro Calculator',         desc: 'TDEE + full macro breakdown' },
  { href: '/tdee-calculator',            title: 'TDEE Calculator',          desc: 'Total daily calorie burn' },
  { href: '/calorie-deficit-calculator', title: 'Calorie Deficit',          desc: 'Deficit and weight loss timeline' },
  { href: '/protein-calculator',         title: 'Protein Calculator',       desc: 'Daily protein target' },
  { href: '/bmi-calculator',             title: 'BMI Calculator',           desc: 'Body mass index' },
  { href: '/bmr-calculator',             title: 'BMR Calculator',           desc: 'Basal metabolic rate' },
  // NEW Priority 1
  { href: '/body-fat-calculator',        title: 'Body Fat Calculator',      desc: 'Body fat % using Navy method' },
  { href: '/ideal-weight-calculator',    title: 'Ideal Weight Calculator',  desc: 'Healthy goal weight range' },
  { href: '/calorie-burn-calculator',    title: 'Calorie Burn Calculator',  desc: 'Calories burned by exercise' },
  { href: '/water-intake-calculator',    title: 'Water Intake Calculator',  desc: 'Daily hydration target' },
  { href: '/lean-body-mass-calculator',  title: 'Lean Body Mass',           desc: 'LBM and Katch-McArdle BMR' },
];
```

### 7.5 sitemap.xml Update

After building all 5 pages, add to `public/sitemap.xml`:

```xml
<url>
  <loc>https://calcmacros.com/body-fat-calculator</loc>
  <changefreq>weekly</changefreq>
  <priority>0.9</priority>
</url>
<url>
  <loc>https://calcmacros.com/ideal-weight-calculator</loc>
  <changefreq>weekly</changefreq>
  <priority>0.9</priority>
</url>
<url>
  <loc>https://calcmacros.com/calorie-burn-calculator</loc>
  <changefreq>weekly</changefreq>
  <priority>0.9</priority>
</url>
<url>
  <loc>https://calcmacros.com/water-intake-calculator</loc>
  <changefreq>weekly</changefreq>
  <priority>0.9</priority>
</url>
<url>
  <loc>https://calcmacros.com/lean-body-mass-calculator</loc>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
</url>
```

### 7.6 Header Nav Update

Add these to the nav — but keep nav clean. Add only the most important ones:

```javascript
// Header.astro — add after existing links
{ href: '/body-fat-calculator',       label: 'Body Fat' },
{ href: '/water-intake-calculator',   label: 'Water' },
```

Or better — add a "More" dropdown on desktop that shows all calculators.

---

## Part 8 — SEO Content Requirements Per Page

Every calculator page must have this minimum content to rank:

| Section | Min words | Purpose |
|---|---|---|
| Introduction paragraph | 150 | Primary keyword in first 100 words |
| How to use | 200 | Step-by-step, targets "how to" snippets |
| How we calculate | 300 | Formula transparency, builds trust |
| Understanding results | 250 | Explains each output |
| Goal/category table | 100 | Table = featured snippet opportunity |
| FAQ (min 6 Q&As) | 400 | People Also Ask targeting |
| Medical disclaimer | 50 | AdSense + trust |
| **Total minimum** | **1,450** | **Per page** |

---

## Part 9 — AdSense Ad Placement Per Calculator Page

```
Position 1: Below hero, above calculator     → AdLeaderboard (728×90 / 320×50)
Position 2: After calculator, before content → AdInArticle (responsive)
Position 3: Mid-content after 2nd H2         → AdInArticle (responsive)
```

Maximum 3 ads per page. Never inside or between calculator inputs/outputs.

---

## Part 10 — Launch Checklist Per Calculator

Before pushing each calculator live:

- [ ] Page loads and calculator works on localhost
- [ ] Metric/Imperial toggle works correctly
- [ ] Results update on every input change
- [ ] Empty state shows correctly before inputs filled
- [ ] All result numbers are correct (test against known values)
- [ ] Mobile layout correct at 375px — no horizontal scroll
- [ ] All inputs minimum 16px font size (no iOS zoom)
- [ ] Schema markup valid (test with Google Rich Results Test)
- [ ] Canonical tag correct
- [ ] Title and meta description correct lengths
- [ ] Internal links all working
- [ ] RelatedCalculators shows correct related pages
- [ ] Page added to sitemap.xml
- [ ] Page added to Header nav (if applicable)
- [ ] Pushed to GitHub → deployed to Cloudflare
- [ ] URL resolves correctly on calcmacros.com
- [ ] Request indexing in Google Search Console

---

## Part 11 — Traffic & Revenue Projections

Once all 5 Priority 1 calculators are live and indexed (Month 2–3):

| Calculator | Est. Monthly Sessions | AdSense Revenue (at $10 RPM) |
|---|---|---|
| Body Fat Calculator | 3,000–8,000 | $30–80 |
| Ideal Weight Calculator | 2,000–6,000 | $20–60 |
| Calorie Burn Calculator | 2,000–5,000 | $20–50 |
| Water Intake Calculator | 1,500–4,000 | $15–40 |
| Lean Body Mass Calculator | 800–2,000 | $8–20 |
| **Total new** | **9,300–25,000** | **$93–250/month** |
| Existing 6 calculators | 5,000–15,000 | $50–150 |
| **Grand total** | **14,300–40,000** | **$143–400/month** |

At Month 6 with blog content driving traffic: $400–800/month. At Month 12: $1,500–3,000/month.

---

*CalcMacros Priority 1 Calculators PRD v1.0*  
*July 2026*

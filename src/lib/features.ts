/**
 * Feature engineering: turns a 30-day history into one numeric feature row
 * that the trained models can consume.
 */

import { DailyRecord, dayDiastolic, daySystolic } from "./types";

export const FEATURE_NAMES = [
  "avg_sys_30d",
  "avg_dia_30d",
  "avg_sys_7d",
  "avg_dia_7d",
  "avg_sys_3d",
  "avg_dia_3d",
  "morning_avg_sys",
  "afternoon_avg_sys",
  "night_avg_sys",
  "sys_variability",
  "dia_variability",
  "sys_trend",
  "dia_trend",
  "max_sys",
  "min_sys",
  "avg_stress",
  "avg_stress_3d",
  "avg_sleep",
  "avg_sleep_3d",
  "avg_sleep_quality",
  "avg_salt",
  "avg_salt_3d",
  "avg_activity",
  "avg_activity_3d",
  "med_adherence",
  "weight_change",
  "avg_resting_hr",
  "avg_caffeine",
  "avg_alcohol",
  "avg_pain",
  "avg_steps",
  "smoking_days",
  "avg_fluid",
] as const;

const mean = (a: number[]) => (a.length ? a.reduce((x, v) => x + v, 0) / a.length : 0);
const std = (a: number[]) => {
  const m = mean(a);
  return Math.sqrt(mean(a.map((v) => (v - m) * (v - m))));
};
/** Simple least-squares slope: mmHg change per day. */
const slope = (a: number[]) => {
  const n = a.length;
  if (n < 2) return 0;
  const xm = (n - 1) / 2;
  const ym = mean(a);
  let num = 0;
  let den = 0;
  a.forEach((v, i) => {
    num += (i - xm) * (v - ym);
    den += (i - xm) * (i - xm);
  });
  return den ? num / den : 0;
};

/** The final n items of any array (works for records and numbers alike). */
const last = <T,>(n: number, a: T[]): T[] => a.slice(-n);

export interface FeatureSummary {
  values: number[];
  named: Record<string, number>;
}

/** history must be in chronological order (oldest first), ideally 30 days. */
export function buildFeatures(history: DailyRecord[]): FeatureSummary {
  const h = history.slice(-30);
  const sys = h.map(daySystolic);
  const dia = h.map(dayDiastolic);
  const lastRec = h[h.length - 1];
  const weekAgo = h[h.length - 8];

  const named: Record<string, number> = {
    avg_sys_30d: mean(sys),
    avg_dia_30d: mean(dia),
    avg_sys_7d: mean(last(7, sys)),
    avg_dia_7d: mean(last(7, dia)),
    avg_sys_3d: mean(last(3, sys)),
    avg_dia_3d: mean(last(3, dia)),
    morning_avg_sys: mean(h.map((r) => r.morning_systolic)),
    afternoon_avg_sys: mean(h.map((r) => r.afternoon_systolic)),
    night_avg_sys: mean(h.map((r) => r.night_systolic)),
    sys_variability: std(sys),
    dia_variability: std(dia),
    sys_trend: slope(last(7, sys)),
    dia_trend: slope(last(7, dia)),
    max_sys: sys.length ? Math.max(...sys) : 0,
    min_sys: sys.length ? Math.min(...sys) : 0,
    avg_stress: mean(h.map((r) => r.stress_level)),
    avg_stress_3d: mean(last(3, h).map((r) => r.stress_level)),
    avg_sleep: mean(h.map((r) => r.sleep_hours)),
    avg_sleep_3d: mean(last(3, h).map((r) => r.sleep_hours)),
    avg_sleep_quality: mean(h.map((r) => r.sleep_quality)),
    avg_salt: mean(h.map((r) => r.salt_intake)),
    avg_salt_3d: mean(last(3, h).map((r) => r.salt_intake)),
    avg_activity: mean(h.map((r) => r.physical_activity_minutes)),
    avg_activity_3d: mean(last(3, h).map((r) => r.physical_activity_minutes)),
    med_adherence: mean(h.map((r) => r.medication_adherence)),
    weight_change: lastRec && weekAgo ? lastRec.weight - weekAgo.weight : 0,
    avg_resting_hr: mean(last(7, h).map((r) => r.resting_heart_rate)),
    avg_caffeine: mean(h.map((r) => r.caffeine_intake)),
    avg_alcohol: mean(h.map((r) => r.alcohol)),
    avg_pain: mean(h.map((r) => r.pain_level)),
    avg_steps: mean(h.map((r) => r.steps)),
    smoking_days: h.filter((r) => r.smoking).length,
    avg_fluid: mean(h.map((r) => r.fluid_intake)),
  };

  return { values: FEATURE_NAMES.map((n) => named[n] ?? 0), named };
}

/* ------------------- plain-language explanation helpers ------------------- */

export interface ExplanationFactor {
  label: string;
  value: string;
  tone: "high" | "low" | "neutral" | "good";
}

/** Safe lookup for a named feature (features live in a string-keyed map). */
export const featureValue = (f: Record<string, number>, key: string): number => f[key] ?? 0;

export function explainPrediction(f: Record<string, number>): {
  factors: ExplanationFactor[];
  summary: string;
} {
  const v = (key: string) => featureValue(f, key);
  const factors: ExplanationFactor[] = [];
  const notes: string[] = [];

  const avgSys7 = v("avg_sys_7d");
  const avgSys30 = v("avg_sys_30d");
  const trend = avgSys7 - avgSys30;
  if (trend > 2) {
    factors.push({ label: "Recent BP trend", value: "Higher than 30-day average", tone: "high" });
    notes.push("recent blood pressure readings have been higher than the 30-day average");
  } else if (trend < -2) {
    factors.push({ label: "Recent BP trend", value: "Lower than 30-day average", tone: "low" });
    notes.push("recent blood pressure readings have been lower than the 30-day average");
  } else {
    factors.push({ label: "Recent BP trend", value: "Stable", tone: "neutral" });
    notes.push("recent blood pressure readings are close to the 30-day average");
  }

  if (v("avg_stress_3d") >= 7) {
    factors.push({ label: "Stress", value: "High recently", tone: "high" });
    notes.push("higher stress was recorded in the last few days");
  } else if (v("avg_stress_3d") <= 3) {
    factors.push({ label: "Stress", value: "Low recently", tone: "good" });
  } else {
    factors.push({ label: "Stress", value: "Moderate", tone: "neutral" });
  }

  if (v("avg_sleep_3d") < v("avg_sleep") - 0.5) {
    factors.push({ label: "Sleep", value: "Below recent average", tone: "high" });
    notes.push("sleep duration was below the user's usual level");
  } else {
    factors.push({ label: "Sleep", value: "In line with usual", tone: "good" });
  }

  if (v("avg_salt_3d") > v("avg_salt") + 0.5) {
    factors.push({ label: "Salt intake", value: "Higher than recent average", tone: "high" });
    notes.push("salt intake was higher than usual");
  } else {
    factors.push({ label: "Salt intake", value: "Around usual level", tone: "neutral" });
  }

  if (v("avg_activity_3d") < v("avg_activity") - 5) {
    factors.push({ label: "Physical activity", value: "Lower than recent average", tone: "low" });
    notes.push("physical activity was lower than usual");
  } else {
    factors.push({ label: "Physical activity", value: "Around usual level", tone: "good" });
  }

  const adherence = v("med_adherence");
  factors.push({
    label: "Medication adherence",
    value: adherence >= 90 ? "Good" : adherence >= 70 ? "Partial" : "Frequently missed doses",
    tone: adherence >= 90 ? "good" : "high",
  });

  const variability = v("sys_variability");
  factors.push({
    label: "BP variability",
    value: variability > 8 ? "High day-to-day variation" : "Fairly consistent",
    tone: variability > 8 ? "high" : "good",
  });

  const firstNote = notes[0] ?? "no notable recent changes were recorded";
  const summary =
    notes.length > 1
      ? `${capitalise(firstNote)}. Alongside this, ${notes
          .slice(1)
          .join(", and ")}. These are associations observed in the recorded data, not proven causes.`
      : `${capitalise(firstNote)}. This is an association observed in the recorded data, not a proven cause.`;

  return { factors, summary };
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

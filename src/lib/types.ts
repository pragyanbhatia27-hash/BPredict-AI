/**
 * Core data types for BPredict AI.
 * One DailyRecord = one full day of BP + lifestyle data for one person.
 */

export type Mood = "calm" | "neutral" | "tense" | "low" | "happy";

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  morning_systolic: number;
  morning_diastolic: number;
  afternoon_systolic: number;
  afternoon_diastolic: number;
  night_systolic: number;
  night_diastolic: number;
  salt_intake: number; // grams
  physical_activity_minutes: number;
  exertion_level: number; // 1-10
  stress_level: number; // 1-10
  sleep_hours: number;
  sleep_quality: number; // 1-10
  medication_taken: boolean;
  medication_adherence: number; // 0-100 %
  fluid_intake: number; // litres
  caffeine_intake: number; // cups
  smoking: boolean;
  alcohol: number; // units
  pain_level: number; // 1-10
  steps: number;
  weight: number; // kg
  resting_heart_rate: number;
  mood: Mood;
  notes: string;
}

/** Mean systolic / diastolic across the three readings of a day. */
export const daySystolic = (r: DailyRecord) =>
  (r.morning_systolic + r.afternoon_systolic + r.night_systolic) / 3;

export const dayDiastolic = (r: DailyRecord) =>
  (r.morning_diastolic + r.afternoon_diastolic + r.night_diastolic) / 3;

/** 10 mmHg class edges. */
export const SYSTOLIC_BINS = [100, 110, 120, 130, 140, 150, 160, 170, 180, 190];
export const DIASTOLIC_BINS = [50, 60, 70, 80, 90, 100, 110, 120];

/** Maps a value to a class index inside a bin array (clamped). */
export function toClass(value: number, edges: number[]): number {
  const last = edges.length - 2;
  for (let i = 0; i < edges.length - 1; i++) {
    const next = edges[i + 1];
    if (next !== undefined && value < next) return Math.max(0, i);
  }
  return last;
}

export function classLabel(idx: number, edges: number[]): string {
  const i = Math.min(Math.max(idx, 0), edges.length - 2);
  return `${edges[i]}\u2013${edges[i + 1]}`;
}

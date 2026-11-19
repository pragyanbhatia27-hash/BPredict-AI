/**
 * Synthetic data generation.
 *
 * Two uses:
 *  1. generateTrainingCohort() -> many simulated patients x ~40 days each.
 *     This is the TRAINING DATA for the models. No real patient data is used.
 *  2. generateUserHistory() -> one simulated 30-day history used by Demo Mode.
 *
 * Lifestyle variables nudge blood pressure in physiologically plausible
 * directions, so the models have real (but synthetic) signal to learn.
 */

import { makeRng } from "./randomForest";
import { DailyRecord, Mood } from "./types";

const MOODS: Mood[] = ["calm", "neutral", "tense", "low", "happy"];

function isoDate(daysAgo: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

/** Generates one patient's longitudinal record set. */
export function generatePatient(days: number, seed: number, endOffset = 0): DailyRecord[] {
  const rng = makeRng(seed);
  const n = (scale = 1) => (rng() + rng() + rng() - 1.5) * 2 * scale; // ~normal

  // Patient baseline profile
  const baseSys = 118 + rng() * 45; // 118 - 163
  const baseDia = 72 + rng() * 28;
  let weight = 58 + rng() * 40;
  const hrBase = 62 + rng() * 20;
  const onMeds = rng() > 0.25;
  const adherenceProfile = onMeds ? 55 + rng() * 45 : 100;
  const smoker = rng() > 0.75;
  const saltHabit = 4 + rng() * 6;
  const activeHabit = 10 + rng() * 55;

  const records: DailyRecord[] = [];
  let drift = 0;

  for (let i = 0; i < days; i++) {
    drift += n(0.8);
    drift = Math.max(-8, Math.min(8, drift));

    const stress = clamp(Math.round(4 + n(2)), 1, 10);
    const sleep = clamp(7 + n(1.1), 3.5, 9.5);
    const sleepQuality = clamp(Math.round(sleep * 1.1 + n(1)), 1, 10);
    const salt = clamp(saltHabit + n(1.6), 1, 15);
    const activity = clamp(Math.round(activeHabit + n(15)), 0, 150);
    const exertion = clamp(Math.round(activity / 18 + n(1)), 1, 10);
    const adherence = clamp(Math.round(adherenceProfile + n(8)), 0, 100);
    const caffeine = clamp(Math.round(1.5 + n(1)), 0, 6);
    const alcohol = clamp(Math.round(Math.max(0, n(1.2))), 0, 6);
    const pain = clamp(Math.round(2 + n(1.4)), 1, 10);
    const fluid = clamp(2.2 + n(0.6), 0.6, 4.5);
    const steps = clamp(Math.round(4000 + activity * 55 + n(1400)), 500, 20000);
    weight = clamp(weight + n(0.15), 40, 140);
    const restingHr = clamp(Math.round(hrBase + stress * 0.8 - activity / 30 + n(3)), 48, 105);

    // Lifestyle influence on blood pressure (synthetic but plausible)
    const effect =
      (stress - 4) * 1.6 +
      (salt - 5) * 1.1 +
      (7 - sleep) * 1.4 +
      (30 - activity) * 0.06 +
      (100 - adherence) * 0.12 +
      alcohol * 0.9 +
      caffeine * 0.5 +
      (smoker ? 2.5 : 0) +
      (pain - 2) * 0.5;

    const mid = baseSys + drift + effect + n(2.2);
    const midD = baseDia + drift * 0.55 + effect * 0.55 + n(1.8);

    records.push({
      date: isoDate(days - 1 - i + endOffset),
      morning_systolic: Math.round(mid + 4 + n(2)),
      morning_diastolic: Math.round(midD + 3 + n(1.5)),
      afternoon_systolic: Math.round(mid + n(2)),
      afternoon_diastolic: Math.round(midD + n(1.5)),
      night_systolic: Math.round(mid - 4 + n(2)),
      night_diastolic: Math.round(midD - 3 + n(1.5)),
      salt_intake: round1(salt),
      physical_activity_minutes: activity,
      exertion_level: exertion,
      stress_level: stress,
      sleep_hours: round1(sleep),
      sleep_quality: sleepQuality,
      medication_taken: !onMeds ? false : adherence > 50,
      medication_adherence: adherence,
      fluid_intake: round1(fluid),
      caffeine_intake: caffeine,
      smoking: smoker,
      alcohol,
      pain_level: pain,
      steps,
      weight: round1(weight),
      resting_heart_rate: restingHr,
      mood: MOODS[Math.floor(rng() * MOODS.length)] ?? "neutral",
      notes: "",
    });
  }

  return records;
}

/** TRAINING DATA: many patients, ~40 days each (30 days of history + targets). */
export function generateTrainingCohort(nPatients = 260, daysPerPatient = 40): DailyRecord[][] {
  return Array.from({ length: nPatients }, (_, i) =>
    generatePatient(daysPerPatient, 1000 + i * 7919),
  );
}

/** Demo Mode: one new user's 30-day history. */
export function generateUserHistory(seed = Date.now() % 100000): DailyRecord[] {
  return generatePatient(30, seed);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

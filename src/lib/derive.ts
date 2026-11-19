/** Small helpers shared by the dashboard / chart pages. */
import { DailyRecord, dayDiastolic, daySystolic } from "./types";

export const mean = (a: number[]) => (a.length ? a.reduce((x, v) => x + v, 0) / a.length : 0);
export const r0 = (v: number) => Math.round(v);
export const r1 = (v: number) => Math.round(v * 10) / 10;

export function windowStats(records: DailyRecord[], days: number) {
  const w = records.slice(-days);
  return {
    systolic: mean(w.map(daySystolic)),
    diastolic: mean(w.map(dayDiastolic)),
    stress: mean(w.map((r) => r.stress_level)),
    sleep: mean(w.map((r) => r.sleep_hours)),
    salt: mean(w.map((r) => r.salt_intake)),
    activity: mean(w.map((r) => r.physical_activity_minutes)),
    adherence: mean(w.map((r) => r.medication_adherence)),
    steps: mean(w.map((r) => r.steps)),
    restingHr: mean(w.map((r) => r.resting_heart_rate)),
    weight: mean(w.map((r) => r.weight)),
  };
}

export const shortDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });

export function bpCategory(systolic: number, diastolic: number) {
  if (systolic >= 160 || diastolic >= 100)
    return { label: "Markedly elevated range", tone: "warning" as const };
  if (systolic >= 140 || diastolic >= 90) return { label: "Elevated range", tone: "warning" as const };
  if (systolic >= 130 || diastolic >= 85) return { label: "Upper-normal range", tone: "default" as const };
  if (systolic < 100) return { label: "Lower range", tone: "default" as const };
  return { label: "Within typical range", tone: "success" as const };
}

export function chartSeries(records: DailyRecord[]) {
  return records.slice(-30).map((r) => ({
    date: shortDate(r.date),
    systolic: r0(daySystolic(r)),
    diastolic: r0(dayDiastolic(r)),
    morning: r.morning_systolic,
    afternoon: r.afternoon_systolic,
    night: r.night_systolic,
    stress: r.stress_level,
    sleep: r.sleep_hours,
    salt: r.salt_intake,
    activity: r.physical_activity_minutes,
    adherence: r.medication_adherence,
    steps: r.steps,
    weight: r.weight,
    restingHr: r.resting_heart_rate,
  }));
}

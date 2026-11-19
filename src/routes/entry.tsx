import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useRecords } from "@/lib/store";
import type { DailyRecord, Mood } from "@/lib/types";

export const Route = createFileRoute("/entry")({
  head: () => ({
    meta: [
      { title: "Daily Entry — BPredict AI" },
      {
        name: "description",
        content:
          "Record morning, afternoon and night blood pressure plus salt, sleep, stress, activity, medication and other daily lifestyle details.",
      },
      { property: "og:title", content: "Daily Entry — BPredict AI" },
      {
        property: "og:description",
        content: "Add one day of blood pressure readings and lifestyle information.",
      },
    ],
  }),
  component: EntryPage,
});

const today = () => new Date().toISOString().slice(0, 10);

const blank = (): DailyRecord => ({
  date: today(),
  morning_systolic: 125,
  morning_diastolic: 82,
  afternoon_systolic: 122,
  afternoon_diastolic: 80,
  night_systolic: 118,
  night_diastolic: 76,
  salt_intake: 5,
  physical_activity_minutes: 30,
  exertion_level: 4,
  stress_level: 4,
  sleep_hours: 7,
  sleep_quality: 7,
  medication_taken: true,
  medication_adherence: 100,
  fluid_intake: 2.2,
  caffeine_intake: 1,
  smoking: false,
  alcohol: 0,
  pain_level: 1,
  steps: 6000,
  weight: 70,
  resting_heart_rate: 72,
  mood: "neutral",
  notes: "",
});

function EntryPage() {
  const { upsert, records, hydrated } = useRecords();
  const [form, setForm] = useState<DailyRecord>(blank);

  // Salt can be typed in grams, teaspoons or tablespoons; the record always
  // stores grams so the ML model sees one consistent unit.
  const [saltUnit, setSaltUnit] = useState<SaltUnit>("g");
  const [saltValue, setSaltValue] = useState<number>(blank().salt_intake);

  const set = <K extends keyof DailyRecord>(key: K, value: DailyRecord[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  /** Convert the typed value into grams (the unit the model expects). */
  const setSalt = (v: number) => {
    setSaltValue(v);
    set("salt_intake", Math.round(v * SALT_UNITS[saltUnit].grams * 10) / 10);
  };

  /** Switch units and re-express the current amount in the new unit. */
  const changeSaltUnit = (u: SaltUnit) => {
    const grams = saltValue * SALT_UNITS[saltUnit].grams;
    setSaltUnit(u);
    setSaltValue(Math.round((grams / SALT_UNITS[u].grams) * 10) / 10);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    upsert(form);
    toast.success(`Saved record for ${form.date}`);
    setForm({ ...blank(), date: form.date });
    setSaltUnit("g");
    setSaltValue(blank().salt_intake);
  };

  return (
    <AppShell
      title="Daily Entry"
      subtitle={
        hydrated
          ? `${records.length} of 30 days recorded. Saving the same date again replaces that day.`
          : "Loading…"
      }
    >
      <form onSubmit={submit} className="grid gap-4">
        <Section title="Date">
          <Field label="Date">
            <input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className={inputClass}
              required
            />
          </Field>
        </Section>

        <Section title="Blood pressure readings (mmHg)">
          {(
            [
              ["Morning systolic", "morning_systolic"],
              ["Morning diastolic", "morning_diastolic"],
              ["Afternoon systolic", "afternoon_systolic"],
              ["Afternoon diastolic", "afternoon_diastolic"],
              ["Night systolic", "night_systolic"],
              ["Night diastolic", "night_diastolic"],
            ] as const
          ).map(([label, key]) => (
            <NumField
              key={key}
              label={label}
              value={form[key] as number}
              min={40}
              max={250}
              onChange={(v) => set(key, v as never)}
            />
          ))}
        </Section>

        <Section title="Lifestyle">
          <SaltField
            value={saltValue}
            unit={saltUnit}
            grams={form.salt_intake}
            onValue={setSalt}
            onUnit={changeSaltUnit}
          />
          <NumField
            label="Physical activity (min)"
            value={form.physical_activity_minutes}
            min={0}
            max={400}
            onChange={(v) => set("physical_activity_minutes", v)}
          />
          <NumField
            label="Exertion level (1-10)"
            value={form.exertion_level}
            min={1}
            max={10}
            onChange={(v) => set("exertion_level", v)}
          />
          <NumField
            label="Stress level (1-10)"
            value={form.stress_level}
            min={1}
            max={10}
            onChange={(v) => set("stress_level", v)}
          />
          <NumField
            label="Sleep (hours)"
            value={form.sleep_hours}
            step={0.1}
            min={0}
            max={16}
            onChange={(v) => set("sleep_hours", v)}
          />
          <NumField
            label="Sleep quality (1-10)"
            value={form.sleep_quality}
            min={1}
            max={10}
            onChange={(v) => set("sleep_quality", v)}
          />
          <NumField
            label="Fluid intake (litres)"
            value={form.fluid_intake}
            step={0.1}
            min={0}
            max={10}
            onChange={(v) => set("fluid_intake", v)}
          />
          <NumField
            label="Caffeine (cups)"
            value={form.caffeine_intake}
            min={0}
            max={15}
            onChange={(v) => set("caffeine_intake", v)}
          />
          <NumField
            label="Alcohol (units)"
            value={form.alcohol}
            min={0}
            max={20}
            onChange={(v) => set("alcohol", v)}
          />
          <NumField
            label="Pain level (1-10)"
            value={form.pain_level}
            min={1}
            max={10}
            onChange={(v) => set("pain_level", v)}
          />
          <NumField
            label="Daily steps"
            value={form.steps}
            min={0}
            max={60000}
            onChange={(v) => set("steps", v)}
          />
          <NumField
            label="Weight (kg)"
            value={form.weight}
            step={0.1}
            min={20}
            max={250}
            onChange={(v) => set("weight", v)}
          />
          <NumField
            label="Resting heart rate (bpm)"
            value={form.resting_heart_rate}
            min={30}
            max={180}
            onChange={(v) => set("resting_heart_rate", v)}
          />
          <NumField
            label="Medication adherence (%)"
            value={form.medication_adherence}
            min={0}
            max={100}
            onChange={(v) => set("medication_adherence", v)}
          />
          <Field label="Mood">
            <select
              value={form.mood}
              onChange={(e) => set("mood", e.target.value as Mood)}
              className={inputClass}
            >
              {["calm", "neutral", "tense", "low", "happy"].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Medication taken today">
            <Toggle
              checked={form.medication_taken}
              onChange={(v) => set("medication_taken", v)}
              labels={["Taken", "Missed"]}
            />
          </Field>
          <Field label="Smoking today">
            <Toggle
              checked={form.smoking}
              onChange={(v) => set("smoking", v)}
              labels={["Yes", "No"]}
            />
          </Field>
        </Section>

        <Section title="Notes / symptoms">
          <div className="sm:col-span-3">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              placeholder="Headache in the morning, busy day at work…"
              className={inputClass}
            />
          </div>
        </Section>

        <div>
          <button
            type="submit"
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Save daily record
          </button>
        </div>
      </form>
    </AppShell>
  );
}

const inputClass =
  "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="card-surface p-4">
      <legend className="font-display px-1 text-sm font-semibold">{title}</legend>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function NumField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className={inputClass}
        required
      />
    </Field>
  );
}

/* ---------------- Salt intake with a unit switcher (g / tsp / tbsp) ----------------
 * The model is trained on grams, so whatever the user types is normalised to
 * grams before it is stored: 1 teaspoon ≈ 6 g, 1 tablespoon ≈ 18 g. */

const SALT_UNITS = {
  g: { grams: 1, max: 15 }, // recommended daily range 0.5–15 g
  tsp: { grams: 6, max: 2.5 }, // 2.5 tsp ≈ 15 g
  tbsp: { grams: 18, max: 0.8 }, // 0.8 tbsp ≈ 15 g
} as const;

type SaltUnit = keyof typeof SALT_UNITS;

function SaltField({
  value,
  unit,
  grams,
  onValue,
  onUnit,
}: {
  value: number;
  unit: SaltUnit;
  grams: number;
  onValue: (v: number) => void;
  onUnit: (u: SaltUnit) => void;
}) {
  const u = SALT_UNITS[unit];
  return (
    <Field label="Salt intake">
      <div className="flex gap-2">
        <input
          type="number"
          value={value}
          step={0.1}
          min={0}
          max={u.max}
          onChange={(e) => onValue(Number(e.target.value))}
          className={inputClass}
          required
        />
        <select
          value={unit}
          onChange={(e) => onUnit(e.target.value as SaltUnit)}
          className={`${inputClass} w-24 shrink-0`}
          aria-label="Salt unit"
        >
          <option value="g">g</option>
          <option value="tsp">tsp</option>
          <option value="tbsp">tbsp</option>
        </select>
      </div>
      <span className="mt-1 block text-xs text-muted-foreground">
        ≈ {grams.toFixed(1)} g table salt · 1 tsp ≈ 6 g · 1 tbsp ≈ 18 g
      </span>
    </Field>
  );
}

function Toggle({
  checked,
  onChange,
  labels,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  labels: [string, string];
}) {
  return (
    <div className="flex gap-2">
      {[true, false].map((v, i) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
            checked === v
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:bg-secondary"
          }`}
        >
          {labels[i]}
        </button>
      ))}
    </div>
  );
}

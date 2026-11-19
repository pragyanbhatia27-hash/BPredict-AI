import { createFileRoute } from "@tanstack/react-router";
import { AppShell, EmptyState, StatCard } from "@/components/AppShell";
import { r0, r1, windowStats } from "@/lib/derive";
import { useRecords } from "@/lib/store";
import { dayDiastolic, daySystolic } from "@/lib/types";

export const Route = createFileRoute("/lifestyle")({
  head: () => ({
    meta: [
      { title: "Lifestyle Analysis — BPredict AI" },
      {
        name: "description",
        content:
          "Compares the last 7 days of lifestyle habits with the 30-day baseline and shows how each factor moves alongside blood pressure.",
      },
      { property: "og:title", content: "Lifestyle Analysis — BPredict AI" },
      {
        property: "og:description",
        content: "7-day vs 30-day lifestyle comparison and correlation with blood pressure.",
      },
    ],
  }),
  component: LifestylePage,
});

/** Pearson correlation — used only to describe associations, never causation. */
function correlation(a: number[], b: number[]) {
  const n = a.length;
  if (n < 3) return 0;
  const ma = a.reduce((x, v) => x + v, 0) / n;
  const mb = b.reduce((x, v) => x + v, 0) / n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const ai = a[i];
    const bi = b[i];
    if (ai === undefined || bi === undefined) continue;
    num += (ai - ma) * (bi - mb);
    da += (ai - ma) ** 2;
    db += (bi - mb) ** 2;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

function LifestylePage() {
  const { records, hydrated, loadDemo } = useRecords();
  if (!hydrated) return <AppShell title="Lifestyle Analysis">Loading…</AppShell>;
  if (records.length === 0)
    return (
      <AppShell title="Lifestyle Analysis">
        <EmptyState onLoadDemo={loadDemo} />
      </AppShell>
    );

  const w = records.slice(-30);
  const sys = w.map(daySystolic);
  const s30 = windowStats(records, 30);
  const s7 = windowStats(records, 7);

  const factors = [
    { name: "Stress level", values: w.map((r) => r.stress_level), recent: s7.stress, base: s30.stress, unit: "/10" },
    { name: "Sleep hours", values: w.map((r) => r.sleep_hours), recent: s7.sleep, base: s30.sleep, unit: "h" },
    { name: "Salt intake", values: w.map((r) => r.salt_intake), recent: s7.salt, base: s30.salt, unit: "g" },
    { name: "Physical activity", values: w.map((r) => r.physical_activity_minutes), recent: s7.activity, base: s30.activity, unit: "min" },
    { name: "Medication adherence", values: w.map((r) => r.medication_adherence), recent: s7.adherence, base: s30.adherence, unit: "%" },
    { name: "Daily steps", values: w.map((r) => r.steps), recent: s7.steps, base: s30.steps, unit: "" },
    { name: "Resting heart rate", values: w.map((r) => r.resting_heart_rate), recent: s7.restingHr, base: s30.restingHr, unit: "bpm" },
    { name: "Caffeine", values: w.map((r) => r.caffeine_intake), recent: 0, base: 0, unit: "cups", skipDelta: true },
    { name: "Alcohol", values: w.map((r) => r.alcohol), recent: 0, base: 0, unit: "units", skipDelta: true },
    { name: "Pain level", values: w.map((r) => r.pain_level), recent: 0, base: 0, unit: "/10", skipDelta: true },
    { name: "Fluid intake", values: w.map((r) => r.fluid_intake), recent: 0, base: 0, unit: "L", skipDelta: true },
    { name: "Weight", values: w.map((r) => r.weight), recent: s7.weight, base: s30.weight, unit: "kg" },
  ];

  return (
    <AppShell
      title="Lifestyle Analysis"
      subtitle="How recent habits compare with the 30-day baseline, and how each one moved alongside systolic BP."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="30-day BP" value={`${r0(s30.systolic)}/${r0(s30.diastolic)}`} unit="mmHg" />
        <StatCard label="7-day BP" value={`${r0(s7.systolic)}/${r0(s7.diastolic)}`} unit="mmHg" />
        <StatCard
          label="Highest daily systolic"
          value={r0(Math.max(...sys))}
          unit="mmHg"
          tone="warning"
        />
        <StatCard
          label="BP variability"
          value={r1(
            Math.sqrt(sys.reduce((a, v) => a + (v - s30.systolic) ** 2, 0) / sys.length),
          )}
          unit="mmHg SD"
        />
      </div>

      <div className="card-surface mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
              <th className="px-4 py-3 font-medium">Factor</th>
              <th className="px-4 py-3 font-medium">Last 7 days</th>
              <th className="px-4 py-3 font-medium">30-day baseline</th>
              <th className="px-4 py-3 font-medium">Change</th>
              <th className="px-4 py-3 font-medium">Association with systolic BP</th>
            </tr>
          </thead>
          <tbody>
            {factors.map((f) => {
              const c = correlation(f.values, sys);
              const avg = f.values.reduce((a, v) => a + v, 0) / f.values.length;
              const recent7 =
                f.values.slice(-7).reduce((a, v) => a + v, 0) / Math.min(7, f.values.length);
              const delta = recent7 - avg;
              return (
                <tr key={f.name} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium">{f.name}</td>
                  <td className="px-4 py-3">
                    {r1(recent7)} {f.unit}
                  </td>
                  <td className="px-4 py-3">
                    {r1(avg)} {f.unit}
                  </td>
                  <td
                    className={`px-4 py-3 ${Math.abs(delta) < 0.05 * Math.max(1, Math.abs(avg)) ? "text-muted-foreground" : delta > 0 ? "text-warning" : "text-primary"}`}
                  >
                    {delta >= 0 ? "+" : ""}
                    {r1(delta)} {f.unit}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full rounded-full ${c >= 0 ? "bg-warning" : "bg-primary"}`}
                          style={{ width: `${Math.min(100, Math.abs(c) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {c >= 0 ? "+" : ""}
                        {c.toFixed(2)} ({strength(c)})
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Correlation values describe how two recorded values moved together over the last 30 days.
        They do not show that one factor caused the other.
      </p>
    </AppShell>
  );
}

function strength(c: number) {
  const a = Math.abs(c);
  if (a >= 0.6) return "strong";
  if (a >= 0.3) return "moderate";
  if (a >= 0.15) return "weak";
  return "little/none";
}

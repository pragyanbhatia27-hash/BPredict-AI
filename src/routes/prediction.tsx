import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDown, ArrowUp, BrainCircuit, Minus } from "lucide-react";
import { AppShell, EmptyState } from "@/components/AppShell";
import { useRecords } from "@/lib/store";
import { usePrediction } from "@/lib/usePrediction";
import type { ExplanationFactor } from "@/lib/features";

export const Route = createFileRoute("/prediction")({
  head: () => ({
    meta: [
      { title: "AI Prediction — BPredict AI" },
      {
        name: "description",
        content:
          "Next 24-hour blood pressure range prediction with confidence, the full probability distribution and an explainable-AI breakdown of the contributing factors.",
      },
      { property: "og:title", content: "AI Prediction — BPredict AI" },
      {
        property: "og:description",
        content: "Predicted 24-hour blood pressure range with confidence and plain-English explanations.",
      },
    ],
  }),
  component: PredictionPage,
});

/**
 * AI Prediction page.
 *
 * Shows:
 *  1. The predicted systolic / diastolic ranges with confidence.
 *  2. The full probability distribution across all 10 mmHg classes.
 *  3. A plain-English summary of why the model leaned that way.
 *  4. Top contributing factors with a "recent vs 30-day baseline" comparison.
 *  5. A simplified "how the model decided" flow.
 *
 * Language rule: everything here is phrased as an association observed in the
 * recorded data. Nothing on this page claims a cause or gives medical advice.
 */

const toneChip: Record<ExplanationFactor["tone"], string> = {
  high: "border-warning/40 bg-warning/10 text-warning",
  low: "border-primary/40 bg-primary/10 text-primary",
  good: "border-success/40 bg-success/10 text-success",
  neutral: "border-border bg-secondary text-muted-foreground",
};

function PredictionPage() {
  const { records, hydrated, loadDemo } = useRecords();
  const { prediction, status } = usePrediction(records, hydrated);

  if (!hydrated) return <AppShell title="AI Prediction">Loading…</AppShell>;

  if (records.length === 0)
    return (
      <AppShell title="AI Prediction">
        <EmptyState onLoadDemo={loadDemo} />
      </AppShell>
    );

  if (records.length < 30 || status !== "ready" || !prediction) {
    return (
      <AppShell
        title="AI Prediction"
        subtitle="The model needs a full 30-day history before it can forecast the next 24 hours."
      >
        <div className="card-surface p-8 text-center">
          <BrainCircuit className="mx-auto size-10 text-primary" />
          <p className="font-display mt-4 text-lg font-semibold">
            {records.length}/30 days recorded
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {records.length < 30
              ? `${30 - records.length} more day(s) needed. Add them in Daily Entry, or use Demo Mode for a ready-made 30-day synthetic history.`
              : "Training the two Random Forest models and analysing the history…"}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              onClick={loadDemo}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Generate 30-day demo patient
            </button>
            <Link
              to="/entry"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              Go to Daily Entry
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const f = prediction.features;
  const sysProbs = prediction.systolicDistribution.map((d) => d.probability);
  const diaProbs = prediction.diastolicDistribution.map((d) => d.probability);
  const sysWin = sysProbs.indexOf(Math.max(...sysProbs));
  const diaWin = diaProbs.indexOf(Math.max(...diaProbs));

  return (
    <AppShell
      title="AI Prediction"
      subtitle="Estimated blood pressure range for the next 24 hours, based on the last 30 days of records."
    >
      {/* 1. Predicted ranges */}
      <section className="hero-gradient rounded-2xl p-5 text-primary-foreground shadow-[var(--shadow-raised)]">
        <p className="text-xs font-semibold tracking-widest uppercase opacity-80">
          Predicted next 24 hours
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-8">
          <div>
            <p className="text-xs opacity-80">Systolic range</p>
            <p className="font-display text-4xl font-semibold">
              {prediction.systolicRange} <span className="text-base font-normal">mmHg</span>
            </p>
            <p className="text-xs opacity-80">
              model confidence {(prediction.systolicConfidence * 100).toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="text-xs opacity-80">Diastolic range</p>
            <p className="font-display text-4xl font-semibold">
              {prediction.diastolicRange} <span className="text-base font-normal">mmHg</span>
            </p>
            <p className="text-xs opacity-80">
              model confidence {(prediction.diastolicConfidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </section>

      {/* 2. Plain-English summary */}
      <section className="card-surface mt-6 p-5">
        <p className="font-display text-sm font-semibold">In plain English</p>
        <p className="mt-2 text-sm text-muted-foreground">{prediction.summary}</p>
      </section>

      {/* 3. Probability distributions */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Systolic probability by 10 mmHg class"
          note={`Tallest bar = the predicted range (${prediction.systolicRange} mmHg).`}
        >
          <DistributionChart
            data={prediction.systolicDistribution}
            winner={sysWin}
            color="var(--color-chart-1)"
          />
        </ChartCard>
        <ChartCard
          title="Diastolic probability by 10 mmHg class"
          note={`Tallest bar = the predicted range (${prediction.diastolicRange} mmHg).`}
        >
          <DistributionChart
            data={prediction.diastolicDistribution}
            winner={diaWin}
            color="var(--color-chart-2)"
          />
        </ChartCard>
      </div>

      {/* 4. Top contributing factors + baseline comparison */}
      <section className="card-surface mt-6 p-5">
        <p className="font-display text-sm font-semibold">Top contributing factors</p>
        <p className="mt-1 text-xs text-muted-foreground">
          What the two Random Forest models weighed most heavily for this history. Descriptive
          only — the model observes patterns, it does not diagnose.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {prediction.factors.map((factor) => (
            <span
              key={factor.label}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${toneChip[factor.tone]}`}
            >
              {factor.label}: {factor.value}
            </span>
          ))}
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="py-2 pr-4 font-medium">Input the model saw</th>
                <th className="py-2 pr-4 font-medium">Recent value</th>
                <th className="py-2 pr-4 font-medium">30-day baseline</th>
                <th className="py-2 font-medium">Difference</th>
              </tr>
            </thead>
            <tbody>
              {comparisons(f).map((row) => (
                <tr key={row.label} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-4 font-medium">{row.label}</td>
                  <td className="py-2.5 pr-4">{row.fmt(row.recent)}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{row.fmt(row.base)}</td>
                  <td className="py-2.5">
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        row.neutral
                          ? "text-muted-foreground"
                          : row.diff > 0
                            ? "text-warning"
                            : "text-primary"
                      }`}
                    >
                      {row.neutral ? (
                        <Minus className="size-3.5" />
                      ) : row.diff > 0 ? (
                        <ArrowUp className="size-3.5" />
                      ) : (
                        <ArrowDown className="size-3.5" />
                      )}
                      {row.diff > 0 ? "+" : ""}
                      {row.fmt(row.diff)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Example reading: &ldquo;3-day salt average 8.2 g vs 30-day baseline 4.8 g&rdquo; means the
          recorded salt intake was recently higher than usual — the model treats that as an input
          feature, not as a diagnosis.
        </p>
      </section>

      {/* 5. How the model decided (simplified flow) */}
      <section className="card-surface mt-6 p-5">
        <p className="font-display text-sm font-semibold">How the model decided</p>
        <p className="mt-1 text-xs text-muted-foreground">
          A simplified picture of how much each group of inputs shapes the prediction. In the real
          model, all 33 features are fed to 25 decision trees and their averaged vote picks the
          range.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <FlowStep
            step="1"
            title="Baseline history"
            weight="~60%"
            weightWidth="60%"
            detail="30-day averages of systolic and diastolic BP — the strongest signal for where tomorrow's readings usually sit."
          />
          <FlowStep
            step="2"
            title="Recent 3-day changes"
            weight="~30%"
            weightWidth="30%"
            detail="Latest 3-day averages vs baseline: salt, sleep, stress, activity — which way the trend is moving."
          />
          <FlowStep
            step="3"
            title="Lifestyle context"
            weight="~10%"
            weightWidth="10%"
            detail="Medication adherence, variability, weight change, resting heart rate and the remaining recorded inputs."
          />
        </div>
      </section>

      <p className="mt-6 text-xs text-muted-foreground">
        Factors above are associations observed in the recorded data — they are not proven causes,
        and none of this is medical advice.
      </p>
    </AppShell>
  );
}

/* -------- helpers -------- */

interface ComparisonRow {
  label: string;
  recent: number;
  base: number;
  diff: number;
  fmt: (v: number) => string;
  /** true when a higher/lower value is not obviously better or worse */
  neutral?: boolean;
}

function comparisons(f: Record<string, number>): ComparisonRow[] {
  // Features live in a string-keyed map, so read them with a safe helper.
  const g = (key: string): number => f[key] ?? 0;
  const d1 = (v: number) => v.toFixed(1);
  const d0 = (v: number) => Math.round(v).toString();
  const mk = (
    label: string,
    recent: number,
    base: number,
    unit: string,
    fmt: (v: number) => string,
    neutral = false,
  ): ComparisonRow => ({
    label,
    recent,
    base,
    diff: recent - base,
    fmt: (v) => `${fmt(v)} ${unit}`,
    neutral,
  });

  return [
    mk("Systolic BP · 7-day avg", g("avg_sys_7d"), g("avg_sys_30d"), "mmHg", d0, true),
    mk("Salt intake · 3-day avg", g("avg_salt_3d"), g("avg_salt"), "g", d1),
    mk("Sleep duration · 3-day avg", g("avg_sleep_3d"), g("avg_sleep"), "h", d1),
    mk("Stress level · 3-day avg", g("avg_stress_3d"), g("avg_stress"), "/10", d1),
    mk("Physical activity · 3-day avg", g("avg_activity_3d"), g("avg_activity"), "min", d0),
  ];
}

function DistributionChart({
  data,
  winner,
  color,
}: {
  data: { label: string; probability: number }[];
  winner: number;
  color: string;
}) {
  return (
    <BarChart data={data} margin={{ bottom: 8 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
      <XAxis
        dataKey="label"
        tick={{ fontSize: 9 }}
        interval={0}
        angle={-40}
        textAnchor="end"
        height={52}
      />
      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${Math.round(v * 100)}%`} />
      <Tooltip
        formatter={(v: number | string) => [
          `${(Number(v) * 100).toFixed(1)}% probability`,
          "Model probability",
        ]}
      />
      <Bar dataKey="probability" radius={[3, 3, 0, 0]}>
        {data.map((_, i) => (
          <Cell key={i} fill={i === winner ? color : "var(--color-muted-foreground)"} fillOpacity={i === winner ? 1 : 0.35} />
        ))}
      </Bar>
    </BarChart>
  );
}

function FlowStep({
  step,
  title,
  weight,
  weightWidth,
  detail,
}: {
  step: string;
  title: string;
  weight: string;
  weightWidth: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <div className="flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {step}
        </span>
        <p className="text-sm font-semibold">{title}</p>
        <span className="ml-auto text-xs text-muted-foreground">{weight}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary/70" style={{ width: weightWidth }} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function ChartCard({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactElement;
}) {
  return (
    <div className="card-surface p-4">
      <p className="font-display mb-1 text-sm font-semibold">{title}</p>
      {note && <p className="mb-2 text-xs text-muted-foreground">{note}</p>}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

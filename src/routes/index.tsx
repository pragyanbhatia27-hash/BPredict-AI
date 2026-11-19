import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, EmptyState, StatCard } from "@/components/AppShell";
import { bpCategory, chartSeries, r0, r1, windowStats } from "@/lib/derive";
import { useRecords } from "@/lib/store";
import { usePrediction } from "@/lib/usePrediction";
import { dayDiastolic, daySystolic } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — BPredict AI" },
      {
        name: "description",
        content:
          "Overview of today's blood pressure, 7- and 30-day averages, lifestyle summary and the predicted next 24-hour BP range.",
      },
      { property: "og:title", content: "Dashboard — BPredict AI" },
      {
        property: "og:description",
        content: "Blood pressure averages, lifestyle summary and the next 24-hour prediction.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { records, hydrated, demo, loadDemo, clearAll } = useRecords();
  const { prediction, status } = usePrediction(records, hydrated);

  if (!hydrated) {
    return (
      <AppShell title="Dashboard">
        <p className="text-sm text-muted-foreground">Loading your records…</p>
      </AppShell>
    );
  }

  if (records.length === 0) {
    return (
      <AppShell
        title="Dashboard"
        subtitle="Track 30 days of readings, then get an estimated next 24-hour range."
      >
        <EmptyState onLoadDemo={loadDemo} />
      </AppShell>
    );
  }

  const latest = records[records.length - 1];
  if (!latest)
    return (
      <AppShell title="Dashboard">
        <p className="text-sm text-muted-foreground">No records available yet.</p>
      </AppShell>
    );
  const s30 = windowStats(records, 30);
  const s7 = windowStats(records, 7);
  const todaySys = r0(daySystolic(latest));
  const todayDia = r0(dayDiastolic(latest));
  const category = bpCategory(todaySys, todayDia);
  const series = chartSeries(records);

  return (
    <AppShell
      title="Dashboard"
      subtitle={`${records.length} days recorded${demo ? " · Demo Mode (synthetic data)" : ""}`}
    >
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={loadDemo}
          className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          {demo ? "Regenerate demo data" : "Switch to Demo Mode"}
        </button>
        <Link
          to="/entry"
          className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-secondary"
        >
          Add today&apos;s entry
        </Link>
        <button
          onClick={clearAll}
          className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary"
        >
          Clear all records
        </button>
      </div>

      {/* Prediction banner */}
      <section className="hero-gradient mb-6 rounded-2xl p-5 text-primary-foreground shadow-[var(--shadow-raised)]">
        <p className="text-xs font-semibold tracking-widest uppercase opacity-80">
          Expected next 24 hours
        </p>
        {records.length < 30 ? (
          <p className="mt-2 text-sm opacity-90">
            {30 - records.length} more day(s) of records needed before a prediction can be made.
          </p>
        ) : status !== "ready" || !prediction ? (
          <p className="mt-2 text-sm opacity-90">Training models and analysing 30-day history…</p>
        ) : (
          <div className="mt-3 flex flex-wrap items-end gap-8">
            <div>
              <p className="text-xs opacity-80">Systolic</p>
              <p className="font-display text-3xl font-semibold">
                {prediction.systolicRange} <span className="text-base font-normal">mmHg</span>
              </p>
              <p className="text-xs opacity-80">
                confidence {(prediction.systolicConfidence * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-xs opacity-80">Diastolic</p>
              <p className="font-display text-3xl font-semibold">
                {prediction.diastolicRange} <span className="text-base font-normal">mmHg</span>
              </p>
              <p className="text-xs opacity-80">
                confidence {(prediction.diastolicConfidence * 100).toFixed(0)}%
              </p>
            </div>
            <Link
              to="/prediction"
              className="rounded-lg bg-card/20 px-3 py-2 text-xs font-medium ring-1 ring-primary-foreground/30 hover:bg-card/30"
            >
              See explanation
            </Link>
          </div>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Latest reading"
          value={`${todaySys}/${todayDia}`}
          unit="mmHg"
          hint={`${latest.date} · ${category.label}`}
          tone={category.tone === "warning" ? "warning" : "primary"}
        />
        <StatCard
          label="7-day average"
          value={`${r0(s7.systolic)}/${r0(s7.diastolic)}`}
          unit="mmHg"
          hint="Mean of morning, afternoon, night"
        />
        <StatCard
          label="30-day average"
          value={`${r0(s30.systolic)}/${r0(s30.diastolic)}`}
          unit="mmHg"
          hint="Baseline for comparison"
        />
        <StatCard
          label="Medication adherence"
          value={`${r0(s30.adherence)}%`}
          hint="30-day average"
          tone={s30.adherence >= 90 ? "success" : "warning"}
        />
        <StatCard label="Average sleep" value={r1(s30.sleep)} unit="hrs" hint="30-day average" />
        <StatCard label="Average stress" value={`${r1(s30.stress)}/10`} hint="30-day average" />
        <StatCard
          label="Average activity"
          value={r0(s30.activity)}
          unit="min/day"
          hint="30-day average"
        />
        <StatCard
          label="Resting heart rate"
          value={r0(s30.restingHr)}
          unit="bpm"
          hint="30-day average"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="30-day systolic trend">
          <AreaChart data={series}>
            <defs>
              <linearGradient id="sysFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
            <YAxis domain={[90, 200]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area
              dataKey="systolic"
              stroke="var(--color-chart-1)"
              fill="url(#sysFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartCard>

        <ChartCard title="30-day diastolic trend">
          <AreaChart data={series}>
            <defs>
              <linearGradient id="diaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
            <YAxis domain={[50, 130]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area
              dataKey="diastolic"
              stroke="var(--color-chart-2)"
              fill="url(#diaFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartCard>

        <ChartCard title="Morning vs afternoon vs night systolic">
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
            <YAxis domain={[90, 200]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line dataKey="morning" stroke="var(--color-chart-1)" dot={false} strokeWidth={2} />
            <Line dataKey="afternoon" stroke="var(--color-chart-3)" dot={false} strokeWidth={2} />
            <Line dataKey="night" stroke="var(--color-chart-4)" dot={false} strokeWidth={2} />
          </LineChart>
        </ChartCard>

        <ChartCard title="Medication adherence by day (%)">
          <BarChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="adherence" fill="var(--color-chart-2)" radius={3} />
          </BarChart>
        </ChartCard>
      </div>
    </AppShell>
  );
}

export function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="card-surface p-4">
      <p className="font-display mb-3 text-sm font-semibold">{title}</p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

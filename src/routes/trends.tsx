import { createFileRoute } from "@tanstack/react-router";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { AppShell, EmptyState } from "@/components/AppShell";
import { chartSeries } from "@/lib/derive";
import { useRecords } from "@/lib/store";

export const Route = createFileRoute("/trends")({
  head: () => ({
    meta: [
      { title: "Trends & Charts — BPredict AI" },
      {
        name: "description",
        content:
          "Charts comparing blood pressure with stress, sleep, activity, salt intake, medication adherence, weight and resting heart rate.",
      },
      { property: "og:title", content: "Trends & Charts — BPredict AI" },
      {
        property: "og:description",
        content: "Visual comparison of blood pressure against daily lifestyle variables.",
      },
    ],
  }),
  component: TrendsPage,
});

function TrendsPage() {
  const { records, hydrated, loadDemo } = useRecords();
  if (!hydrated) return <AppShell title="Trends & Charts">Loading…</AppShell>;
  if (records.length === 0)
    return (
      <AppShell title="Trends & Charts">
        <EmptyState onLoadDemo={loadDemo} />
      </AppShell>
    );

  const data = chartSeries(records);

  return (
    <AppShell
      title="Trends & Charts"
      subtitle="Each scatter point is one day. Patterns shown here are associations, not proven causes."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Systolic & diastolic over 30 days"
          note="Shaded bands follow the AHA systolic categories: Normal (<120), Elevated (120–130), Stage 1 (130–140), Stage 2 (≥140 mmHg)."
        >
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            {/* AHA guideline zones (systolic). Educational reference only. */}
            <ReferenceArea y1={140} y2={200} fill="var(--color-destructive)" fillOpacity={0.07} label={{ value: "Stage 2", position: "insideTopRight", fontSize: 10 }} />
            <ReferenceArea y1={130} y2={140} fill="var(--color-chart-3)" fillOpacity={0.14} label={{ value: "Stage 1", position: "insideTopRight", fontSize: 10 }} />
            <ReferenceArea y1={120} y2={130} fill="var(--color-warning)" fillOpacity={0.14} label={{ value: "Elevated", position: "insideTopRight", fontSize: 10 }} />
            <ReferenceArea y1={50} y2={120} fill="var(--color-success)" fillOpacity={0.08} label={{ value: "Normal", position: "insideTopRight", fontSize: 10 }} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
            <YAxis tick={{ fontSize: 11 }} domain={[50, 200]} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line dataKey="systolic" stroke="var(--color-chart-1)" dot={false} strokeWidth={2} />
            <Line dataKey="diastolic" stroke="var(--color-chart-2)" dot={false} strokeWidth={2} />
          </LineChart>
        </Card>

        <Card title="Weight & resting heart rate">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line dataKey="weight" stroke="var(--color-chart-4)" dot={false} strokeWidth={2} />
            <Line dataKey="restingHr" stroke="var(--color-chart-5)" dot={false} strokeWidth={2} />
          </LineChart>
        </Card>

        <ScatterCard title="Stress level vs systolic BP" x="stress" xLabel="Stress (1-10)" />
        <ScatterCard title="Sleep hours vs systolic BP" x="sleep" xLabel="Sleep (hours)" />
        <ScatterCard title="Activity minutes vs systolic BP" x="activity" xLabel="Activity (min)" />
        <ScatterCard title="Salt intake vs systolic BP" x="salt" xLabel="Salt (g)" />
        <ScatterCard
          title="Medication adherence vs systolic BP"
          x="adherence"
          xLabel="Adherence (%)"
        />
        <ScatterCard title="Daily steps vs systolic BP" x="steps" xLabel="Steps" />
      </div>
    </AppShell>
  );

  function ScatterCard({ title, x, xLabel }: { title: string; x: string; xLabel: string }) {
    return (
      <Card title={title}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey={x}
            type="number"
            name={xLabel}
            tick={{ fontSize: 11 }}
            label={{ value: xLabel, position: "insideBottom", offset: -4, fontSize: 11 }}
          />
          <YAxis
            dataKey="systolic"
            type="number"
            domain={[90, 200]}
            tick={{ fontSize: 11 }}
            name="Systolic"
          />
          <ZAxis range={[60, 60]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter data={data} fill="var(--color-chart-1)" fillOpacity={0.7} />
        </ScatterChart>
      </Card>
    );
  }
}

function Card({ title, note, children }: { title: string; note?: string; children: React.ReactElement }) {
  return (
    <div className="card-surface p-4">
      <p className="font-display mb-3 text-sm font-semibold">{title}</p>
      {note && <p className="mb-2 -mt-1 text-xs text-muted-foreground">{note}</p>}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

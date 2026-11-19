import { createFileRoute } from "@tanstack/react-router";
import { AppShell, EmptyState, StatCard } from "@/components/AppShell";
import { r0, windowStats } from "@/lib/derive";
import { useRecords } from "@/lib/store";
import { dayDiastolic, daySystolic } from "@/lib/types";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "30-Day BP History — BPredict AI" },
      {
        name: "description",
        content:
          "Full table of the last 30 days of morning, afternoon and night blood pressure readings with lifestyle details.",
      },
      { property: "og:title", content: "30-Day BP History — BPredict AI" },
      {
        property: "og:description",
        content: "Day-by-day blood pressure and lifestyle records for the last 30 days.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { records, hydrated, loadDemo, remove } = useRecords();

  if (!hydrated) return <AppShell title="30-Day BP History">Loading…</AppShell>;
  if (records.length === 0)
    return (
      <AppShell title="30-Day BP History">
        <EmptyState onLoadDemo={loadDemo} />
      </AppShell>
    );

  const rows = records.slice(-30).slice().reverse();
  const s = windowStats(records, 30);
  const sys = records.slice(-30).map(daySystolic);
  const dia = records.slice(-30).map(dayDiastolic);

  return (
    <AppShell
      title="30-Day BP History"
      subtitle="Three readings per day: morning, afternoon and night."
    >
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Days recorded" value={records.length} />
        <StatCard
          label="30-day average"
          value={`${r0(s.systolic)}/${r0(s.diastolic)}`}
          unit="mmHg"
        />
        <StatCard
          label="Highest daily mean"
          value={`${r0(Math.max(...sys))}/${r0(Math.max(...dia))}`}
          unit="mmHg"
          tone="warning"
        />
        <StatCard
          label="Lowest daily mean"
          value={`${r0(Math.min(...sys))}/${r0(Math.min(...dia))}`}
          unit="mmHg"
        />
      </div>

      <div className="card-surface overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
              <Th>Date</Th>
              <Th>Morning</Th>
              <Th>Afternoon</Th>
              <Th>Night</Th>
              <Th>Daily mean</Th>
              <Th>Salt (g)</Th>
              <Th>Activity</Th>
              <Th>Stress</Th>
              <Th>Sleep</Th>
              <Th>Adherence</Th>
              <Th>Steps</Th>
              <Th>HR</Th>
              <Th>Mood</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.date} className="border-b border-border/60 last:border-0">
                <Td className="font-medium whitespace-nowrap">{r.date}</Td>
                <Td>
                  {r.morning_systolic}/{r.morning_diastolic}
                </Td>
                <Td>
                  {r.afternoon_systolic}/{r.afternoon_diastolic}
                </Td>
                <Td>
                  {r.night_systolic}/{r.night_diastolic}
                </Td>
                <Td className="font-semibold text-primary">
                  {r0(daySystolic(r))}/{r0(dayDiastolic(r))}
                </Td>
                <Td>{r.salt_intake}</Td>
                <Td>{r.physical_activity_minutes} min</Td>
                <Td>{r.stress_level}/10</Td>
                <Td>{r.sleep_hours} h</Td>
                <Td>{r.medication_adherence}%</Td>
                <Td>{r.steps.toLocaleString()}</Td>
                <Td>{r.resting_heart_rate}</Td>
                <Td className="capitalize">{r.mood}</Td>
                <Td>
                  <button
                    onClick={() => remove(r.date)}
                    className="text-xs text-muted-foreground underline hover:text-destructive"
                  >
                    delete
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

const Th = ({ children }: { children?: React.ReactNode }) => (
  <th className="px-3 py-3 font-medium">{children}</th>
);
const Td = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <td className={`px-3 py-2.5 ${className ?? ""}`}>{children}</td>
);

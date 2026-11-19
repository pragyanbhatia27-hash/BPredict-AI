import { Link } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  BrainCircuit,
  CalendarPlus,
  HeartPulse,
  LayoutDashboard,
  LineChart,
  Info,
  Menu,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/entry", label: "Daily Entry", icon: CalendarPlus },
  { to: "/history", label: "30-Day History", icon: Activity },
  { to: "/lifestyle", label: "Lifestyle Analysis", icon: BarChart3 },
  { to: "/prediction", label: "AI Prediction", icon: BrainCircuit },
  { to: "/trends", label: "Trends & Charts", icon: LineChart },
  { to: "/model", label: "Model Information", icon: Info },
] as const;

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <div className="hero-gradient flex size-9 items-center justify-center rounded-xl">
            <HeartPulse className="size-5 text-primary-foreground" />
          </div>
          <div className="mr-auto">
            <p className="font-display text-base leading-tight font-semibold">BPredict AI</p>
            <p className="text-xs text-muted-foreground">Blood pressure range forecasting</p>
          </div>
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-accent text-accent-foreground" }}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="rounded-lg border border-border p-2 lg:hidden"
          >
            <Menu className="size-4" />
          </button>
        </div>
        {open && (
          <nav className="grid gap-1 border-t border-border px-4 py-3 lg:hidden">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground"
                activeProps={{ className: "bg-accent text-accent-foreground" }}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
        <Disclaimer className="mt-10" />
        <p className="mt-6 pb-4 text-center text-xs text-muted-foreground">
          BPredict AI — educational / research project. Synthetic data only.
        </p>
      </main>
    </div>
  );
}

export function Disclaimer({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-foreground",
        className,
      )}
    >
      <p className="font-display mb-1 font-semibold">Important safety notice</p>
      <p className="text-muted-foreground">
        Educational and research demonstration only. Not a medical diagnostic device. Do not alter
        medications, treatments, or clinical regimens without direct consultation with a qualified
        medical professional. If a blood pressure reading is concerning or accompanied by serious
        symptoms, seek appropriate medical care.
      </p>
    </aside>
  );
}

export function StatCard({
  label,
  value,
  unit,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  tone?: "default" | "primary" | "warning" | "success";
}) {
  const toneClass = {
    default: "text-foreground",
    primary: "text-primary",
    warning: "text-warning",
    success: "text-success",
  }[tone];

  return (
    <div className="card-surface p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className={cn("font-display mt-2 text-2xl font-semibold", toneClass)}>
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function EmptyState({ onLoadDemo }: { onLoadDemo: () => void }) {
  return (
    <div className="card-surface p-8 text-center">
      <BrainCircuit className="mx-auto size-10 text-primary" />
      <h2 className="font-display mt-4 text-xl font-semibold">No records yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        BPredict AI needs 30 days of blood pressure and lifestyle records before it can forecast the
        next 24 hours. Turn on Demo Mode to generate a realistic synthetic 30-day history, or add
        days manually.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button
          onClick={onLoadDemo}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Load Demo Mode data
        </button>
        <Link
          to="/entry"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
        >
          Add a day manually
        </Link>
      </div>
    </div>
  );
}

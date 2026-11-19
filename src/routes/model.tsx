import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BrainCircuit, Database, ListTree, User } from "lucide-react";
import { AppShell, StatCard } from "@/components/AppShell";
import { useTrainedModels } from "@/lib/usePrediction";
import { DIASTOLIC_BINS, SYSTOLIC_BINS, classLabel } from "@/lib/types";

export const Route = createFileRoute("/model")({
  head: () => ({
    meta: [
      { title: "Model Information — BPredict AI" },
      {
        name: "description",
        content:
          "How the BPredict AI Random Forest models were trained: pipeline, hyperparameters and held-out test metrics with accuracy, precision, recall, F1 and confusion matrices.",
      },
      { property: "og:title", content: "Model Information — BPredict AI" },
      {
        property: "og:description",
        content: "Training pipeline, hyperparameters and held-out test metrics for both models.",
      },
    ],
  }),
  component: ModelPage,
});

/**
 * Model Information page.
 *
 * Explains the full pipeline:
 *   TRAINING DATA -> MODEL TRAINING -> NEW USER'S 30-DAY HISTORY -> PREDICTION
 * and shows the held-out (20%) test metrics: accuracy, macro precision /
 * recall / F1 and the confusion matrix for each of the two classifiers.
 */
function ModelPage() {
  const models = useTrainedModels();

  return (
    <AppShell
      title="Model Information"
      subtitle="How the two Random Forest classifiers were built and how well they perform on data they never trained on."
    >
      {/* Pipeline */}
      <section className="card-surface p-5">
        <p className="font-display text-sm font-semibold">The pipeline</p>
        <div className="mt-4 grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
          <PipelineStep
            icon={Database}
            title="Training data"
            detail="A synthetic multi-patient cohort: 260 simulated patients × 40 days of BP + lifestyle records."
          />
          <Arrow />
          <PipelineStep
            icon={BrainCircuit}
            title="Model training"
            detail="Two Random Forests (systolic & diastolic) learn from sliding 30-day windows; the label is the next day's BP class."
          />
          <Arrow />
          <PipelineStep
            icon={User}
            title="Your 30-day history"
            detail="The same feature engineering (33 inputs) is applied to the records stored on this device."
          />
          <Arrow />
          <PipelineStep
            icon={ListTree}
            title="Prediction"
            detail="25 trees vote per model; the averaged vote gives the range and its confidence."
          />
        </div>
      </section>

      {!models ? (
        <div className="card-surface mt-6 p-8 text-center">
          <BrainCircuit className="mx-auto size-10 text-primary" />
          <p className="font-display mt-4 text-lg font-semibold">Training the models…</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Both Random Forests are trained inside your browser from the synthetic cohort. This
            takes a few seconds the first time.
          </p>
        </div>
      ) : (
        <>
          {/* Dataset summary */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Simulated patients" value={models.nPatients} hint="Synthetic cohort" />
            <StatCard
              label="Training samples"
              value={models.nTrain.toLocaleString()}
              hint="30-day windows (80%)"
            />
            <StatCard
              label="Held-out test samples"
              value={(models.nSamples - models.nTrain).toLocaleString()}
              hint="Never seen during training (20%)"
            />
            <StatCard label="Input features" value={models.nFeatures} hint="Per prediction" />
          </div>

          {/* Metrics */}
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <MetricsCard
              title="Systolic model — held-out test metrics"
              subtitle={`Predicts which 10 mmHg class (${classLabel(0, SYSTOLIC_BINS)} … ${classLabel(
                SYSTOLIC_BINS.length - 2,
                SYSTOLIC_BINS,
              )}) tomorrow's mean systolic falls in.`}
              metrics={models.systolicMetrics}
            />
            <MetricsCard
              title="Diastolic model — held-out test metrics"
              subtitle={`Predicts which 10 mmHg class (${classLabel(0, DIASTOLIC_BINS)} … ${classLabel(
                DIASTOLIC_BINS.length - 2,
                DIASTOLIC_BINS,
              )}) tomorrow's mean diastolic falls in.`}
              metrics={models.diastolicMetrics}
            />
          </div>

          {/* Confusion matrices */}
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <ConfusionCard title="Systolic — confusion matrix" metrics={models.systolicMetrics} bins={SYSTOLIC_BINS} />
            <ConfusionCard title="Diastolic — confusion matrix" metrics={models.diastolicMetrics} bins={DIASTOLIC_BINS} />
          </div>
        </>
      )}

      {/* Hyperparameters */}
      <section className="card-surface mt-6 p-5">
        <p className="font-display text-sm font-semibold">Model settings</p>
        <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <li>
            <b className="text-foreground">25 decision trees</b> per model — many weak learners
            vote, which reduces overfitting.
          </li>
          <li>
            <b className="text-foreground">Gini impurity</b> — how each split in a tree is chosen:
            the split that best separates the classes wins.
          </li>
          <li>
            <b className="text-foreground">Bagging (bootstrap)</b> — each tree sees a random
            sample (with replacement) of the training windows.
          </li>
          <li>
            <b className="text-foreground">√33 ≈ 6 random features</b> considered per split — the
            classic Random Forest trick for variety between trees.
          </li>
          <li>
            <b className="text-foreground">Max depth 9, min 6 samples per leaf</b> — keeps trees
            readable and prevents memorising the training data.
          </li>
          <li>
            <b className="text-foreground">80 / 20 split</b> — 80% of windows train the forest, the
            remaining 20% measure the metrics shown above.
          </li>
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Everything is deterministic (fixed random seeds), so re-training produces exactly the
          same models. Training data is synthetic — no real patient data is used anywhere in this
          project.
        </p>
      </section>
    </AppShell>
  );
}

/* -------- pieces -------- */

function PipelineStep({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Database;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <Icon className="size-5 text-primary" />
      <p className="mt-2 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function Arrow() {
  return (
    <div className="hidden items-center justify-center md:flex">
      <ArrowRight className="size-4 text-muted-foreground" />
    </div>
  );
}

function MetricsCard({
  title,
  subtitle,
  metrics,
}: {
  title: string;
  subtitle: string;
  metrics: {
    accuracy: number;
    macroPrecision: number;
    macroRecall: number;
    macroF1: number;
    nTest: number;
  };
}) {
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
  return (
    <div className="card-surface p-5">
      <p className="font-display text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Accuracy" value={pct(metrics.accuracy)} />
        <Metric label="Precision" value={pct(metrics.macroPrecision)} />
        <Metric label="Recall" value={pct(metrics.macroRecall)} />
        <Metric label="F1-score" value={pct(metrics.macroF1)} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Macro-averaged across all classes, measured on {metrics.nTest.toLocaleString()} held-out
        test samples the models never trained on.
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3 text-center">
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="font-display mt-1 text-lg font-semibold text-primary">{value}</p>
    </div>
  );
}

function ConfusionCard({
  title,
  metrics,
  bins,
}: {
  title: string;
  metrics: { confusion: number[][]; support: number[] };
  bins: number[];
}) {
  const n = bins.length - 1;
  return (
    <div className="card-surface p-5">
      <p className="font-display text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Rows = the true (actual) class. Columns = the class the model predicted. The diagonal is
        what the model got right.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-xs">
          <thead>
            <tr>
              <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                Actual \ Predicted
              </th>
              {Array.from({ length: n }, (_, i) => (
                <th key={i} className="px-2 py-2 text-center font-medium text-muted-foreground">
                  {classLabel(i, bins)}
                </th>
              ))}
              <th className="px-2 py-2 text-center font-medium text-muted-foreground">Support</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: n }, (_, i) => (
              <tr key={i} className="border-t border-border/60">
                <td className="px-2 py-2 font-medium whitespace-nowrap">{classLabel(i, bins)}</td>
                {Array.from({ length: n }, (_, j) => {
                  const v = metrics.confusion[i]?.[j] ?? 0;
                  const isDiagonal = i === j;
                  return (
                    <td
                      key={j}
                      className={`px-2 py-2 text-center tabular-nums ${
                        isDiagonal
                          ? "bg-success/15 font-semibold text-success"
                          : v > 0
                            ? "text-foreground"
                            : "text-muted-foreground/50"
                      }`}
                    >
                      {v}
                    </td>
                  );
                })}
                <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">
                  {metrics.support[i]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

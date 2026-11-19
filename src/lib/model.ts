/**
 * TRAINING DATA -> MODEL TRAINING -> NEW USER'S 30-DAY HISTORY -> NEXT 24H PREDICTION
 *
 * Two separate Random Forest classifiers:
 *   1. Systolic range classifier  (10 mmHg classes, 100-190)
 *   2. Diastolic range classifier (10 mmHg classes, 50-120)
 *
 * Training samples come from a synthetic multi-patient cohort: for each patient
 * and each day t (>= 30), features are built from days t-30..t-1 and the label
 * is the BP class of day t. The models never see a single user's data only.
 */

import { buildFeatures, explainPrediction, FEATURE_NAMES } from "./features";
import { evaluate, Metrics, RandomForestClassifier, Row } from "./randomForest";
import { generateTrainingCohort } from "./synthetic";
import {
  classLabel,
  DailyRecord,
  dayDiastolic,
  daySystolic,
  DIASTOLIC_BINS,
  SYSTOLIC_BINS,
  toClass,
} from "./types";

export interface TrainedModels {
  systolic: RandomForestClassifier;
  diastolic: RandomForestClassifier;
  systolicMetrics: Metrics;
  diastolicMetrics: Metrics;
  nPatients: number;
  nSamples: number;
  nTrain: number;
  nFeatures: number;
}

let cache: TrainedModels | null = null;

export function trainModels(): TrainedModels {
  if (cache) return cache;

  const cohort = generateTrainingCohort();
  const X: Row[] = [];
  const ySys: number[] = [];
  const yDia: number[] = [];

  for (const patient of cohort) {
    for (let t = 30; t < patient.length; t++) {
      const history = patient.slice(t - 30, t);
      const target = patient[t];
      if (!target) continue;
      X.push(buildFeatures(history).values);
      ySys.push(toClass(daySystolic(target), SYSTOLIC_BINS));
      yDia.push(toClass(dayDiastolic(target), DIASTOLIC_BINS));
    }
  }

  // Train / test split (80 / 20, held out for evaluation)
  const split = Math.floor(X.length * 0.8);
  const Xtr = X.slice(0, split);
  const Xte = X.slice(split);

  const systolic = new RandomForestClassifier({ nTrees: 25, maxDepth: 9, seed: 7 }).fit(
    Xtr,
    ySys.slice(0, split),
    SYSTOLIC_BINS.length - 1,
  );
  const diastolic = new RandomForestClassifier({ nTrees: 25, maxDepth: 9, seed: 13 }).fit(
    Xtr,
    yDia.slice(0, split),
    DIASTOLIC_BINS.length - 1,
  );

  cache = {
    systolic,
    diastolic,
    systolicMetrics: evaluate(systolic, Xte, ySys.slice(split), SYSTOLIC_BINS.length - 1),
    diastolicMetrics: evaluate(diastolic, Xte, yDia.slice(split), DIASTOLIC_BINS.length - 1),
    nPatients: cohort.length,
    nSamples: X.length,
    nTrain: Xtr.length,
    nFeatures: FEATURE_NAMES.length,
  };
  return cache;
}

export interface Prediction {
  systolicRange: string;
  diastolicRange: string;
  systolicConfidence: number;
  diastolicConfidence: number;
  systolicDistribution: { label: string; probability: number }[];
  diastolicDistribution: { label: string; probability: number }[];
  factors: ReturnType<typeof explainPrediction>["factors"];
  summary: string;
  features: Record<string, number>;
}

/** Runs a NEW user's 30-day history through the trained models. */
export function predictNext24h(history: DailyRecord[]): Prediction {
  const models = trainModels();
  const { values, named } = buildFeatures(history);

  const sysProbs = models.systolic.predictProba(values);
  const diaProbs = models.diastolic.predictProba(values);
  const sysIdx = sysProbs.indexOf(Math.max(...sysProbs));
  const diaIdx = diaProbs.indexOf(Math.max(...diaProbs));
  const { factors, summary } = explainPrediction(named);

  return {
    systolicRange: classLabel(sysIdx, SYSTOLIC_BINS),
    diastolicRange: classLabel(diaIdx, DIASTOLIC_BINS),
    systolicConfidence: sysProbs[sysIdx] ?? 0,
    diastolicConfidence: diaProbs[diaIdx] ?? 0,
    systolicDistribution: sysProbs.map((p, i) => ({
      label: classLabel(i, SYSTOLIC_BINS),
      probability: p,
    })),
    diastolicDistribution: diaProbs.map((p, i) => ({
      label: classLabel(i, DIASTOLIC_BINS),
      probability: p,
    })),
    factors,
    summary,
    features: named,
  };
}

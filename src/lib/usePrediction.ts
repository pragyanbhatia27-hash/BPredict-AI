import { useEffect, useState } from "react";
import { predictNext24h, trainModels, type Prediction, type TrainedModels } from "./model";
import type { DailyRecord } from "./types";

/**
 * Trains (once) and predicts in the browser after mount, so the heavy work
 * never blocks server rendering.
 */
export function usePrediction(records: DailyRecord[], enabled: boolean) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [status, setStatus] = useState<"idle" | "working" | "ready">("idle");

  useEffect(() => {
    if (!enabled || records.length < 30) {
      setPrediction(null);
      setStatus("idle");
      return;
    }
    setStatus("working");
    const id = window.setTimeout(() => {
      setPrediction(predictNext24h(records));
      setStatus("ready");
    }, 30);
    return () => window.clearTimeout(id);
  }, [records, enabled]);

  return { prediction, status };
}

export function useTrainedModels(enabled = true) {
  const [models, setModels] = useState<TrainedModels | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const id = window.setTimeout(() => setModels(trainModels()), 30);
    return () => window.clearTimeout(id);
  }, [enabled]);

  return models;
}

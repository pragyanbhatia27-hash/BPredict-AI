/**
 * Local record store (browser localStorage). Keeps the user's daily records and
 * the Demo Mode flag. No data leaves the device.
 */

import { useCallback, useEffect, useState } from "react";
import { generateUserHistory } from "./synthetic";
import { DailyRecord } from "./types";

const KEY = "bpredict.records.v1";
const DEMO_KEY = "bpredict.demo.v1";

function read(): DailyRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DailyRecord[]) : [];
  } catch {
    return [];
  }
}

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function useRecords() {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [demo, setDemo] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setRecords(read().sort((a, b) => a.date.localeCompare(b.date)));
    setDemo(window.localStorage.getItem(DEMO_KEY) === "1");
  }, []);

  useEffect(() => {
    refresh();
    setHydrated(true);
    listeners.add(refresh);
    return () => {
      listeners.delete(refresh);
    };
  }, [refresh]);

  const save = (next: DailyRecord[], isDemo?: boolean) => {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    if (isDemo !== undefined) window.localStorage.setItem(DEMO_KEY, isDemo ? "1" : "0");
    notify();
  };

  return {
    records,
    demo,
    hydrated,
    /** Load a synthetic 30-day history (Demo Mode). */
    loadDemo: () => save(generateUserHistory(), true),
    clearAll: () => save([], false),
    upsert: (record: DailyRecord) => {
      const next = read().filter((r) => r.date !== record.date);
      next.push(record);
      save(
        next.sort((a, b) => a.date.localeCompare(b.date)),
        false,
      );
    },
    remove: (date: string) => save(read().filter((r) => r.date !== date)),
  };
}

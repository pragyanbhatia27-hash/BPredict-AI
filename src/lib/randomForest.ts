/**
 * A small, readable Random Forest classifier (CART trees + bagging).
 * Written in TypeScript so it runs directly in the browser, but the logic is
 * the same idea as scikit-learn's RandomForestClassifier:
 *   - many decision trees, each trained on a bootstrap sample
 *   - each split considers a random subset of features
 *   - final prediction = average of the per-tree class probabilities
 */

export type Row = number[];

/** Deterministic pseudo random number generator (so results are reproducible). */
export function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

interface Leaf {
  leaf: true;
  probs: number[];
}
interface Node {
  leaf: false;
  feature: number;
  threshold: number;
  left: Tree;
  right: Tree;
}
type Tree = Leaf | Node;

function classProbs(y: number[], idx: number[], nClasses: number): number[] {
  const counts = new Array<number>(nClasses).fill(0);
  for (const i of idx) {
    const cls = y[i];
    if (cls !== undefined) counts[cls] = (counts[cls] ?? 0) + 1;
  }
  return counts.map((c) => c / idx.length);
}

function gini(probs: number[]): number {
  return 1 - probs.reduce((a, p) => a + p * p, 0);
}

function buildTree(
  X: Row[],
  y: number[],
  idx: number[],
  nClasses: number,
  depth: number,
  maxDepth: number,
  minSamples: number,
  featuresPerSplit: number,
  rng: () => number,
): Tree {
  const probs = classProbs(y, idx, nClasses);
  if (depth >= maxDepth || idx.length < minSamples || gini(probs) === 0) {
    return { leaf: true, probs };
  }

  const first = X[0];
  if (!first) return { leaf: true, probs };
  const nFeatures = first.length;
  let best: { f: number; t: number; l: number[]; r: number[]; score: number } | null = null;

  // Try a random subset of features (classic RF behaviour).
  for (let k = 0; k < featuresPerSplit; k++) {
    const f = Math.floor(rng() * nFeatures);
    // Candidate thresholds: a few random sample values for this feature.
    for (let c = 0; c < 8; c++) {
      const sample = idx[Math.floor(rng() * idx.length)];
      const sampleRow = sample !== undefined ? X[sample] : undefined;
      if (!sampleRow) continue;
      const t = sampleRow[f] ?? 0;
      const l: number[] = [];
      const r: number[] = [];
      for (const i of idx) {
        const row = X[i];
        if (!row) continue;
        ((row[f] ?? 0) <= t ? l : r).push(i);
      }
      if (l.length === 0 || r.length === 0) continue;
      const score =
        (l.length / idx.length) * gini(classProbs(y, l, nClasses)) +
        (r.length / idx.length) * gini(classProbs(y, r, nClasses));
      if (!best || score < best.score) best = { f, t, l, r, score };
    }
  }

  if (!best) return { leaf: true, probs };

  return {
    leaf: false,
    feature: best.f,
    threshold: best.t,
    left: buildTree(X, y, best.l, nClasses, depth + 1, maxDepth, minSamples, featuresPerSplit, rng),
    right: buildTree(
      X,
      y,
      best.r,
      nClasses,
      depth + 1,
      maxDepth,
      minSamples,
      featuresPerSplit,
      rng,
    ),
  };
}

function treeProbs(tree: Tree, row: Row): number[] {
  let node = tree;
  while (!node.leaf) {
    const value = row[node.feature] ?? 0;
    node = value <= node.threshold ? node.left : node.right;
  }
  return node.probs;
}

export interface ForestOptions {
  nTrees?: number;
  maxDepth?: number;
  minSamples?: number;
  seed?: number;
}

export class RandomForestClassifier {
  private trees: Tree[] = [];
  private nClasses = 0;
  private opts: Required<ForestOptions>;

  constructor(options: ForestOptions = {}) {
    this.opts = {
      nTrees: options.nTrees ?? 25,
      maxDepth: options.maxDepth ?? 8,
      minSamples: options.minSamples ?? 6,
      seed: options.seed ?? 42,
    };
  }

  fit(X: Row[], y: number[], nClasses: number) {
    this.nClasses = nClasses;
    const rng = makeRng(this.opts.seed);
    const first = X[0];
    const featuresPerSplit = Math.max(2, Math.round(Math.sqrt(first ? first.length : 0)));
    this.trees = [];
    for (let t = 0; t < this.opts.nTrees; t++) {
      // Bootstrap sample (sample with replacement).
      const idx: number[] = [];
      for (let i = 0; i < X.length; i++) idx.push(Math.floor(rng() * X.length));
      this.trees.push(
        buildTree(
          X,
          y,
          idx,
          nClasses,
          0,
          this.opts.maxDepth,
          this.opts.minSamples,
          featuresPerSplit,
          rng,
        ),
      );
    }
    return this;
  }

  predictProba(row: Row): number[] {
    const acc = new Array<number>(this.nClasses).fill(0);
    for (const tree of this.trees) {
      const p = treeProbs(tree, row);
      for (let c = 0; c < this.nClasses; c++) acc[c] += p[c] ?? 0;
    }
    return acc.map((v) => v / this.trees.length);
  }

  predict(row: Row): number {
    const p = this.predictProba(row);
    return p.indexOf(Math.max(...p));
  }
}

/* ------------------------- evaluation metrics ------------------------- */

export interface Metrics {
  accuracy: number;
  macroPrecision: number;
  macroRecall: number;
  macroF1: number;
  confusion: number[][];
  support: number[];
  nTest: number;
}

export function evaluate(
  model: RandomForestClassifier,
  X: Row[],
  y: number[],
  nClasses: number,
): Metrics {
  const confusion: number[][] = Array.from({ length: nClasses }, () =>
    new Array<number>(nClasses).fill(0),
  );
  let correct = 0;
  X.forEach((row, i) => {
    const actual = y[i];
    const p = model.predict(row);
    if (actual === undefined) return;
    const rowC = confusion[actual];
    if (!rowC) return;
    rowC[p] = (rowC[p] ?? 0) + 1;
    if (p === actual) correct++;
  });

  const precisions: number[] = [];
  const recalls: number[] = [];
  const f1s: number[] = [];
  const support: number[] = [];

  for (let c = 0; c < nClasses; c++) {
    const rowC = confusion[c];
    if (!rowC) continue;
    const tp = rowC[c] ?? 0;
    const predicted = confusion.reduce((a, r) => a + (r[c] ?? 0), 0);
    const actual = rowC.reduce((a, v) => a + v, 0);
    support.push(actual);
    if (actual === 0) continue; // ignore classes absent from the test set
    const precision = predicted ? tp / predicted : 0;
    const recall = actual ? tp / actual : 0;
    precisions.push(precision);
    recalls.push(recall);
    f1s.push(precision + recall ? (2 * precision * recall) / (precision + recall) : 0);
  }

  const mean = (a: number[]) => (a.length ? a.reduce((x, v) => x + v, 0) / a.length : 0);

  return {
    accuracy: X.length ? correct / X.length : 0,
    macroPrecision: mean(precisions),
    macroRecall: mean(recalls),
    macroF1: mean(f1s),
    confusion,
    support,
    nTest: X.length,
  };
}

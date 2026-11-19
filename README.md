# Pressure Forecast Compass (BPredict AI)

An educational machine-learning web app that analyses 30 days of blood pressure
readings and daily lifestyle data (salt intake, physical activity, exertion level)
and estimates the expected blood pressure **range** for the next 24 hours.

> **Disclaimer:** This is an educational/research project. Predictions are not
> medical diagnoses and must never be used to change or stop prescribed medication.

**Live app:** https://pressure-forecast-compass.vercel.app

## How it works

TRAINING DATA → MODEL TRAINING → NEW USER'S 30-DAY HISTORY → NEXT 24-HOUR PREDICTION

- Blood pressure is recorded three times a day (morning, afternoon, night).
- A Random Forest model is trained on synthetic data and evaluated on a held-out
  test set (accuracy, precision, recall, F1-score, confusion matrix).
- A user's 30-day history is passed to the trained model to produce the forecast.

## Tech stack

TanStack Start, React 19, TypeScript, Tailwind CSS 4, Radix UI, Recharts, Vite.

## Development

```sh
git clone https://github.com/pragyanbhatia27-hash/pressure-forecast-compass.git
cd pressure-forecast-compass
bun install   # or: npm install
bun run dev   # or: npm run dev
```

Build for production with `bun run build` (or `npm run build`).

# BPredict AI

**AI-Based Blood Pressure Forecasting and Lifestyle Monitoring Web Application**

BPredict AI is an educational machine-learning web application that analyses a user's blood pressure history and daily lifestyle information, then estimates an expected blood pressure range for the next 24 hours.

> **Important disclaimer:** This is an educational/research project, not a medical device. Predictions are not medical diagnoses or treatment advice. Never start, stop, or change prescribed medication based on an app prediction.

## Project overview

- Records blood pressure readings three times a day (morning, afternoon, and night).
- Uses a 30-day history of blood pressure and lifestyle information.
- Considers lifestyle factors such as salt intake, physical activity, and exertion level.
- Uses a Random Forest model trained on synthetic data and evaluates it on a held-out test set.
- Presents an estimated blood pressure range for the next 24 hours.

## Technology stack

- React 19
- TypeScript
- TanStack Start
- Tailwind CSS 4
- Radix UI
- Recharts
- Vite

## Getting started

### Prerequisites

Install Node.js (LTS) and npm, or install Bun.

### Installation

```bash
git clone https://github.com/pragyanbhatia27-hash/BPredict-AI.git
cd BPredict-AI
npm install
npm run dev
```

To create a production build:

```bash
npm run build
```

## Project status

This repository is the source-code home for the BPredict AI college project. The application is intended for learning and demonstration.

## Live demo

https://pressure-forecast-compass.vercel.app

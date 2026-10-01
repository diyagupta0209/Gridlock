# GRIDLOCK

Patrol desk for illegal-parking enforcement in Bengaluru. A LightGBM model forecasts how many violations each ~1.2 km cell will see tomorrow. The app ranks those cells by traffic impact and turns the top of the list into a deployment plan.

## What the model does

LightGBM is gradient boosting on decision trees. It predicts `log(1 + next-day violations)` from each cell’s recent history, rolling level, volatility, and weekday rhythm. A hotspot is a cell in that day’s busiest 5%. The desk stores that forecast and recomputes:

**priority = hotspot probability × road criticality**

Road criticality mixes historical volume with the share of heavy vehicles. Cells with fewer than 50 records are scaled down.

The training notebook is `ml/gridlock_pipeline.ipynb`. Reported holdout quality is about **0.945 ROC-AUC** across three rolling time folds, and **Precision@20 ≈ 0.61**.

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

- **Desk** — map, patrol queue, slot count, freight weight, and a freight-only filter.
- **Model** — what the trees predict and how they were scored.
- **API** — `GET /api/patrol?capacity=12&freightWeight=0.4&sort=priority&freightOnly=0`

`sort` is `priority` or `probability`. `freightWeight` is between 0 and 1.

The forecast file is `data/dashboard_predictions.csv`. New challan data would be scored by retraining in the notebook and replacing that file.

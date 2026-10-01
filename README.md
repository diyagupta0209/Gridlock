# GRIDLOCK

Patrol desk for illegal-parking enforcement in Bengaluru.

LightGBM — gradient boosting on decision trees — forecasts how many violations each ~1.2 km cell will see tomorrow. This app stores that forecast in MongoDB and ranks a deployment list in Express.

**Priority = hotspot probability × road criticality**

Road criticality mixes historical volume with the share of heavy vehicles. Reported holdout quality is about **0.945 ROC-AUC** across three rolling time folds, and **Precision@20 ≈ 0.61**. Training is in `ml/gridlock_pipeline.ipynb`. The booster file was not part of the upload, so MongoDB is seeded from the model’s saved forecast, `data/dashboard_predictions.csv`.

## Stack

- React (Vite) in `client`
- Node and Express in `server`
- MongoDB database `gridlock`
  - `cells` — one document per forecast cell
  - `deployments` — patrol lists an officer saves

## Run it

Start MongoDB, then the API and the web app.

```bash
# local mongod
mkdir -p /tmp/mongodata
mongod --dbpath /tmp/mongodata --bind_ip 127.0.0.1 --port 27017 --fork --logpath /tmp/mongod.log

# or, with Docker
docker compose up -d

npm install
npm run install:all
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

The React app proxies `/api` to Express on port `47821`.

| Route | What it does |
|---|---|
| `GET /api/health` | MongoDB cell and plan counts |
| `GET /api/model` | LightGBM model card |
| `GET /api/patrol` | Ranked cells. Query: `capacity`, `freightWeight`, `sort` (`priority` or `probability`), `freightOnly` |
| `POST /api/plans` | Save the current list |
| `GET /api/plans` | Saved deployments |
| `DELETE /api/plans/:id` | Remove one |

`MONGODB_URI` defaults to `mongodb://127.0.0.1:27017/gridlock`. The API loads the CSV into `cells` when that collection is empty.

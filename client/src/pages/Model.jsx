import { useEffect, useState } from "react"
import { fetchJson } from "../api.js"

const folds = [
  ["1", "0.930", "0.53", "0.56", "0.51", "0.60"],
  ["2", "0.941", "0.57", "0.60", "0.55", "0.61"],
  ["3", "0.942", "0.58", "0.60", "0.56", "0.60"],
]

export default function Model() {
  const [card, setCard] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchJson("/api/model").then(setCard).catch((reason) => setError(reason.message))
  }, [])

  return (
    <main className="page">
      <p className="kicker">The forecaster</p>
      <h1>Gradient-boosted trees, one day ahead</h1>
      <p>
        GRIDLOCK uses {card?.name || "LightGBM"}, {card?.algorithm || "gradient boosting on decision trees"}.
        Each new tree is fit to the error left by the trees before it. Their sum predicts{" "}
        <span className="mono">{card?.target || "log(1 + violations)"}</span>.
      </p>
      {error ? <p className="banner error">{error}</p> : null}
      <section className="facts-3">
        <article className="card"><small className="muted">ROC-AUC</small><b>0.945</b><span className="muted">3 rolling time folds</span></article>
        <article className="card"><small className="muted">Precision@20</small><b>0.61</b><span className="muted">about 12 of the top 20</span></article>
        <article className="card"><small className="muted">Training rows</small><b>298k</b><span className="muted">Jan–May challans</span></article>
      </section>
      <h2>What is stored in MongoDB</h2>
      <p>
        The booster file itself was not in the project upload. The database holds the model’s saved
        next-day forecast: predicted intensity and hotspot rank for every geohash cell. Express reads
        those documents and applies the impact formula when you change the patrol plan. Saved shifts
        go into a second collection.
      </p>
      <h2>Signals the trees see</h2>
      <ul>
        {(card?.features || []).map((feature) => <li key={feature}>{feature}</li>)}
      </ul>
      <p>{card?.validation}. The strongest signal is each cell’s average on that weekday.</p>
      <div className="card">
        <table>
          <thead>
            <tr><th>Fold</th><th>AUC</th><th>F1</th><th>Precision</th><th>Recall</th><th>P@20</th></tr>
          </thead>
          <tbody>
            {folds.map((row) => (
              <tr key={row[0]}>{row.map((value, index) => <td key={`${row[0]}-${index}`}>{value}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}

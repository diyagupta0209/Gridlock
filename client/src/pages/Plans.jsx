import { useEffect, useState } from "react"
import { fetchJson } from "../api.js"
import { formatHour } from "../format.js"

export default function Plans() {
  const [plans, setPlans] = useState(null)
  const [error, setError] = useState("")

  async function load() {
    try {
      setPlans(await fetchJson("/api/plans"))
      setError("")
    } catch (reason) {
      setError(reason.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function remove(id) {
    try {
      await fetchJson(`/api/plans/${id}`, { method: "DELETE" })
      setPlans((current) => current.filter((plan) => plan._id !== id))
    } catch (reason) {
      setError(reason.message)
    }
  }

  return (
    <main className="page">
      <p className="kicker">Saved in MongoDB</p>
      <h1>Deployment plans</h1>
      <p>Each save stores the ranked stops for that shift. The forecast cells stay in their own collection.</p>
      {error ? <p className="banner error">{error}</p> : null}
      {plans && plans.length === 0 ? <p>No deployments saved yet. Build a list on the desk and press Save.</p> : null}
      <div className="plan-list">
        {(plans || []).map((plan) => (
          <article className="card plan" key={plan._id}>
            <div>
              <h2>{plan.name}</h2>
              <p>
                {plan.stops.length} stops · {plan.sort === "probability" ? "ranked by hotspot" : "ranked by impact"} · freight weight {Math.round(plan.freightWeight * 100)}%
                {plan.freightOnly ? " · freight only" : ""} · covers {Math.round(plan.violationShare * 100)}% of past violations
              </p>
              <ol>
                {plan.stops.slice(0, 5).map((stop) => (
                  <li key={stop.gh6}>
                    {stop.shortName} · {Number(stop.totalViol || 0).toLocaleString()} past violations · priority {stop.priority.toFixed(0)} · peak {formatHour(stop.peakHour)}
                  </li>
                ))}
              </ol>
            </div>
            <button type="button" className="ghost" onClick={() => remove(plan._id)}>Delete</button>
          </article>
        ))}
      </div>
    </main>
  )
}

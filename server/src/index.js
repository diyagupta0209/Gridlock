import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { connectDb } from "./db.js"
import { Cell, Deployment } from "./models.js"
import { MODEL_CARD } from "./modelCard.js"
import { normalizeOptions, rankCells } from "./score.js"
import { seedIfEmpty } from "./seed.js"

const app = express()
app.use(cors())
app.use(express.json())

app.get("/api/health", async (_req, res) => {
  const cells = await Cell.estimatedDocumentCount()
  const plans = await Deployment.estimatedDocumentCount()
  res.json({ ok: true, database: "mongodb", cells, plans })
})

app.get("/api/model", (_req, res) => {
  res.json(MODEL_CARD)
})

app.get("/api/patrol", async (req, res) => {
  const cells = await Cell.find().lean()
  if (cells.length === 0) {
    res.status(503).json({ error: "MongoDB has no forecast cells yet." })
    return
  }
  const options = normalizeOptions({
    capacity: req.query.capacity,
    freightWeight: req.query.freightWeight,
    sort: req.query.sort,
    freightOnly: req.query.freightOnly,
  })
  const ranked = rankCells(cells, options)
  ranked.source = {
    database: mongoose.connection.name,
    collection: Cell.collection.collectionName,
    count: cells.length,
  }
  res.json(ranked)
})

app.get("/api/plans", async (_req, res) => {
  const plans = await Deployment.find().sort({ createdAt: -1 }).limit(40).lean()
  res.json(plans)
})

app.post("/api/plans", async (req, res) => {
  const name = String(req.body?.name || "").trim()
  if (!name) {
    res.status(400).json({ error: "Give this deployment a name." })
    return
  }
  const cells = await Cell.find().lean()
  const options = normalizeOptions(req.body || {})
  const ranked = rankCells(cells, options)
  const plan = await Deployment.create({
    name,
    capacity: options.capacity,
    freightWeight: options.freightWeight,
    sort: options.sort,
    freightOnly: options.freightOnly,
    violationShare: ranked.coverage.violationShare,
    stops: ranked.cells
      .filter((cell) => cell.inPlan)
      .map((cell) => ({
        rank: cell.rank,
        gh6: cell.gh6,
        shortName: cell.shortName,
        location: cell.location,
        priority: cell.priority,
        hotspotProb: cell.hotspotProb,
        predIntensity: cell.predIntensity,
        peakHour: cell.peakHour,
        freight: cell.freight,
        totalViol: cell.totalViol,
      })),
  })
  res.status(201).json(plan)
})

app.delete("/api/plans/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "That deployment id is not valid." })
    return
  }
  const deleted = await Deployment.findByIdAndDelete(req.params.id)
  if (!deleted) {
    res.status(404).json({ error: "That deployment is not in the database." })
    return
  }
  res.json({ ok: true })
})

const clientBuild = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../client/dist")
app.use(express.static(clientBuild))
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(clientBuild, "index.html"))
})

const port = Number(process.env.PORT || 47821)

connectDb()
  .then(() => seedIfEmpty())
  .then((count) => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`GRIDLOCK API on http://127.0.0.1:${port} (${count} cells in MongoDB)`)
    })
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

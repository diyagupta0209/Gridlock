import mongoose from "mongoose"

const cellSchema = new mongoose.Schema(
  {
    gh6: { type: String, required: true, unique: true, index: true },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    location: { type: String, required: true },
    predIntensity: { type: Number, required: true },
    hotspotProb: { type: Number, required: true },
    totalViol: { type: Number, required: true },
    heavyShare: { type: Number, required: true },
    peakHour: { type: Number, required: true },
  },
  { versionKey: false },
)

const stopSchema = new mongoose.Schema(
  {
    rank: Number,
    gh6: String,
    shortName: String,
    location: String,
    priority: Number,
    hotspotProb: Number,
    predIntensity: Number,
    peakHour: Number,
    freight: Boolean,
    totalViol: Number,
  },
  { _id: false },
)

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    capacity: Number,
    freightWeight: Number,
    sort: String,
    freightOnly: Boolean,
    violationShare: Number,
    stops: [stopSchema],
  },
  { timestamps: true, versionKey: false },
)

export const Cell = mongoose.model("Cell", cellSchema)
export const Deployment = mongoose.model("Deployment", planSchema)

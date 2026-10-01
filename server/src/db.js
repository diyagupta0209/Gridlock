import mongoose from "mongoose"

export function mongoUri() {
  return process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/gridlock"
}

export async function connectDb() {
  mongoose.set("strictQuery", true)
  await mongoose.connect(mongoUri())
  return mongoose.connection
}

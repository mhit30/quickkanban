import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";

import boardRouter from "./routes/boardRoutes.mjs";
import taskRouter from "./routes/taskRouter.mjs";
import columnRouter from "./routes/columnRouter.mjs";
import redis_client from "./services/redis-client.mjs";
import queryRouter from "./routes/queryRouter.mjs";
const app = express();

const prod = false;
const CLIENT1 = prod ? process.env.CLIENT_URL_PROD1 : process.env.CLIENT_URL;
const CLIENT2 = prod ? process.env.CLIENT_URL_PROD2 : null;
const MONGO_URI = prod ? process.env.MONGO_URI_PROD : process.env.MONGO_URI;

// init redis
redis_client.initRedis();

app.use(cors({ origin: [CLIENT1, CLIENT2] }));
app.use(express.json());

app.use("/boards", boardRouter);
app.use("/tasks", taskRouter);
app.use("/columns", columnRouter);
app.use("/query", queryRouter);
export const connectDB = async () => {
  await mongoose.connect(MONGO_URI);
  console.log("MongoDB connected");
};

export default app;

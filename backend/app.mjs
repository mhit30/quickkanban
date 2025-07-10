import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";

import boardRouter from "./routes/boardRoutes.mjs";
import taskRouter from "./routes/taskRouter.mjs";
import columnRouter from "./routes/columnRouter.mjs";

const app = express();

const prod = false;
const CLIENT1 = prod ? process.env.CLIENT_URL_PROD1 : process.env.CLIENT_URL;
const CLIENT2 = prod ? process.env.CLIENT_URL_PROD2 : null;
const MONGO_URI = prod ? process.env.MONGO_URI_PROD : process.env.MONGO_URI;

app.use(cors({ origin: [CLIENT1, CLIENT2] }));
app.use(express.json());

app.use("/board", boardRouter);
app.use("/task", taskRouter);
app.use("/column", columnRouter);

export const connectDB = async () => {
  await mongoose.connect(MONGO_URI);
  console.log("MongoDB connected");
};

export default app;

import { Router } from "express";
import queryControllers from "../controllers/queryControllers.mjs";
const queryRouter = Router();

queryRouter.post("/", queryControllers.query);

export default queryRouter;

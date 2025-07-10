import { Router } from "express";
import columnControllers from "../controllers/columnController.mjs";
const columnRouter = Router();

columnRouter.get("/:id", columnControllers.getColumn);
columnRouter.post("/", columnControllers.createColumn);
columnRouter.put("/:id", columnControllers.updateColumn);
columnRouter.delete("/:id", columnControllers.deleteColumn);

export default columnRouter;

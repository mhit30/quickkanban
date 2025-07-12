import { Router } from "express";
import boardControllers from "../controllers/boardController.mjs";
const boardRouter = Router();

boardRouter.get("/:slug", boardControllers.getBoard);
boardRouter.post("/", boardControllers.createBoard);
boardRouter.put("/:slug", boardControllers.updateBoard);
boardRouter.delete("/:slug", boardControllers.deleteBoard);

export default boardRouter;

import { Router } from "express";
import { boardControllers } from "../controllers/boardController";

const boardRouter = Router();

boardRouter.get("/:id", boardControllers.getBoard);
boardRouter.post("/", boardControllers.createBoard);
boardRouter.put("/:id", boardControllers.updateBoard);
boardRouter.delete("/:id", boardControllers.deleteBoard);

export default boardRouter;

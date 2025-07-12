import { Router } from "express";
import taskControllers from "../controllers/taskController.mjs";
const taskRouter = Router();

taskRouter.get("/:taskId", taskControllers.getTask);
taskRouter.post("/", taskControllers.createTask);
taskRouter.put("/:taskId", taskControllers.updateTask);
taskRouter.delete("/:taskId", taskControllers.deleteTask);

export default taskRouter;

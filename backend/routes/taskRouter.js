import { Router } from "express";
import taskControllers from "../controllers/taskController";
const taskRouter = Router();

taskRouter.get("/:id", taskControllers.getTask);
taskRouter.post("/", taskControllers.createTask);
taskRouter.put("/:id", taskControllers.updateTask);
taskRouter.delete("/:id", taskControllers.deleteTask);

export default taskRouter;

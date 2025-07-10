import mongoose from "mongoose";
import { Task } from "../models/Board.mjs";
import { TaskSchema, TaskUpdateSchema } from "../validators/taskValidator.mjs";

const getTask = async (req, res) => {
  const taskId = req.param.id;
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return res.status(400).json({ success: false, message: "Invalid task ID" });
  }
  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }
    return res.status(200).json({ success: true, task: task });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const createTask = async (req, res) => {
  const result = TaskSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }
  try {
    const task = await Task.create(result.data);

    // fire to embedder
    const embedPostBody = {
      task: task.title,
      taskId: task._id,
    };
    await fetch("http://localhost:8001", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(embedPostBody),
    });
    res.status(201).json({ success: true, taskId: task._id.toString() });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const updateTask = async (req, res) => {
  const taskId = req.param.id;
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return res.status(400).json({ success: false, message: "Invalid task ID" });
  }
  const result = TaskUpdateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }
  try {
    const task = await Task.findByIdAndUpdate(taskId, result.data, {
      new: true,
    });
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }
    return res.status(200).json({ success: true, task: task });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const deleteTask = async (req, res) => {
  const taskId = req.param.id;
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return res.status(400).json({ success: false, message: "Invalid task ID" });
  }
  try {
    const task = await Task.findByIdAndDelete(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }
    return res.status(200).json({ success: true, message: "Task deleted" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const taskControllers = { getTask, createTask, updateTask, deleteTask };

export default taskControllers;

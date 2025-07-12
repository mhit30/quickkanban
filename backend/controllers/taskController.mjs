import mongoose from "mongoose";
import { Task, Board, Column } from "../models/Board.mjs";
import { TaskSchema, TaskUpdateSchema } from "../validators/taskValidator.mjs";
import { getIO } from "../socket.mjs";
import { getBoard } from "../utils/getBoard.mjs";
import redis_client from "../services/redis-client.mjs";

const embedUrl = process.env.EMBED_SERVICE_URL || "http://embed-service:8001";

const getTask = async (req, res) => {
  const taskId = req.params.taskId;
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

  if (!mongoose.Types.ObjectId.isValid(result.data.boardId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid board ID" });
  }

  if (!mongoose.Types.ObjectId.isValid(result.data.columnId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid column ID" });
  }

  try {
    const boardExists = await Board.exists({ _id: result.data.boardId });
    if (!boardExists) {
      return res
        .status(400)
        .json({ success: false, message: "Board not found" });
    }
    const columnExists = await Column.exists({ _id: result.data.columnId });
    if (!columnExists) {
      return res
        .status(400)
        .json({ success: false, message: "Column not found" });
    }
    const task = await Task.create(result.data);
    // REDIS
    const io = getIO();
    const redis = redis_client.getRedis();
    let cachedBoard = await redis.get(`board:${boardExists._id}`);
    if (cachedBoard) {
      cachedBoard = JSON.parse(cachedBoard);
      const col = cachedBoard.columns.find(
        (c) => c._id.toString() === columnExists._id.toString()
      );
      if (col) {
        col.tasks.push(task);
      }
      await redis.set(`board:${boardExists._id}`, JSON.stringify(cachedBoard));
      io.to(result.data.boardId.toString()).emit("board", cachedBoard);
    } else {
      const board = await getBoard(task.boardId);
      io.to(result.data.boardId.toString()).emit("board", board);
    }

    //

    // fire to embedder
    fetch(`${embedUrl}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: `${task.title} ${task.description || ""}`,
        taskNumericId: task.taskId,
        taskId: task._id,
        boardId: boardExists._id,
      }),
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
  const taskId = req.params.taskId;
  const result = TaskUpdateSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return res.status(400).json({ success: false, message: "Invalid task ID" });
  }

  if (!mongoose.Types.ObjectId.isValid(result.data.boardId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid board ID" });
  }
  if (!mongoose.Types.ObjectId.isValid(result.data.columnId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid column ID" });
  }
  try {
    const boardExists = await Board.exists({ _id: result.data.boardId });
    if (!boardExists) {
      return res
        .status(400)
        .json({ success: false, message: "Board not found" });
    }
    const columnExists = await Column.exists({ _id: result.data.columnId });
    if (!columnExists) {
      return res
        .status(400)
        .json({ success: false, message: "Column not found" });
    }

    const prevTask = await Task.findById(taskId);
    const task = await Task.findByIdAndUpdate(taskId, result.data, {
      new: true,
    });
    if (!task || !prevTask) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    // REDIS
    const io = getIO();

    const redis = redis_client.getRedis();
    let cachedBoard = await redis.get(`board:${boardExists._id}`);

    if (cachedBoard) {
      cachedBoard = JSON.parse(cachedBoard);
      if (prevTask.columnId.toString() !== task.columnId.toString()) {
        const oldCol = cachedBoard.columns.find(
          (c) => c._id.toString() === prevTask.columnId.toString()
        );
        const newCol = cachedBoard.columns.find(
          (c) => c._id.toString() === task.columnId.toString()
        );

        if (oldCol && newCol) {
          oldCol.tasks = oldCol.tasks.filter(
            (t) => t._id.toString() !== task._id.toString()
          );

          newCol.tasks.push(task);
        }
      } else {
        const col = cachedBoard.columns.find(
          (c) => c._id.toString() === task.columnId.toString()
        );
        if (col) {
          const taskIndex = col.tasks.findIndex(
            (t) => t._id.toString() === task._id.toString()
          );
          if (taskIndex !== -1) {
            col.tasks[taskIndex] = task;
          }
        }
      }

      await redis.set(`board:${boardExists._id}`, JSON.stringify(cachedBoard));
      io.to(task.boardId.toString()).emit("board", cachedBoard);
    } else {
      const board = await getBoard(task.boardId);
      io.to(task.boardId.toString()).emit("board", board);
    }

    if (
      prevTask.title !== task.title ||
      prevTask.description !== task.description
    ) {
      // fire to embedder to update
      fetch(`${embedUrl}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: `${task.title} ${task.description || ""}`,
          taskNumericId: task.taskId,
          taskId: task._id,
          boardId: boardExists._id,
        }),
      });
    }
    return res.status(200).json({ success: true, task: task });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const deleteTask = async (req, res) => {
  const taskId = req.params.taskId;
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

    // REDIS
    const io = getIO();

    const redis = redis_client.getRedis();
    let cachedBoard = await redis.get(`board:${task.boardId}`);
    if (cachedBoard) {
      cachedBoard = JSON.parse(cachedBoard);
      const col = cachedBoard.columns.find(
        (c) => c._id.toString() === task.columnId.toString()
      );

      if (col) {
        col.tasks = col.tasks.filter(
          (t) => t._id.toString() !== task._id.toString()
        );
      }

      await redis.set(`board:${task.boardId}`, JSON.stringify(cachedBoard));
      io.to(task.boardId.toString()).emit("board", cachedBoard);
    } else {
      const board = await getBoard(task.boardId);
      io.to(task.boardId.toString()).emit("board", board);
    }

    // fire to embedder to delete
    fetch(`${embedUrl}/${task.taskId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    return res.status(200).json({ success: true, message: "Task deleted" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const taskControllers = { getTask, createTask, updateTask, deleteTask };

export default taskControllers;

import mongoose from "mongoose";
import { Board, Column, Task } from "../models/Board.mjs";
import { getIO } from "../socket.mjs";
import {
  ColumnSchema,
  ColumnUpdateSchema,
} from "../validators/columnValidators.mjs";
import { getBoard } from "../utils/getBoard.mjs";
import redis_client from "../services/redis-client.mjs";
const getColumn = async (req, res) => {
  const columnId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(columnId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid column ID" });
  }
  try {
    const column = await Column.findById(columnId);
    if (!column) {
      return res
        .status(404)
        .json({ success: false, message: "Column not found" });
    }
    const tasks = await Task.find({ columnId: column._id });

    return res
      .status(200)
      .json({ success: true, column: { name: column.name, tasks: tasks } });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const createColumn = async (req, res) => {
  const result = ColumnSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }

  try {
    const boardExists = await Board.exists({ _id: result.data.boardId });
    if (!boardExists) {
      return res
        .status(400)
        .json({ success: false, message: "Board not found" });
    }

    const column = await Column.create(result.data);

    // save to redis
    const redis = redis_client.getRedis();
    let cachedBoard = await redis.get(`board:${boardExists._id}`);
    const io = getIO();
    if (cachedBoard) {
      cachedBoard = JSON.parse(cachedBoard);
      cachedBoard.columns.push({
        _id: column._id,
        title: column.columnTitle,
        tasks: [],
      });
      await redis.set(`board:${boardExists._id}`, JSON.stringify(cachedBoard));
      io.to(result.data.boardId).emit("board", cachedBoard);
    } else {
      // EMIT TO ROOM
      const board = await getBoard(result.data.boardId);
      io.to(result.data.boardId).emit("board", board);
    }
    return res.status(201).json({ success: true, columnId: column._id });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const updateColumn = async (req, res) => {
  const columnId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(columnId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid column ID" });
  }

  const result = ColumnUpdateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }
  try {
    const boardExists = await Board.exists({ _id: result.data.boardId });
    if (!boardExists) {
      return res
        .status(400)
        .json({ success: false, message: "Board not found" });
    }
    const updated = await Column.findByIdAndUpdate(columnId, result.data, {
      new: true,
    });
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Column not found" });
    }
    // save to redis
    const io = getIO();
    const redis = redis_client.getRedis();
    let cachedBoard = await redis.get(`board:${boardExists._id}`);
    if (cachedBoard) {
      cachedBoard = JSON.parse(cachedBoard);
      const col = cachedBoard.columns.find(
        (c) => c._id.toString() === updated._id.toString()
      );
      if (col) {
        col.title = updated.columnTitle;
      }
      await redis.set(`board:${boardExists._id}`, JSON.stringify(cachedBoard));
      io.to(updated.boardId.toString()).emit("board", cachedBoard);
    } else {
      const board = await getBoard(updated.boardId);
      io.to(updated.boardId.toString()).emit("board", board);
    }
    //
    return res.status(200).json({ success: true, column: updated });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const deleteColumn = async (req, res) => {
  const columnId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(columnId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid column ID" });
  }

  try {
    const deleted = await Column.findByIdAndDelete(columnId);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Column not found" });
    }

    // delete all tasks
    await Task.deleteMany({ columnId: deleted._id });
    // redis caching
    const io = getIO();
    const redis = redis_client.getRedis();
    let cachedBoard = await redis.get(`board:${deleted.boardId}`);
    if (cachedBoard) {
      cachedBoard = JSON.parse(cachedBoard);
      cachedBoard.columns = cachedBoard.columns.filter(
        (c) => c._id.toString() !== deleted._id.toString()
      );
      await redis.set(`board:${deleted.boardId}`, JSON.stringify(cachedBoard));
      io.to(deleted.boardId.toString()).emit("board", cachedBoard);
    } else {
      const board = await getBoard(deleted.boardId);
      io.to(deleted.boardId.toString()).emit("board", board);
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const columnControllers = {
  getColumn,
  createColumn,
  updateColumn,
  deleteColumn,
};

export default columnControllers;

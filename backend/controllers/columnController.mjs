import mongoose from "mongoose";

import { Column, Task } from "../models/Board.mjs";
import {
  ColumnSchema,
  ColumnUpdateSchema,
} from "../validators/columnValidators.mjs";
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
    const column = await Column.create(result.data);
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
    const updated = await Column.findByIdAndUpdate(columnId, result.data, {
      new: true,
    });
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Column not found" });
    }
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

import mongoose from "mongoose";

const BoardSchema = new mongoose.Schema(
  {
    boardTitle: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const ColumnSchema = new mongoose.Schema(
  {
    columnTitle: { type: String, required: true },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "board",
    },
  },
  { timestamps: true }
);

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: false },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    priority: {
      type: String,
      enum: ["low", "med", "high"],
    },
    labels: {
      type: String,
      enum: ["frontend", "backend"],
    },
    isFinished: {
      type: Boolean,
      default: false,
    },
    user: { type: String, required: true },
    columnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "column",
      required: true,
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "board",
      required: true,
    },
  },
  { timestamps: true }
);

export const Board =
  mongoose.models.board || mongoose.model("board", BoardSchema);
export const Task = mongoose.models.task || mongoose.model("task", TaskSchema);
export const Column =
  mongoose.models.column || mongoose.model("column", ColumnSchema);

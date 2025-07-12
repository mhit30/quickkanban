import mongoose from "mongoose";

const BoardSchema = new mongoose.Schema(
  {
    boardTitle: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
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
    taskId: { type: Number, required: false, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: false },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
    },
    labels: {
      type: [String],
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

TaskSchema.pre("save", async function (next) {
  if (this.taskId) return next();

  let unique = false;
  while (!unique) {
    const candidate = Math.floor(100000 + Math.random() * 900000);
    const existing = await this.constructor.findOne({ taskId: candidate });
    if (!existing) {
      this.taskId = candidate;
      unique = true;
    }
  }

  next();
});

export const Board =
  mongoose.models.board || mongoose.model("board", BoardSchema);
export const Task = mongoose.models.task || mongoose.model("task", TaskSchema);
export const Column =
  mongoose.models.column || mongoose.model("column", ColumnSchema);

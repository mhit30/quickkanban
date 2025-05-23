const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
  },
});

const ColumnSchema = new mongoose.Schema({
  name: { type: String, required: true },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "room",
  },
});

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  column: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "column",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  user: { type: String, required: true },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "room",
    required: true,
  },
});

const Room = mongoose.model("room", RoomSchema);
const Task = mongoose.model("task", TaskSchema);
const Column = mongoose.model("column", ColumnSchema);

module.exports = { Room, Task, Column };

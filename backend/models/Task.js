const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ["todo", "done"],
    default: "todo",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  cols: [String],
  user: { type: String, required: true },
  roomId: { type: String, required: true }, // one board per room
});

module.exports = mongoose.model("task", TaskSchema);

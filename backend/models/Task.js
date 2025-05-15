const mongoose = require("mongoose");

const TodoSchema = new mongoose.Schema({
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
  user: { type: String, required: true },
  roomId: { type: String, required: true },
});

module.exports = mongoose.model("todo", TodoSchema);

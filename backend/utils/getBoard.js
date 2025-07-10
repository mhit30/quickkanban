const { Column, Task } = require("../models/Board");

async function getBoard(boardId) {
  // get all the columns and tasks for this room
  const columns = await Column.find({ boardId: boardId });
  const tasks = await Task.find({ boardId: boardId }).sort({
    updatedAt: 1,
  });

  const board = {};

  for (const col of columns) {
    board[col._id] = {
      title: col.name,
      tasks: tasks.filter(
        (task) => task.column.toString() === col._id.toString() // get all the tasks associated with that specific column (col)
      ),
    };
  }
  return board;
}

module.exports = { getBoard };

import { Column, Task } from "../models/Board.mjs";

export async function getBoard(boardId) {
  try {
    const columns = await Column.find({ boardId });
    const tasks = await Task.find({ boardId }).sort({ updatedAt: 1 });

    const mapped = columns.map((col) => ({
      _id: col._id,
      title: col.columnTitle,
      tasks: tasks.filter(
        (task) => task.columnId.toString() === col._id.toString()
      ),
    }));

    return { _id: boardId, columns: mapped };
  } catch (err) {
    console.log(err);
  }
}

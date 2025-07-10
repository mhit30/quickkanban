import mongoose from "mongoose";
import { Board } from "../models/Board.mjs";
import { getBoard as getMyBoard } from "../utils/getBoard.mjs";
import {
  BoardSchema,
  BoardUpdateSchema,
} from "../validators/boardValidators.mjs";

const getBoard = async (req, res) => {
  const boardId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(boardId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid board ID" });
  }
  try {
    const board = await Board.findById(boardId);
    if (!board) {
      return res
        .status(404)
        .json({ success: false, message: "Board not found" });
    }
    const myBoard = await getMyBoard(board._id);
    return res.status(200).json({ success: true, board: myBoard });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const createBoard = async (req, res) => {
  const result = BoardSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }
  try {
    const board = await Board.create(result.data);
    return res.status(201).json({ success: true, board: board });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const updateBoard = async (req, res) => {
  const boardId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(boardId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid board ID" });
  }
  const result = BoardUpdateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }
  try {
    const board = await Board.findByIdAndUpdate(boardId, result.data, {
      new: true,
    });
    if (!board) {
      return res
        .status(404)
        .json({ success: false, message: "Board not found" });
    }
    return res.status(200).json({ success: true, board: board });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const deleteBoard = async (req, res) => {
  const boardId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(boardId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid board ID" });
  }
  try {
    const board = await Board.findByIdAndDelete(boardId);
    if (!board) {
      return res
        .status(404)
        .json({ success: false, message: "Board not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Board deleted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const boardControllers = {
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
};

export default boardControllers;

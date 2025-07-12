import slugify from "slugify";
import { Board } from "../models/Board.mjs";
import { getBoard as getMyBoard } from "../utils/getBoard.mjs";
import {
  BoardSchema,
  BoardUpdateSchema,
} from "../validators/boardValidators.mjs";
import redis_client from "../services/redis-client.mjs";
const getBoard = async (req, res) => {
  try {
    const board = await Board.findOne({ slug: req.params.slug });
    if (!board) {
      return res
        .status(404)
        .json({ success: false, message: "Board not found" });
    }
    const redis = redis_client.getRedis();
    const cachedBoard = await redis.get(`board:${board._id}`);
    if (cachedBoard) {
      return res
        .status(200)
        .json({ success: true, board: JSON.parse(cachedBoard) });
    } else {
      const myBoard = await getMyBoard(board._id);
      await redis.set(`board:${board._id}`, JSON.stringify(myBoard));
      return res.status(200).json({ success: true, board: myBoard });
    }
  } catch (err) {
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
    const slug = slugify(result.data.boardTitle, { lower: true, strict: true });
    const existing = await Board.findOne({ slug });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Board with that title already exists",
      });
    }

    const board = await Board.create({
      boardTitle: result.data.boardTitle,
      slug,
    });
    const myBoard = await getMyBoard(board._id);
    const redis = redis_client.getRedis();
    await redis.set(`board:${board._id}`, JSON.stringify(myBoard));
    return res.status(201).json({ success: true, board });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const updateBoard = async (req, res) => {
  const result = BoardUpdateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }

  try {
    const board = await Board.findOne({ slug: req.params.slug });
    if (!board) {
      return res
        .status(404)
        .json({ success: false, message: "Board not found" });
    }

    // update title and regenerate slug if title is being changed
    if (result.data.boardTitle) {
      board.boardTitle = result.data.boardTitle;
      board.slug = slugify(result.data.boardTitle, {
        lower: true,
        strict: true,
      });
    }

    await board.save();
    return res.status(200).json({ success: true, board });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findOneAndDelete({ slug: req.params.slug });
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

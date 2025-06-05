require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Redis = require("ioredis");

// My imports
const { Room, Column, Task } = require("./models/Board");
const { getBoard } = require("./utils/getBoard");
const app = express();
const server = http.createServer(app);

prod = true;
CLIENT1 = prod ? process.env.CLIENT_URL_PROD1 : process.env.CLIENT_URL;
CLIENT2 = prod ? process.env.CLIENT_URL_PROD2 : null;
PORT = prod ? process.env.PORT : 5001;
MONGO_URI = prod ? process.env.MONGO_URI_PROD : process.env.MONGO_URI;
REDIS_HOST = prod ? process.env.REDIS_HOST : "127.0.0.1";
REDIS_PORT = prod ? process.env.REDIS_PORT : 6379;
REDIS_PASS = prod ? process.env.REDIS_PASS : null;

const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASS,
});

app.use(cors({ origin: [CLIENT1, CLIENT2] }));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: [CLIENT1, CLIENT2],
    methods: ["GET", "POST"],
  },
});

// setup username prior to any connection
io.use(async (socket, next) => {
  const username = socket.handshake.auth.username;
  const roomId = socket.handshake.auth.roomId;
  if (!username || typeof username !== "string") {
    return next(new Error("Username required."));
  }
  if (!roomId || typeof roomId !== "string") {
    return next(new Error("Room id required."));
  }

  // ensure no duplicate usernames in roomid
  const groupSocket = await io.in(roomId).fetchSockets();
  const duplicate = groupSocket.find((s) => s.username === username.trim());
  if (duplicate) {
    return next(new Error("Username already taken for this room."));
  }
  socket.username = username.trim();
  socket.roomId = roomId.trim();
  next();
});

io.on("connection", async (socket) => {
  // join the specific room
  socket.join(socket.roomId);

  // console log for debugging
  console.log(`${socket.username} joined room ${socket.roomId}`);

  // join the room or create a new one
  let room = await Room.findOne({ roomId: socket.roomId });
  if (!room) {
    room = await Room.create({ roomId: socket.roomId });
    console.log(`New Room Created With Id: ${socket.roomId}`);
  }

  // emit the username of new user
  const groupSocket = await io.in(socket.roomId).fetchSockets();
  const users = groupSocket.map((socket) => socket.username);
  io.to(socket.roomId).emit("users", users);

  const board = await getBoard(room._id);

  // emit the new user
  io.to(socket.roomId).emit("board", board);

  socket.on("addTask", async ({ roomId, columnId, title, user }) => {
    try {
      console.time("addTaskTime");
      const room = await Room.findOne({ roomId: roomId });
      if (!room) return;
      const task = await Task.create({
        title: title,
        user: user,
        column: columnId,
        room: room._id,
      });

      // update the cached board immediately
      let cachedBoard = null;
      if (cachedBoard) {
        cachedBoard = JSON.parse(cachedBoard);
        if (cachedBoard[columnId]) {
          cachedBoard[columnId].tasks.push({
            _id: task._id,
            title: task.title,
            user: task.user,
            column: task.column,
            room: task.room,
            createdAt: task.createdAt,
          });
        }
        //await redis.set(`room:${room._id}`, JSON.stringify(cachedBoard));
        io.to(roomId).emit("board", cachedBoard);
      } else {
        const board = await getBoard(room._id);
        //await redis.set(`room:${room._id}`, JSON.stringify(board));
        io.to(roomId).emit("board", board);
      }
    } catch (err) {
      socket.emit("error", "Error adding task.");
    } finally {
      console.timeEnd("addTaskTime");
    }
  });

  socket.on("deleteTask", async ({ roomId, columnId, taskId }) => {
    try {
      console.time("deleteTaskTime");

      const room = await Room.findOne({ roomId: roomId });
      if (!room) return;
      await Task.deleteOne({ _id: taskId, room: room._id });

      let cachedBoard = null;
      if (cachedBoard) {
        cachedBoard = JSON.parse(cachedBoard);
        if (cachedBoard[columnId]) {
          const index = cachedBoard[columnId].tasks.findIndex(
            (t) => t._id == taskId
          );
          if (index !== -1) {
            cachedBoard[columnId].tasks.splice(index, 1);
          }
        }
        //await redis.set(`room:${room._id}`, JSON.stringify(cachedBoard));
        io.to(roomId).emit("board", cachedBoard);
      } else {
        const board = await getBoard(room._id);
        //await redis.set(`room:${room._id}`, JSON.stringify(board));
        io.to(roomId).emit("board", board);
      }
    } catch (err) {
      socket.emit("error", "Error deleting task.");
    } finally {
      console.timeEnd("deleteTaskTime");
    }
  });

  socket.on(
    "moveTask",
    async ({ roomId, taskId, fromColumnId, toColumnId }) => {
      try {
        console.time("moveTaskTime");

        const room = await Room.findOne({ roomId: roomId });
        if (!room) return;
        const task = await Task.findOne({
          _id: taskId,
          room: room._id,
          column: fromColumnId,
        });

        if (!task) return;

        task.column = toColumnId;
        await task.save();

        let cachedBoard = null;
        if (cachedBoard) {
          cachedBoard = JSON.parse(cachedBoard);
          if (cachedBoard[fromColumnId]) {
            const index = cachedBoard[fromColumnId].tasks.findIndex(
              (t) => t._id == taskId
            );
            if (index !== -1) {
              cachedBoard[fromColumnId].tasks.splice(index, 1);
            }
          }
          if (cachedBoard[toColumnId]) {
            cachedBoard[toColumnId].tasks.push({
              _id: task._id,
              title: task.title,
              user: task.user,
              column: task.column,
              room: task.room,
              createdAt: task.createdAt,
            });
          }
          //await redis.set(`room:${room._id}`, JSON.stringify(cachedBoard));
          io.to(roomId).emit("board", cachedBoard);
        } else {
          const board = await getBoard(room._id);
          //await redis.set(`room:${room._id}`, JSON.stringify(board));
          io.to(roomId).emit("board", board);
        }
      } catch (err) {
        socket.emit("error", "Error moving task.");
      } finally {
        console.timeEnd("moveTaskTime");
      }
    }
  );

  socket.on("createColumn", async ({ newColumnName, roomId }) => {
    try {
      console.time("createColumnTime");
      const room = await Room.findOne({ roomId: roomId });
      const column = await Column.create({
        name: newColumnName,
        roomId: room._id,
      });

      let cachedBoard = null;
      if (cachedBoard) {
        cachedBoard = JSON.parse(cachedBoard);
        cachedBoard[column._id] = {
          title: column.name,
          tasks: [],
        };
        console.log("FROM CACHE");

        //await redis.set(`room:${room._id}`, JSON.stringify(cachedBoard));
        io.to(roomId).emit("board", cachedBoard);
      } else {
        const board = await getBoard(room._id);
        //await redis.set(`room:${room._id}`, JSON.stringify(board));
        io.to(roomId).emit("board", board);
      }
    } catch (err) {
      socket.emit("error", "Error creating column.");
    } finally {
      console.timeEnd("createColumnTime");
    }
  });

  socket.on("deleteColumn", async ({ roomId, columnId }) => {
    try {
      console.time("deleteColumnTime");
      const room = await Room.findOne({ roomId: roomId });
      if (!room) return;
      const column = await Column.findOne({
        _id: columnId,
        roomId: room._id,
      });
      if (!column) return;
      await Task.deleteMany({ column: column._id });
      await column.deleteOne();

      // update the cache
      let cachedBoard = null;
      if (cachedBoard) {
        cachedBoard = JSON.parse(cachedBoard);
        delete cachedBoard[column._id];
        console.log("FROM CACHE");

        await redis.set(`room:${room._id}`, JSON.stringify(cachedBoard));
        io.to(roomId).emit("board", cachedBoard);
      } else {
        const board = await getBoard(room._id);
        //await redis.set(`room:${room._id}`, JSON.stringify(board));
        io.to(roomId).emit("board", board);
      }
    } catch (err) {
      socket.emit("error", "Error deleting task.");
    } finally {
      console.timeEnd("deleteColumnTime");
    }
  });
  socket.on("cursor-move", ({ x, y, username, roomId }) => {
    io.to(roomId).emit("cursor-update", { username, x, y });
  });
  socket.on("disconnect", async (reason) => {
    const groupSocket = await io.in(socket.roomId).fetchSockets();
    const users = groupSocket.map((socket) => socket.username);
    io.to(socket.roomId).emit("users", users);
    console.log(`${socket.username} disconnected from room ${socket.roomId}`);
  });
});

mongoose.connect(MONGO_URI).then(() => {
  console.log("MongoDB connected");
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

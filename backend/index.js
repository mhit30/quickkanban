require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
// My imports
const { Room, Column, Task } = require("./models/Board");

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: process.env.CLIENT_URL_PROD }));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL_PROD,
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

  let room = await Room.findOne({ roomId: socket.roomId });
  if (!room) {
    room = await Room.create({ roomId: socket.roomId });
    console.log(`New Room Created With Id: ${socket.roomId}`);
  }

  // emit the username of new user
  const groupSocket = await io.in(socket.roomId).fetchSockets();
  const users = groupSocket.map((socket) => socket.username);
  io.to(socket.roomId).emit("users", users);
  // get all the columns and tasks for this room
  const columns = await Column.find({ roomId: room._id });
  const tasks = await Task.find({ room: room._id }).sort({ createdAt: 1 });

  const board = {};

  for (const col of columns) {
    board[col._id] = {
      title: col.name,
      tasks: tasks.filter(
        (task) => task.column.toString() === col._id.toString() // get all the tasks associated with that specific column (col)
      ),
    };
  }

  // emit the new user
  io.to(socket.roomId).emit("board", board);

  socket.on("addTask", async ({ roomId, columnId, title, user }) => {
    try {
      const room = await Room.findOne({ roomId: roomId });
      if (!room) return;
      const task = await Task.create({
        title: title,
        user: user,
        column: columnId,
        room: room._id,
      });

      // get all the columns and tasks for this room
      const columns = await Column.find({ roomId: room._id });
      const tasks = await Task.find({ room: room._id }).sort({
        createdAt: 1,
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

      io.to(roomId).emit("board", board);
    } catch (err) {
      socket.emit("error", "Error adding task.");
    }
  });

  socket.on("deleteTask", async ({ roomId, taskId }) => {
    try {
      const room = await Room.findOne({ roomId: roomId });
      if (!room) return;
      await Task.deleteOne({ _id: taskId, room: room._id });

      // get all the columns and tasks for this room
      const columns = await Column.find({ roomId: room._id });
      const tasks = await Task.find({ room: room._id }).sort({
        createdAt: 1,
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

      io.to(roomId).emit("board", board);
    } catch (err) {
      socket.emit("error", "Error deleting task.");
    }
  });

  socket.on(
    "moveTask",
    async ({ roomId, taskId, fromColumnId, toColumnId }) => {
      try {
        const room = await Room.findOne({ roomId: roomId });
        if (!room) return;
        const task = await Task.findOne({
          room: room._id,
          column: fromColumnId,
          _id: taskId,
        });

        if (!task) return;

        task.column = toColumnId;
        await task.save();

        // get all the columns and tasks for this room
        const columns = await Column.find({ roomId: room._id });
        const tasks = await Task.find({ room: room._id }).sort({
          createdAt: 1,
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

        io.to(roomId).emit("board", board);
      } catch (err) {
        socket.emit("error", "Error moving task.");
      }
    }
  );

  socket.on("createColumn", async ({ newColumnName, roomId }) => {
    try {
      const room = await Room.findOne({ roomId: roomId });
      const column = await Column.create({
        name: newColumnName,
        roomId: room._id,
      });

      // get all the columns and tasks for this room
      const columns = await Column.find({ roomId: room._id });
      const tasks = await Task.find({ room: room._id }).sort({
        createdAt: 1,
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

      io.to(roomId).emit("board", board);
    } catch (err) {
      socket.emit("error", "Error creating column.");
    }
  });

  socket.on("deleteColumn", async ({ roomId, columnId }) => {
    try {
      const room = await Room.findOne({ roomId: roomId });
      if (!room) return;
      const column = await Column.findOne({
        _id: columnId,
        roomId: room._id,
      });
      if (!column) return;
      await Task.deleteMany({ column: column._id });
      await column.deleteOne();
      // get all the columns and tasks for this room
      const columns = await Column.find({ roomId: room._id });
      const tasks = await Task.find({ room: room._id }).sort({
        createdAt: 1,
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

      io.to(roomId).emit("board", board);
    } catch (err) {
      socket.emit("error", "Error deleting task.");
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

mongoose.connect(process.env.MONGO_URI_PROD).then(() => {
  console.log("MongoDB connected");
  server.listen(process.env.PORT || 5001, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
});

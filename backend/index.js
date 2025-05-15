require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
// My imports
const Task = require("./models/Task");

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
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

  const duplicate = groupSocket.find((s) => s.username === username);
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

  console.log(`${socket.username} joined room ${socket.roomId}`);

  setTimeout(async () => {
    const usersInRoom = await io.in(socket.roomId).fetchSockets();
    const userList = usersInRoom.map((s) => ({
      id: s.id,
      username: s.username,
    }));
    console.log(userList);
    io.to(socket.roomId).emit("users", userList);
  }, 0);

  // add to tasks
  socket.on("add-task", async (task) => {
    try {
      const newTask = new Task({
        title: task.title,
        description: task.description,
        user: socket.username,
        roomId: socket.roomId,
      });
      await newTask.save();
    } catch (err) {
      console.log(err);
    }
  });
  // emit signal to broadcast taks
  socket.on("get-tasks", async () => {
    try {
      // get all the tasks for that room
      const tasks = await Task.find({ roomId: socket.roomId }).sort({
        createdAt: -1,
      });
      // emit task to the room
      io.to(socket.roomId).emit("tasks", tasks);
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("disconnect", async (reason) => {
    const usersInRoom = await io.in(socket.roomId).fetchSockets();
    const userList = usersInRoom.map((s) => ({
      id: s.id,
      username: s.username,
    }));
    io.to(socket.roomId).emit("users", userList);
    console.log(`${socket.username} disconnected from room ${socket.roomId}`);
  });
});

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("MongoDB connected");
  server.listen(5001, () => {
    console.log("Server running on port 5000");
  });
});

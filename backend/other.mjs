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
      const room = await Room.findOne({ roomId: roomId });
      if (!room) return;
      const task = await Task.create({
        title: title,
        user: user,
        column: columnId,
        room: room._id,
      });

      // update the cached board immediately
      let cachedBoard = await redis.get(`room:${room._id}`);
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
        await redis.set(`room:${room._id}`, JSON.stringify(cachedBoard));
        io.to(roomId).emit("board", cachedBoard);
      } else {
        const board = await getBoard(room._id);
        await redis.set(`room:${room._id}`, JSON.stringify(board));
        io.to(roomId).emit("board", board);
      }
    } catch (err) {
      socket.emit("error", "Error adding task.");
    }
  });

  socket.on("deleteTask", async ({ roomId, columnId, taskId }) => {
    try {
      const room = await Room.findOne({ roomId: roomId });
      if (!room) return;
      await Task.deleteOne({ _id: taskId, room: room._id });

      let cachedBoard = await redis.get(`room:${room._id}`);
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
        await redis.set(`room:${room._id}`, JSON.stringify(cachedBoard));
        io.to(roomId).emit("board", cachedBoard);
      } else {
        const board = await getBoard(room._id);
        await redis.set(`room:${room._id}`, JSON.stringify(board));
        io.to(roomId).emit("board", board);
      }
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
          _id: taskId,
          room: room._id,
          column: fromColumnId,
        });

        if (!task) return;

        task.column = toColumnId;
        await task.save();

        let cachedBoard = await redis.get(`room:${room._id}`);
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
          await redis.set(`room:${room._id}`, JSON.stringify(cachedBoard));
          io.to(roomId).emit("board", cachedBoard);
        } else {
          const board = await getBoard(room._id);
          await redis.set(`room:${room._id}`, JSON.stringify(board));
          io.to(roomId).emit("board", board);
        }
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

      let cachedBoard = await redis.get(`room:${room._id}`);
      if (cachedBoard) {
        cachedBoard = JSON.parse(cachedBoard);
        cachedBoard[column._id] = {
          title: column.name,
          tasks: [],
        };

        await redis.set(`room:${room._id}`, JSON.stringify(cachedBoard));
        io.to(roomId).emit("board", cachedBoard);
      } else {
        const board = await getBoard(room._id);
        await redis.set(`room:${room._id}`, JSON.stringify(board));
        io.to(roomId).emit("board", board);
      }
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

      // update the cache
      let cachedBoard = await redis.get(`room:${room._id}`);
      if (cachedBoard) {
        cachedBoard = JSON.parse(cachedBoard);
        delete cachedBoard[column._id];

        await redis.set(`room:${room._id}`, JSON.stringify(cachedBoard));
        io.to(roomId).emit("board", cachedBoard);
      } else {
        const board = await getBoard(room._id);
        await redis.set(`room:${room._id}`, JSON.stringify(board));
        io.to(roomId).emit("board", board);
      }
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

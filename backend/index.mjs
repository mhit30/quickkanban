import http from "http";
import app, { connectDB } from "./app.mjs";
import { init, getIO } from "./socket.mjs";
import joinBoardHandlers from "./handlers/joinBoardHandlers.mjs";

const PORT = process.env.PORT || 5001;

const server = http.createServer(app);

const io = init(server);

io.on("connection", async (socket) => {
  console.log("Socket connected", socket.id);
  joinBoardHandlers(io, socket);

  const boardId = socket.handshake.auth.boardId;

  socket.on("cursor-move", ({ x, y, username }) => {
    io.to(boardId).emit("cursor-update", { username, x, y });
  });

  socket.on("disconnect", async () => {
    console.log("Socket disconnected", socket.id);
    // get the board id and build a list of each user's username in the board
    const boardId = socket.handshake.auth.boardId;
    const sockets = await io.in(boardId).fetchSockets();
    const usernames = sockets.map((s) => s.handshake.auth.username);
    io.to(boardId).emit("users", usernames);
  });
});

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

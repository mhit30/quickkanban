export default function joinBoardHandlers(io, socket) {
  socket.on("board:join", async ({ boardId, username }) => {
    socket.join(boardId);
    console.log("Socket joined the board", socket.handshake.auth);

    try {
      const socketsInRoom = await io.in(boardId).fetchSockets();
      const usersInRoom = socketsInRoom.map((s) => s.handshake.auth.username);
      // Emit to everyone in the room
      io.to(boardId).emit("users", usersInRoom);
    } catch (err) {
      console.error("Error fetching sockets in room:", err);
    }
  });
}

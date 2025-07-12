import { Server } from "socket.io";

let io = null;

export const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.IO not initialized.");
  return io;
};

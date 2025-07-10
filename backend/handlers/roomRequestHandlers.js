module.exports = function (socket, io) {
  // leader will decide if other socket can join
  socket.on(
    "moderator:request-decision",
    async ({ roomId, targetSocketId, canJoin }) => {
      if (!roomId || !targetSocketId || canJoin === null) {
        socket.emit("error", {
          message: "roomId, targetSocketId, or canJoin parameters are missing.",
        });
        return;
      }

      const requestingSocket = io.sockets.sockets.get(targetSocketId);
      if (!requestingSocket) {
        socket.emit("error", {
          message: "The requesting user is no longer online.",
        });
        return;
      }

      if (!socket.isMod) {
        socket.emit("error", {
          message: "Unauthorized: You are not a moderator.",
        });
        return;
      }

      if (canJoin) {
        // put the requesting socket into the room, else emit to the requesting socket that they cannot join
        if (requestingSocket) {
          // force join the requesting socket into the room
          requestingSocket.join(roomId);
          requestingSocket.isMod = false;
          requestingSocket.room = roomId;
          // emit join decision to requesting socket
          requestingSocket.emit("requester:join-decision", {
            message: "You have successfully joined the room.",
            allowed: true,
          });
          // indicate member joined to room
          io.to(roomId).emit("room:member-joined", {
            memberId: requestingSocket.id,
            memberName: requestingSocket.username,
          });
        } else {
          socket.emit("error", {
            message: "The requesting user is no longer online.",
          });
        }
      } else {
        requestingSocket.emit("requester:join-decision", {
          message: "Your request to join the room was denied.",
          joined: false,
        });
      }
    }
  );
};

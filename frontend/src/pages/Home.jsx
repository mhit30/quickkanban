import { HStack, VStack, Input, Button, Text, Flex } from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
// my imports
import Column from "../components/Column";

function Home() {
  const socketRef = useRef(null);
  const roomIdRef = useRef("");
  const usernameRef = useRef("");
  const [board, setBoard] = useState(null);
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [error, setError] = useState("");

  const [newColumnName, setNewColumnName] = useState("");
  const [users, setUsers] = useState([]);

  const handleJoin = () => {
    const socket = io("http://localhost:5001", {
      autoConnect: false,
      auth: { username, roomId },
    });
    roomIdRef.current = roomId;
    usernameRef.current = username;
    socket.on("connect_error", (err) => {
      setError(err.message);
    });

    socket.on("board", (initialBoard) => {
      setBoard(initialBoard);
      setHasJoined(true);
      setUsername("");
      setRoomId("");
    });

    socket.on("users", (allUsers) => {
      setUsers(allUsers);
    });
    socket.connect(); // only connect after our listeners are set, thus firing listening only after connection set
    socketRef.current = socket;
  };

  const handleCreateNewColumn = () => {
    socketRef.current.emit("createColumn", {
      newColumnName: newColumnName,
      roomId: roomIdRef.current,
    });
    setNewColumnName("");
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.off("board");
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <VStack p={4} align="start">
      {!hasJoined ? (
        <VStack spacing={4} align="stretch" w="300px">
          <Text fontSize="2xl" fontWeight="bold">
            Join a Room
          </Text>
          <Input
            placeholder="Enter a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            placeholder="Enter a room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <Button onClick={handleJoin} colorScheme="blue">
            Join Room
          </Button>
          {error && <Text color="red.500">{error}</Text>}
        </VStack>
      ) : board ? (
        <Flex direction="column" p={4} m={4}>
          <HStack align="start" spacing={4}>
            {Object.entries(board).map(([columnId, column]) => {
              return (
                <Column
                  key={columnId}
                  columnId={columnId}
                  title={column.title}
                  tasks={column.tasks}
                  onAddTask={(newTaskTitle) => {
                    socketRef.current.emit("addTask", {
                      roomId: roomIdRef.current,
                      columnId: columnId,
                      title: newTaskTitle,
                      user: usernameRef.current,
                    });
                  }}
                  onDeleteTask={(taskId) => {
                    socketRef.current.emit("deleteTask", {
                      roomId: roomIdRef.current,
                      taskId: taskId,
                    });
                  }}
                  onMoveTask={(fromCol, toCol, taskId) => {
                    socketRef.current.emit("moveTask", {
                      roomId: roomIdRef.current,
                      taskId: taskId,
                      fromColumnId: fromCol,
                      toColumnId: toCol,
                    });
                  }}
                  onDeleteColumn={(columnId) => {
                    socketRef.current.emit("deleteColumn", {
                      roomId: roomIdRef.current,
                      columnId: columnId,
                    });
                  }}
                />
              );
            })}
          </HStack>
          <HStack m={4}>
            <Input
              placeholder="Create new column"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
            />
            <Button onClick={handleCreateNewColumn}>Add Column</Button>
            <Button
              onClick={() => {
                socketRef.current?.disconnect();
                socketRef.current = null;
                setHasJoined(false);
                setBoard(null);
              }}
              backgroundColor="red.500"
            >
              Leave Room
            </Button>
          </HStack>
          <HStack m={4}>
            <Text>Live Users: </Text>
            {users.map((username, index) => {
              return <Text key={index}>{username}</Text>;
            })}
          </HStack>
        </Flex>
      ) : (
        <Text>Loading board...</Text>
      )}
    </VStack>
  );
}
export default Home;

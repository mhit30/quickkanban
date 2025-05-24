import {
  HStack,
  VStack,
  Input,
  Button,
  Text,
  Flex,
  Box,
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { keyframes } from "@emotion/react";
// my imports
import Column from "../components/Column";

const apiURL = import.meta.env.VITE_API_URL;

const bounce = keyframes`0%, 100% {transform: translateY(0)}
                        50% {transform: translateY(-3px); }`;
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
  const [cursors, setCursors] = useState({});

  const handleJoin = () => {
    const socket = io(`${apiURL}`, {
      autoConnect: false,
      auth: { username, roomId },
    });
    roomIdRef.current = roomId;
    usernameRef.current = username;
    socketRef.current = socket;
    socket.on("connect_error", (err) => {
      setError(err.message);
    });

    socket.on("error", (err) => {
      setError(err);
    });
    socket.on("board", (initialBoard) => {
      setBoard(initialBoard);
      setHasJoined(true);
      setUsername("");
      setRoomId("");
      setError("");
    });

    socket.on("users", (allUsers) => {
      setUsers(allUsers);
    });
    socket.connect(); // only connect after our listeners are set, thus firing listening only after connection set
  };

  const handleCreateNewColumn = () => {
    socketRef.current.emit("createColumn", {
      newColumnName: newColumnName,
      roomId: roomIdRef.current,
    });
    setNewColumnName("");
  };

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleMouseMove = (e) => {
      socket.emit("cursor-move", {
        x: e.clientX,
        y: e.clientY,
        username: usernameRef.current,
        roomId: roomIdRef.current,
      });
    };

    const handleCursorUpdate = ({ username, x, y }) => {
      if (username != usernameRef.current) {
        setCursors((prev) => {
          return {
            ...prev,
            [username]: { x, y },
          };
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    socketRef.current.on("cursor-update", handleCursorUpdate);

    return () => {
      if (socketRef.current) {
        socketRef.current.off("board");
        socketRef.current.off("cursor-update");
        window.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, [hasJoined]);

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
          <HStack m={2}>
            <Text fontWeight="semibold">Room ID: {roomIdRef.current}</Text>
            <Box
              w="10px"
              h="10px"
              borderRadius="full"
              bg="green.400"
              animation={`${bounce} 1s infinite`}
            />
            <Text fontWeight="semibold">Live Users: </Text>
            {users.map((username, index) => {
              return <Text key={index}>{username}</Text>;
            })}
          </HStack>
          <HStack m={2}>{error && <Text color="red.500">{error}</Text>}</HStack>
          <Box w="75vw" p={2}>
            <Flex gap={2}>
              <Input
                flex="1"
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
            </Flex>
          </Box>

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
          {Object.entries(cursors).map(([username, pos]) => (
            <Box
              key={username}
              position="fixed"
              top={pos.y}
              left={pos.x}
              bg="blue.500"
              color="white"
              px={2}
              py={1}
              fontSize="xs"
              borderRadius="sm"
              pointerEvents="none"
              transform="translate(-50%, -100%)"
              zIndex={9999}
            >
              {username}
            </Box>
          ))}
        </Flex>
      ) : (
        <Text>Loading board...</Text>
      )}
    </VStack>
  );
}
export default Home;

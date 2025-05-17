import { useState, useEffect, useRef } from "react";
import Task from "@/components/Task";
import {
  VStack,
  HStack,
  StackSeparator,
  Input,
  Flex,
  Button,
  Text,
  Box,
} from "@chakra-ui/react";
import { io } from "socket.io-client";
import Board from "@/components/Board";

const apiURL = import.meta.env.VITE_API_URL;
function Home() {
  const socketInitialized = useRef(false);
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
  });
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);

  // handle username submission
  const handleRegistration = (e) => {
    if (socketInitialized.current) return;
    e.preventDefault();
    const newSocket = io(apiURL, {
      auth: { username: username, roomId: roomId },
    });
    newSocket.on("connect_error", (err) => {
      setError(err.message);
    });

    // immediately get the users
    newSocket.on("users", (value) => setUsers(value));

    newSocket.on("connect", () => {
      localStorage.setItem("username", username);
      localStorage.setItem("roomId", roomId);
      setSocket(newSocket);
      setHasJoined(true);
      socketInitialized.current = true;
    });
  };

  // handle task submmission
  const handleTaskSubmit = (e) => {
    e.preventDefault();
    socket.emit("add-task", newTask);
    // ask to refresh tasks
    socket.emit("get-tasks");
  };

  // run on mount
  useEffect(() => {
    if (socketInitialized.current) return;
    const savedUsername = localStorage.getItem("username");
    const savedRoomId = localStorage.getItem("roomId");

    if (savedUsername && savedRoomId && !socket) {
      const newSocket = io(apiURL, {
        auth: { username: savedUsername, roomId: savedRoomId },
      });
      newSocket.on("connect_error", (err) => {
        setError(err.message);
      });

      // immediately get the users
      newSocket.on("users", (value) => setUsers(value));

      newSocket.on("connect", () => {
        setUsername(savedUsername);
        setRoomId(savedRoomId);
        setSocket(newSocket);
        setHasJoined(true);
        socketInitialized.current = true;
      });
    }
  }, []);

  // run evertime socket object changes
  useEffect(() => {
    if (!socket) return;
    // send signal to get the tasks
    socket.emit("get-tasks");
    // listen to server giving tasks back
    socket.on("tasks", (value) => setTasks(value));
    return () => {
      socket.off("tasks");
    };
  }, [socket]);

  return (
    <>
      {!hasJoined ? (
        <Flex direction="column" height="100vh" justify="center" p={4}>
          <VStack>
            <Text textStyle="2xl">Quick Kanban</Text>
            <Input
              width="400px"
              placeholder="Type your username here..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              width="400px"
              placeholder="Type your room id here..."
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
            {error ? <Text color="red.500">{error}</Text> : null}

            <Button onClick={handleRegistration}>Join</Button>
          </VStack>
        </Flex>
      ) : (
        <Flex direction="column" height="100vh" overflow="hidden">
          <Box
            position="fixed"
            top={4}
            width="100%"
            zIndex="1000"
            bg="white"
            gap={4}
            p={4}
          >
            <VStack>
              <HStack align="start">
                <Text fontSize="md" fontWeight="semibold">
                  Username: {username}
                </Text>
                <Text fontSize="md" fontWeight="semibold">
                  Room Id: {roomId}
                </Text>
              </HStack>
              <HStack align="start">
                <Text animation="pulse 2s infinite" color="green.600">
                  Live Users:
                </Text>
                {users.map((item, key) => (
                  <Text key={key}>{item.username}</Text>
                ))}
              </HStack>
              <VStack align="start">
                <Input
                  width="400px"
                  placeholder="Add a title..."
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />
                <Input
                  width="400px"
                  placeholder="Add a description..."
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </VStack>
              <Button onClick={handleTaskSubmit}>Add Task</Button>
            </VStack>
          </Box>
          <Box mt="250px" flex="1" overflow="auto" px={4}>
            <Board />
          </Box>
        </Flex>
      )}
    </>
  );
}

export default Home;

import {
  VStack,
  Input,
  Button,
  Text,
  Flex,
  Box,
  HStack,
} from "@chakra-ui/react";
import { useState, useRef, useEffect } from "react";
import io from "socket.io-client";
import { keyframes } from "@emotion/react";
import Column from "../components/Column";
import AICopilotPanel from "@/components/AICopilotPanel";
import { ColorModeButton } from "@/components/ui/color-mode";

const apiURL = import.meta.env.VITE_API_URL_PROD;

const bounce = keyframes`0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); }`;

function Home() {
  const socketRef = useRef(null);
  const [board, setBoard] = useState(null);
  const [username, setUsername] = useState("");
  const [boardInput, setBoardInput] = useState("");
  const [boardId, setBoardId] = useState("");
  const [error, setError] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [users, setUsers] = useState([]);
  const [cursors, setCursors] = useState({});
  const [mode, setMode] = useState("join");
  const [newColumnName, setNewColumnName] = useState("");

  const handleJoin = async () => {
    if (!boardInput.trim()) {
      setError("Please enter a board ID");
      return;
    }
    try {
      const res = await fetch(`${apiURL}/boards/${boardInput}`);
      const data = await res.json();
      if (!data.success || data.board?._id === null)
        throw new Error("Board not found");

      const socket = io(apiURL, {
        autoConnect: false,
        auth: { username, boardId: data.board._id },
      });

      socketRef.current = socket;
      setBoardId(data.board._id);

      socket.on("connect", () => {
        socket.emit("board:join", { boardId: data.board._id, username });
        setBoard(data.board);
        setHasJoined(true);
      });

      socket.connect();
    } catch (err) {
      console.log(err);
      setError(err.message);
    }
  };

  const handleCreateBoard = async () => {
    try {
      const res = await fetch(`${apiURL}/boards/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardTitle: boardInput }),
      });
      const data = await res.json();
      if (!data.success && res.status === 409) {
        throw new Error("Board already exists");
      }
      if (!data.success || !data.board?._id)
        throw new Error("Board creation failed");

      await handleJoin();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateNewColumn = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${apiURL}/columns/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId: boardId, columnTitle: newColumnName }),
      });
    } catch (err) {
      setError(err);
    }
    setNewColumnName("");
  };

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleConnectError = (err) => setError(err.message);
    const handleError = (err) => setError(err);
    const handleBoard = (boardData) => {
      setBoard(boardData);
      setHasJoined(true);
      setError("");
    };
    const handleUsers = (allUsers) => {
      setUsers(allUsers);
    };
    const handleCursorUpdate = ({ username: uname, x, y }) => {
      if (uname !== username) {
        setCursors((prev) => ({ ...prev, [uname]: { x, y } }));
      }
    };
    const handleMouseMove = (e) => {
      socket.emit("cursor-move", {
        x: e.clientX,
        y: e.clientY,
        username,
      });
    };

    socket.on("connect_error", handleConnectError);
    socket.on("error", handleError);
    socket.on("board", handleBoard);
    socket.on("users", handleUsers);
    socket.on("cursor-update", handleCursorUpdate);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      socket.off("connect_error", handleConnectError);
      socket.off("error", handleError);
      socket.off("board", handleBoard);
      socket.off("users", handleUsers);
      socket.off("cursor-update", handleCursorUpdate);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [hasJoined, username, boardId]);

  return (
    <Flex
      direction="column"
      minH="100vh"
      bg="gray.50"
      _dark={{ bg: "gray.900" }}
    >
      {hasJoined && (
        <Box
          position="sticky"
          top="0"
          zIndex={20}
          bg="gray.50"
          _dark={{ bg: "gray.900", borderColor: "gray.700" }}
          px={4}
          py={3}
          borderBottom="1px solid"
          borderColor="gray.200"
        >
          <Flex
            direction={{ base: "column", md: "row" }}
            align="center"
            justify="space-between"
            gap={3}
            wrap="wrap"
          >
            <HStack spacing={3} align="center">
              <Text fontWeight="semibold" _dark={{ color: "gray.100" }}>
                Room ID: {boardInput}
              </Text>
              <Box
                w="10px"
                h="10px"
                borderRadius="full"
                bg="green.400"
                animation={`${bounce} 1s infinite`}
              />
              <Text fontWeight="semibold" _dark={{ color: "gray.100" }}>
                Live Users:
              </Text>
              {users.map((u, i) => (
                <Text key={i} _dark={{ color: "gray.200" }}>
                  {u}
                </Text>
              ))}
            </HStack>
            <Flex
              gap={2}
              wrap="wrap"
              align="center"
              justify="flex-end"
              w="full"
            >
              <ColorModeButton />

              <form
                onSubmit={handleCreateNewColumn}
                style={{ display: "flex", gap: "0.5rem" }}
              >
                <Input
                  size="sm"
                  placeholder="Create new column"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  bg="white"
                  _dark={{ bg: "gray.700", color: "white" }}
                />
                <Button
                  size="sm"
                  type="submit"
                  colorScheme="blackAlpha"
                  _dark={{
                    bg: "gray.700",
                    color: "white",
                    _hover: { bg: "gray.600" },
                  }}
                >
                  Add Column
                </Button>
              </form>

              <Button
                size="sm"
                colorScheme="red"
                _dark={{
                  bg: "red.500",
                  color: "white",
                  _hover: { bg: "red.400" },
                }}
                onClick={() => {
                  socketRef.current?.disconnect();
                  socketRef.current = null;
                  setBoard(null);
                  setHasJoined(false);
                  setBoardId("");
                  setCursors({});
                  setUsers([]);
                }}
              >
                Leave
              </Button>
            </Flex>
          </Flex>
        </Box>
      )}

      {!hasJoined ? (
        <VStack spacing={4} w="full" maxW="320px" mx="auto" mt={12}>
          <Text fontSize="3xl" fontWeight="bold" _dark={{ color: "white" }}>
            QuickKanban
          </Text>
          <Text fontSize="md" color="gray.500" _dark={{ color: "gray.400" }}>
            Join or Create a Board
          </Text>
          <HStack w="full" spacing={2}>
            <Button
              flex={1}
              size="sm"
              variant={mode === "join" ? "solid" : "outline"}
              onClick={() => setMode("join")}
            >
              Join
            </Button>
            <Button
              flex={1}
              size="sm"
              variant={mode === "create" ? "solid" : "outline"}
              onClick={() => setMode("create")}
            >
              Create
            </Button>
          </HStack>
          <Input
            size="sm"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            bg="white"
            _dark={{ bg: "gray.800", color: "white" }}
          />
          <Input
            size="sm"
            placeholder="Enter board name"
            value={boardInput}
            onChange={(e) => setBoardInput(e.target.value)}
            bg="white"
            _dark={{ bg: "gray.800", color: "white" }}
          />
          <Button
            size="sm"
            onClick={mode === "join" ? handleJoin : handleCreateBoard}
            colorScheme="blackAlpha"
            w="full"
            _dark={{
              bg: "gray.700",
              color: "white",
              _hover: { bg: "gray.600" },
            }}
          >
            {mode === "join" ? "Join Board" : "Create Board"}
          </Button>
          {error && (
            <Text color="red.500" fontSize="sm">
              {error}
            </Text>
          )}
        </VStack>
      ) : (
        <Flex direction="row" w="full" flex={1}>
          <Box
            flex="1"
            overflowX="auto"
            p={4}
            pb={{ base: "45vh", md: 4 }}
            bg="gray.50"
            _dark={{ bg: "gray.900" }}
          >
            <Flex wrap="wrap" gap={4} align="start">
              {board.columns.map((col) => (
                <Column
                  key={col._id}
                  columnId={col._id}
                  title={col.title}
                  tasks={col.tasks}
                  handleUpdateColumn={async ({ columnTitle, columnId }) => {
                    await fetch(`${apiURL}/columns/${columnId}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ columnTitle, boardId }),
                    });
                  }}
                  onAddTask={async ({
                    title,
                    description,
                    priority,
                    labels,
                  }) => {
                    await fetch(`${apiURL}/tasks/`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title,
                        description,
                        priority: priority === "" ? undefined : priority,
                        labels,
                        user: username,
                        columnId: col._id,
                        boardId,
                      }),
                    });
                  }}
                  onDeleteTask={async (taskId) => {
                    await fetch(`${apiURL}/tasks/${taskId}`, {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                    });
                  }}
                  onMoveTask={async (toCol, taskId) => {
                    await fetch(`${apiURL}/tasks/${taskId}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        boardId: boardId,
                        columnId: toCol,
                      }),
                    });
                  }}
                  onDeleteColumn={async () => {
                    await fetch(`${apiURL}/columns/${col._id}`, {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                    });
                  }}
                  onTaskUpdate={async ({
                    taskId,
                    title,
                    description,
                    priority,
                    labels,
                  }) => {
                    await fetch(`${apiURL}/tasks/${taskId}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title,
                        description,
                        priority: priority === "" ? undefined : priority,
                        labels,
                        columnId: col._id,
                        boardId: boardId,
                      }),
                    });
                  }}
                />
              ))}
            </Flex>
          </Box>

          <AICopilotPanel
            onSendQuery={async (
              query,
              handleStreamUpdate,
              handleStreaming,
              handleLoading
            ) => {
              const res = await fetch(`${apiURL}/query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  uid: socketRef.current.id,
                  boardId: boardId,
                  query: query,
                }),
              });
              if (!res.body) {
                handleStreamUpdate("No stream available");
                return;
              }
              const reader = res.body.getReader();
              const decoder = new TextDecoder();
              handleLoading(false);
              while (true) {
                const { done, value } = await reader.read();
                if (done) {
                  break;
                }
                const chunk = decoder.decode(value, { stream: true });
                handleStreamUpdate(chunk);
              }
            }}
          />
        </Flex>
      )}

      {Object.entries(cursors).map(([uname, pos]) => {
        if (!users.includes(uname)) return;
        return (
          <Box
            key={uname}
            position="fixed"
            top={pos.y}
            left={pos.x}
            bg="gray.700"
            color="white"
            _dark={{ bg: "gray.200", color: "black" }}
            px={2}
            py={1}
            fontSize="xs"
            borderRadius="md"
            pointerEvents="none"
            transform="translate(-50%, -100%)"
            zIndex={9999}
          >
            {uname}
          </Box>
        );
      })}
    </Flex>
  );
}

export default Home;

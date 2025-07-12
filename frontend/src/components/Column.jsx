import { useState, useRef, useEffect } from "react";
import { VStack, Text, Flex, Input, Button, Box } from "@chakra-ui/react";
import { HiTrash } from "react-icons/hi";
import Task from "./Task";

function Column({
  columnId,
  title,
  tasks,
  handleUpdateColumn,
  onAddTask,
  onDeleteTask,
  onMoveTask,
  onDeleteColumn,
  onTaskUpdate,
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [labels, setLabels] = useState([]);

  const formRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    if (data.fromColumn !== columnId) {
      onMoveTask(columnId, data.taskId);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleNewTask = () => {
    if (!newTask.trim()) return;
    onAddTask({
      title: newTask.trim(),
      description,
      priority,
      labels,
    });
    setNewTask("");
    setDescription("");
    setPriority("");
    setLabels([]);
    setShowForm(false);
  };

  const addLabel = () => {
    if (labelInput && !labels.includes(labelInput)) {
      setLabels([...labels, labelInput]);
      setLabelInput("");
    }
  };

  const removeLabel = (labelToRemove) => {
    setLabels(labels.filter((label) => label !== labelToRemove));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        setShowForm(false);
      }
    };
    if (showForm) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showForm]);

  return (
    <VStack
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      bg="gray.50"
      border="1px solid"
      borderColor="gray.200"
      p={3}
      borderRadius="lg"
      w={["100%", "260px"]}
      flexShrink={0}
      flexGrow={0}
      align="stretch"
      spacing={4}
      boxShadow="xs"
      overflow="hidden"
    >
      <Flex justify="space-between" align="center" w="full" mb={1} py={1}>
        {isEditingTitle ? (
          <Input
            size="sm"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onBlur={async () => {
              if (newTitle.trim() && newTitle !== title) {
                await handleUpdateColumn({
                  columnTitle: newTitle,
                  columnId: columnId,
                });
              }
              setIsEditingTitle(false);
            }}
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                e.target.blur();
              }
            }}
            autoFocus
          />
        ) : (
          <Text
            fontWeight="semibold"
            fontSize="md"
            color="black"
            cursor="pointer"
            onClick={() => {
              setNewTitle(title);
              setIsEditingTitle(true);
            }}
          >
            {title}
          </Text>
        )}
        <Button
          onClick={() => onDeleteColumn(columnId)}
          variant="ghost"
          size="sm"
          colorPalette="black"
        >
          <HiTrash />
        </Button>
      </Flex>

      <VStack spacing={2} align="stretch">
        {tasks.map((task, index) => {
          return (
            <Task
              key={task._id || index}
              _id={task._id}
              {...task}
              onDelete={() => onDeleteTask(task._id)}
              onUpdate={onTaskUpdate}
            />
          );
        })}
      </VStack>

      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          size="sm"
          variant="ghost"
          colorScheme="black"
          w="full"
        >
          + Add Task
        </Button>
      ) : (
        <VStack
          ref={formRef}
          spacing={2}
          align="stretch"
          bg="gray.50"
          borderRadius="md"
          p={3}
          w="full"
          boxShadow="sm"
        >
          <Input
            size="sm"
            bg="gray.100"
            placeholder="Task title"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <Input
            size="sm"
            bg="gray.100"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Flex gap={2} wrap="wrap">
            {["low", "medium", "high"].map((level) => (
              <Button
                key={level}
                size="xs"
                variant={priority === level ? "solid" : "outline"}
                onClick={() => setPriority(level)}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Button>
            ))}
          </Flex>

          <Flex
            direction={{ base: "column", sm: "row" }}
            gap={2}
            align="stretch"
          >
            <Input
              size="sm"
              bg="gray.100"
              placeholder="Add label"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addLabel()}
            />
          </Flex>

          <Box
            maxH={{ base: "80px", sm: "100px" }}
            overflowY="auto"
            overflowX="hidden"
            w="full"
          >
            <Flex
              wrap="wrap"
              gap={2}
              align="start"
              w="full"
              maxW="100%"
              minW={0}
            >
              {labels.map((label) => (
                <Flex
                  key={label}
                  px={2}
                  py={1}
                  bg="gray.300"
                  borderRadius="md"
                  fontSize="xs"
                  align="center"
                  maxW="100%"
                >
                  <Text mr={2} isTruncated>
                    {label}
                  </Text>
                  <Button size="xs" onClick={() => removeLabel(label)}>
                    x
                  </Button>
                </Flex>
              ))}
            </Flex>
          </Box>

          <Button
            onClick={handleNewTask}
            size="sm"
            variant="solid"
            colorScheme="black"
            w="full"
          >
            Add Task
          </Button>
        </VStack>
      )}
    </VStack>
  );
}

export default Column;

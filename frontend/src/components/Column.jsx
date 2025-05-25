import { useState } from "react";
import { VStack, Text, Flex, Input, Button } from "@chakra-ui/react";
import { HiTrash } from "react-icons/hi";
import Task from "./Task";

function Column({
  columnId,
  title,
  tasks,
  onAddTask,
  onDeleteTask,
  onMoveTask,
  onDeleteColumn,
}) {
  const [newTask, setNewTask] = useState("");
  const handleDrop = (e) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    if (data.fromColumn !== columnId) {
      onMoveTask(data.fromColumn, columnId, data.taskId);
    }
  };

  // needed to allow drops
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleNewTask = () => {
    if (!newTask.trim()) return;
    onAddTask(newTask.trim());
    setNewTask("");
  };
  return (
    <VStack
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      bg="gray.100"
      p={4}
      borderRadius="md"
      minW="350px"
      maxW="275px"
      align="stretch"
      spacing={3}
    >
      <Flex justify="space-between" align="center" w="full" mb={2}>
        <Text fontWeight="bold" fontSize="xl">
          {title}
        </Text>
        <Button
          onClick={() => onDeleteColumn(columnId)}
          variant="ghost"
          color="red.300"
        >
          <HiTrash />
        </Button>
      </Flex>
      {tasks.map((task) => (
        <Task
          key={task._id}
          taskId={task._id}
          columnId={columnId}
          title={task.title}
          user={task.user}
          onDelete={() => onDeleteTask(task._id)}
        />
      ))}
      <Flex p={2} m={2} gap={2}>
        <Input
          flex="1"
          placeholder="Add a task"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
        />
        <Button
          onClick={handleNewTask}
          variant="surface"
          color="green"
          animation="pulse"
        >
          Add
        </Button>
      </Flex>
    </VStack>
  );
}

export default Column;

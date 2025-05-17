import { VStack, Text } from "@chakra-ui/react";

function Task({ taskItem, onDragStart }) {
  return (
    <VStack
      width={250}
      bg="gray.50"
      p={4}
      draggable
      onDragStart={(e) => onDragStart(e, taskItem)}
    >
      <Text textStyle="md">{taskItem.title}</Text>
      <Text textStyle="sm">{taskItem.description}</Text>
      <Text textStyle="xs">Created By: {taskItem.user}</Text>
    </VStack>
  );
}

export default Task;

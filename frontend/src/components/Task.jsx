import { useState } from "react";
import { Flex, Text, CloseButton, VStack } from "@chakra-ui/react";

function Task({ taskId, title, user, onDelete, columnId }) {
  const [isDragging, setIsDragging] = useState(false);
  const handleDragStart = (e) => {
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ taskId: taskId, fromColumn: columnId })
    );
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };
  return (
    <Flex
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      justify="space-between"
      p={3}
      bg="white"
      borderRadius="md"
      boxShadow="sm"
      opacity={isDragging ? 0.6 : 1}
      w="100%"
      maxW="100%"
      overflow="hidden"
      align="flex-start"
    >
      <VStack align="start" spacing={1} maxW="85%" flex="1">
        <Text whiteSpace="normal" workdBreak="break-word" maxW="100%">
          {title}
        </Text>
        <Text fontSize="sm" fontWeight="semibold" color="gray.400">
          Changed: {user}
        </Text>
      </VStack>
      <CloseButton size="sm" variant="ghost" onClick={onDelete} />
    </Flex>
  );
}

export default Task;

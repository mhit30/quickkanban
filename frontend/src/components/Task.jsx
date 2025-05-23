import { Flex, Text, CloseButton } from "@chakra-ui/react";
function Task({ taskId, title, onDelete, columnId }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ taskId, fromColumn: columnId })
    );
  };
  return (
    <Flex
      draggable="true"
      onDragStart={handleDragStart}
      justify="space-between"
      align="center"
      p={3}
      bg="white"
      borderRadius="md"
      boxShadow="sm"
    >
      <Text>{title}</Text>
      <CloseButton size="sm" variant="ghost" onClick={onDelete} />
    </Flex>
  );
}

export default Task;

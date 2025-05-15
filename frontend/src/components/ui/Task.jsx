import { Button, Box, Flex, Text } from "@chakra-ui/react";

function Task({ taskItem }) {
  return (
    <Flex align="center" justify="space-between" bg="gray.50" p={4} gap={6}>
      <Button color="red.400">Trash</Button>
      <Box width={400}>
        <Text textStyle="md">{taskItem.title}</Text>
        <Text textStyle="sm">{taskItem.description}</Text>
        <Text textStyle="xs">Created By: {taskItem.user}</Text>
      </Box>
    </Flex>
  );
}

export default Task;

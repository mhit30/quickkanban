import { Flex, VStack, Text, StackSeparator } from "@chakra-ui/react";
import Task from "./Task";
import { useState } from "react";

export default function Board() {
  const [columns, setColumns] = useState({
    "column-1": {
      id: "column-1",
      title: "To Do",
      tasks: [
        { id: "1", title: "hell1o", description: "this is desc", user: "mhit" },
        { id: "2", title: "hello", description: "this is desc", user: "mhit" },
      ],
    },
    "column-2": { id: "column-2", title: "In Progress", tasks: [] },
    "column-3": { id: "column-3", title: "Done", tasks: [] },
  });

  const [columnOrder, setColumnOrder] = useState([
    "column-1",
    "column-2",
    "column-3",
  ]);
  const [draggedTask, setDraggedTask] = useState(null);

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
  };

  const handleDrop = (e, targetColId) => {
    e.preventDefault();

    if (!draggedTask) return;

    const newColumns = { ...columns };

    for (const col of Object.values(newColumns)) {
      // for each column, assign tasks to everything except dragged task
      col.tasks = col.tasks.filter((t) => t.id !== draggedTask.id);
    }

    newColumns[targetColId].tasks.push(draggedTask);

    setColumns(newColumns);
    setDraggedTask(null);
  };
  return (
    <Flex justify="center" gap={4}>
      {columnOrder.map((colId) => {
        const column = columns[colId];
        const tasks = column.tasks;
        return (
          <VStack
            key={colId}
            bg="gray.400"
            p={4}
            minW="250px"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, colId)}
          >
            <Text fontWeight="bold">{column.title}</Text>
            <VStack
              separator={<StackSeparator />}
              align="stretch"
              spacing={4}
              overflow="auto"
            >
              {tasks.length == 0 ? (
                <Text textStyle="md">No tasks for now</Text>
              ) : (
                tasks.map((item) => (
                  <Task
                    taskItem={item}
                    key={item.id}
                    onDragStart={handleDragStart}
                  />
                ))
              )}
            </VStack>
          </VStack>
        );
      })}
    </Flex>
  );
}

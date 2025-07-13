import { useState, useRef, useEffect } from "react";
import {
  Flex,
  Text,
  CloseButton,
  VStack,
  Badge,
  Wrap,
  WrapItem,
  Box,
  Input,
  Button,
} from "@chakra-ui/react";

function Task({
  _id: taskId,
  user,
  onDelete,
  onUpdate,
  columnId,
  boardId,
  createdAt,
  description,
  isFinished,
  labels,
  priority,
  title,
  updatedAt,
}) {
  const wrapperRef = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [editedDescription, setEditedDescription] = useState(description || "");
  const [editedPriority, setEditedPriority] = useState(priority || "");
  const [editedLabels, setEditedLabels] = useState(labels || []);
  const [labelInput, setLabelInput] = useState("");

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

  const handleSaveEdit = async () => {
    if (!editedTitle.trim()) return;
    await onUpdate({
      taskId,
      title: editedTitle.trim(),
      description: editedDescription.trim(),
      priority: editedPriority,
      labels: editedLabels,
    });
    setIsEditing(false);
  };

  const addLabel = () => {
    const trimmed = labelInput.trim();
    if (trimmed && !editedLabels.includes(trimmed)) {
      setEditedLabels([...editedLabels, trimmed]);
      setLabelInput("");
    }
  };

  const removeLabel = (labelToRemove) => {
    setEditedLabels(editedLabels.filter((l) => l !== labelToRemove));
  };

  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsEditing(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing]);

  return (
    <Flex
      ref={wrapperRef}
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      p={3}
      bg="gray.100"
      _dark={{
        bg: "gray.700",
        borderColor: "gray.600",
        _hover: { bg: "gray.600" },
      }}
      borderRadius="md"
      boxShadow="sm"
      opacity={isDragging ? 0.6 : 1}
      w="100%"
      maxW="100%"
      overflow="hidden"
      align="flex-start"
      border="1px solid"
      borderColor="gray.200"
      _hover={{ bg: "gray.150", boxShadow: "md" }}
      flexDirection="column"
      gap={2}
      transition="all 0.15s ease-in-out"
    >
      <Flex justify="space-between" align="start" w="full">
        <VStack align="start" spacing={1} flex={1}>
          {isEditing ? (
            <>
              <Input
                size="sm"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Title"
                autoFocus
                bg="white"
                _dark={{ bg: "gray.600", color: "white" }}
              />
              <Input
                size="xs"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Description"
                bg="white"
                _dark={{ bg: "gray.600", color: "white" }}
              />
              <Flex gap={2} mt={1}>
                {["low", "medium", "high"].map((level) => (
                  <Button
                    key={level}
                    size="xs"
                    variant={editedPriority === level ? "solid" : "outline"}
                    onClick={() => setEditedPriority(level)}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Button>
                ))}
              </Flex>

              <Flex mt={2} direction="column" gap={2}>
                <Input
                  size="xs"
                  placeholder="Add label"
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addLabel()}
                  bg="white"
                  _dark={{ bg: "gray.600", color: "white" }}
                />
                <Wrap spacing={2}>
                  {editedLabels.map((label, idx) => (
                    <WrapItem key={idx}>
                      <Flex
                        px={2}
                        py={0.5}
                        bg="gray.300"
                        _dark={{ bg: "gray.500", color: "white" }}
                        borderRadius="md"
                        fontSize="xs"
                        align="center"
                        gap={1}
                      >
                        <Text>{label}</Text>
                        <Button
                          size="2xs"
                          onClick={() => removeLabel(label)}
                          ml={1}
                        >
                          x
                        </Button>
                      </Flex>
                    </WrapItem>
                  ))}
                </Wrap>
              </Flex>

              <Button
                size="xs"
                mt={2}
                colorScheme="black"
                _dark={{
                  bg: "gray.600",
                  color: "white",
                  _hover: { bg: "gray.500" },
                }}
                onClick={handleSaveEdit}
              >
                Save
              </Button>
            </>
          ) : (
            <>
              <Text
                fontSize="sm"
                fontWeight="semibold"
                wordBreak="break-word"
                whiteSpace="normal"
                cursor="pointer"
                onClick={() => {
                  setIsEditing(true);
                  setEditedTitle(title);
                  setEditedDescription(description || "");
                  setEditedPriority(priority || "");
                  setEditedLabels(labels || []);
                }}
                color="gray.800"
                _dark={{ color: "gray.100" }}
              >
                {title}
              </Text>
              {description && (
                <Text
                  fontSize="xs"
                  color="gray.600"
                  _dark={{ color: "gray.300" }}
                  wordBreak="break-word"
                  cursor="pointer"
                  onClick={() => setIsEditing(true)}
                >
                  {description}
                </Text>
              )}
              <Text
                fontSize="xs"
                color="gray.500"
                _dark={{ color: "gray.400" }}
                onClick={() => setIsEditing(true)}
              >
                Changed: {user}
              </Text>
            </>
          )}
        </VStack>
        <CloseButton
          size="sm"
          variant="ghost"
          onClick={onDelete}
          alignSelf="start"
        />
      </Flex>

      {!isEditing && (
        <Flex justify="space-between" align="center" w="full" wrap="wrap">
          {priority && (
            <Badge
              fontSize="0.7em"
              colorScheme={
                priority === "high"
                  ? "red"
                  : priority === "medium"
                  ? "yellow"
                  : "green"
              }
              onClick={() => setIsEditing(true)}
            >
              {priority.toUpperCase()}
            </Badge>
          )}
          <Text
            fontSize="xs"
            color="gray.400"
            _dark={{ color: "gray.500" }}
            ml="auto"
          >
            {new Date(createdAt).toLocaleDateString()}
          </Text>
        </Flex>
      )}

      {!isEditing && labels?.length > 0 && (
        <Wrap spacing={2} mt={1}>
          {labels.map((label, idx) => {
            return (
              <WrapItem key={idx}>
                <Box
                  px={2}
                  py={0.5}
                  bg="gray.300"
                  _dark={{ bg: "gray.500", color: "white" }}
                  borderRadius="md"
                  fontSize="xs"
                >
                  {label}
                </Box>
              </WrapItem>
            );
          })}
        </Wrap>
      )}
    </Flex>
  );
}

export default Task;

import {
  Box,
  VStack,
  Text,
  Textarea,
  Input,
  Button,
  Spinner,
  useBreakpointValue,
} from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/atom-one-dark.css";
import { useState } from "react";

function AICopilotPanel({ onSendQuery }) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);

  const isMobile = useBreakpointValue({ base: true, md: false });

  const handleStreamUpdate = (chunk) => {
    setResponse((prev) => prev + chunk);
  };

  const handleLoading = (isLoading) => {
    setLoading(isLoading);
  };
  const handleStreaming = (isStreaming) => {
    setStreaming(isStreaming);
  };
  const handleSend = async () => {
    if (!query.trim()) return;
    setStreaming(true);
    setLoading(true);
    setQuery("");
    setResponse("");
    try {
      await onSendQuery(
        query,
        handleStreamUpdate,
        handleStreaming,
        handleLoading
      );
      setQuery("");
    } catch {
      setResponse("Error fetching response.");
    }
  };

  return (
    <Box
      position={isMobile ? "fixed" : "sticky"}
      bottom={isMobile ? 0 : undefined}
      top={isMobile ? undefined : 0}
      w={isMobile ? "100%" : { md: "380px", lg: "480px" }}
      minW={isMobile ? "100%" : { md: "320px", lg: "360px" }}
      h={isMobile ? "40vh" : "100vh"}
      bg="gray.100"
      borderTop={isMobile ? "1px solid" : "none"}
      borderLeft={isMobile ? "none" : "1px solid"}
      borderColor="gray.200"
      zIndex={10}
      display="flex"
      flexDirection="column"
    >
      {!isMobile && (
        <Box px={4} pt={4} pb={2}>
          <Text fontSize="xl" fontWeight="bold">
            Kanban Assistant
          </Text>
          <Text fontSize="sm" color="gray.600">
            Ask for help, summaries, or task ideas.
          </Text>
        </Box>
      )}

      <Box
        flex="1"
        overflowY="auto"
        px={4}
        py={2}
        fontSize="sm"
        color="gray.800"
        whiteSpace="pre-wrap"
      >
        {loading ? (
          <Spinner />
        ) : response !== "" ? (
          <ReactMarkdown
            children={response || "Loading..."}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          />
        ) : streaming ? (
          <Spinner />
        ) : (
          <Text>Kanban Assistant responses will appear here</Text>
        )}
      </Box>

      <Box
        position="sticky"
        bottom={0}
        bg="gray.100"
        px={4}
        py={3}
        borderTop="1px solid"
        borderColor="gray.200"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <VStack spacing={2} align="stretch">
            <Input
              size="sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask something..."
              bg="white"
            />
            <Button
              size="sm"
              type="submit"
              loading={loading}
              colorPalette="black"
            >
              Send
            </Button>
          </VStack>
        </form>
      </Box>
    </Box>
  );
}

export default AICopilotPanel;

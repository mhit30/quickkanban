// Your Toaster.jsx (or whatever file this custom Toaster component is in)
function _optionalChain(ops) {
  let lastAccessLHS = undefined;
  let value = ops[0];
  let i = 1;
  while (i < ops.length) {
    const op = ops[i];
    const fn = ops[i + 1];
    i += 2;
    if ((op === "optionalAccess" || op === "optionalCall") && value == null) {
      return undefined;
    }
    if (op === "access" || op === "optionalAccess") {
      lastAccessLHS = value;
      value = fn(value);
    } else if (op === "call" || op === "optionalCall") {
      value = fn((...args) => value.call(lastAccessLHS, ...args));
      lastAccessLHS = undefined;
    }
  }
  return value;
}
("use client");

import {
  Toaster as ChakraToaster,
  Portal,
  Spinner,
  Stack,
  Toast,
  createToaster,
  Button, // Import Button and Flex here for rendering actions
  Flex,
  Box, // For wrapping actions
} from "@chakra-ui/react";

export const toaster = createToaster({
  placement: "bottom-end",
  pauseOnPageIdle: true,
});

export const CustomToaster = () => {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
        {(toast) => (
          <Toast.Root width={{ md: "sm" }}>
            {toast.type === "loading" ? (
              <Spinner size="sm" color="blue.solid" />
            ) : (
              <Toast.Indicator />
            )}
            <Stack gap="1" flex="1" maxWidth="100%">
              {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
              {toast.description && (
                <Toast.Description>{toast.description}</Toast.Description>
              )}
            </Stack>

            {/* Check for a custom 'actions' array */}
            {toast.actions &&
            Array.isArray(toast.actions) &&
            toast.actions.length > 0 ? (
              <Flex gap="2" ml="auto">
                {/* ml='auto' pushes actions to the right */}
                {toast.actions.map((action, index) => (
                  <Button
                    key={index}
                    size="sm"
                    colorPalette={action.colorPalette} // Allow custom color scheme
                    onClick={() => {
                      if (action.onClick) action.onClick();

                      if (toast.duration !== null) toaster.dismiss(toast.id);
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </Flex>
            ) : (
              // Fallback for single action (your existing logic)
              toast.action && (
                <Toast.ActionTrigger onClick={toast.action.onClick}>
                  {toast.action.label}
                </Toast.ActionTrigger>
              )
            )}

            {_optionalChain([
              toast,
              "access",
              (_) => _.meta,
              "optionalAccess",
              (_2) => _2.closable,
            ]) && <Toast.CloseTrigger />}
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  );
};

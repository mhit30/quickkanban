import { z } from "zod";

export const QuerySchema = z.object({
  uid: z.string(),
  boardId: z.string(),
  query: z.string().min(1, { message: "Query is required." }),
});

import { z } from "zod";

export const BoardSchema = z.object({
  boardTitle: z.string(),
});

export const BoardUpdateSchema = z.object({
  boardTitle: z.string(),
});

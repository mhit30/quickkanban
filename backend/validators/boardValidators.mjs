import { z } from "zod";

export const BoardSchema = z.object({
  boardTitle: z.string().min(1, { message: "Board title is required." }),
});

export const BoardUpdateSchema = z.object({
  boardTitle: z
    .string()
    .min(1, { message: "Updated board title cannot be empty." }),
});

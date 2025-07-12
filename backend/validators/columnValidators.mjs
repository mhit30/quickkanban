import { z } from "zod";

export const ColumnSchema = z.object({
  boardId: z.string(),
  columnTitle: z.string().min(1, { message: "Column title is required." }),
});

export const ColumnUpdateSchema = z.object({
  boardId: z.string().optional(),
  columnTitle: z.string().min(1, { message: "Column title is required." }),
});

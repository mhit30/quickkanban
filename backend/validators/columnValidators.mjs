import { z } from "zod";

export const ColumnSchema = z.object({
  boardId: z.string(),
  columnTitle: z.string(),
});

export const ColumnUpdateSchema = z.object({
  boardId: z.string().optional(),
  columnTitle: z.string(),
});

import { z } from "zod";
export const TaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.string().optional(),
  labels: z.string().optional(),
  isFinished: z.boolean(),
  user: z.string(),
  columnId: z.string(),
  boardId: z.string(),
});

export const TaskUpdateSchema = TaskSchema.pick({
  title: true,
  description: true,
  labels: true,
  priority: true,
  isFinished: true,
}).partial();

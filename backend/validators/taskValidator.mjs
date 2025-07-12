import { z } from "zod";

export const TaskSchema = z.object({
  title: z.string().min(1, { message: "Task title is required." }),
  description: z.string().optional(),

  priority: z
    .enum(["low", "medium", "high"], {
      errorMap: () => ({
        message: "Priority must be 'low', 'medium', or 'high'.",
      }),
    })
    .optional(),

  labels: z
    .array(z.string().min(1, { message: "Labels cannot be empty strings." }))
    .optional()
    .default([]),

  isFinished: z.boolean().optional(),
  user: z.string().optional(),
  columnId: z.string().optional(),
  boardId: z.string().optional(),
});

export const TaskUpdateSchema = TaskSchema.pick({
  title: true,
  description: true,
  labels: true,
  priority: true,
  isFinished: true,
  columnId: true,
  boardId: true,
}).partial();

import { z } from 'zod';

export const createPersonSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(60, 'Name must be 60 characters or less'),
});

export type CreatePersonForm = z.infer<typeof createPersonSchema>;

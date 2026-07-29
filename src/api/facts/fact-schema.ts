import { z } from 'zod';

export const createFactSchema = z.object({
  person_id: z.uuid('Invalid person ID'),
  label: z
    .string()
    .trim()
    .min(1, 'Label cannot be empty')
    .max(100, 'Label must be 100 characters or less')
    .nullish(),
  value: z
    .string()
    .trim()
    .min(1, 'Value is required')
    .max(500, 'Value must be 500 characters or less'),
});

export const updateFactSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, 'Label cannot be empty')
    .max(100, 'Label must be 100 characters or less')
    .nullish(),
  value: z
    .string()
    .trim()
    .min(1, 'Value is required')
    .max(500, 'Value must be 500 characters or less')
    .optional(),
});

export type CreateFactForm = z.infer<typeof createFactSchema>;
export type UpdateFactForm = z.infer<typeof updateFactSchema>;

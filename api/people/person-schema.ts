import { z } from 'zod';

export const createPersonSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(60, 'Name must be 60 characters or less'),
});

// Service-side validation for the avatar column: a bare file name
// produced by saveAvatarFile(), never a path or URI.
export const avatarFileSchema = z
  .string()
  .regex(/^[\w.-]+$/, 'Avatar must be a file name')
  .nullable();

export type CreatePersonForm = z.infer<typeof createPersonSchema>;

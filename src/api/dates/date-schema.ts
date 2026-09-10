import { z } from 'zod';

const storedDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((date) => {
    const [year, month, day] = date.split('-').map(Number);
    // 0001 is a month/day sentinel, so allow February 29 regardless of year.
    const calendarYear = year === 1 ? 2000 : year;
    const leap =
      calendarYear % 4 === 0 &&
      (calendarYear % 100 !== 0 || calendarYear % 400 === 0);
    const daysInMonth = [
      31,
      leap ? 29 : 28,
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31,
    ];
    return (
      year >= 1 &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= daysInMonth[month - 1]
    );
  }, 'Invalid date');

export const createDateSchema = z.object({
  person_id: z.uuid('Invalid person ID'),
  label: z
    .string()
    .trim()
    .min(1, 'Label is required')
    .max(100, 'Label must be 100 characters or less'),
  date: storedDateSchema,
});

export const updateDateSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, 'Label is required')
    .max(100, 'Label must be 100 characters or less')
    .optional(),
  date: storedDateSchema.optional(),
});

export type CreateDateForm = z.infer<typeof createDateSchema>;
export type UpdateDateForm = z.infer<typeof updateDateSchema>;

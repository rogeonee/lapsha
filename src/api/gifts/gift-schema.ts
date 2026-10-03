import { z } from 'zod';

export const giftStatusSchema = z.enum(['idea', 'bought', 'given']);
const optionalText = (limit: number) =>
  z
    .string()
    .trim()
    .max(limit)
    .nullable()
    .transform((text) => text || null);

export const giftFieldsSchema = z
  .object({
    title: optionalText(200),
    note: optionalText(1000),
    url: z
      .url({ protocol: /^https?$/, error: 'Use a valid http or https link' })
      .max(2048)
      .nullable(),
    photo: z
      .string()
      .regex(/^[\w-]+\.jpg$/, 'Invalid photo file')
      .nullable()
      .default(null),
    status: giftStatusSchema,
    given_on: z.iso.date().nullable().default(null),
  })
  .refine(
    (gift) => Boolean(gift.title || gift.note || gift.url || gift.photo),
    {
      message: 'Add a photo, a thought, or a link',
      path: ['title'],
    },
  );
export const createGiftSchema = giftFieldsSchema.safeExtend({
  person_id: z.uuid().nullable(),
  id: z.uuid().optional(),
});
export type GiftFields = z.infer<typeof giftFieldsSchema>;
export type GiftInput = z.input<typeof giftFieldsSchema>;
export type GiftStatus = z.infer<typeof giftStatusSchema>;
export type Gift = GiftFields & {
  id: string;
  person_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
export const giftStatusLabels: Record<GiftStatus, string> = {
  idea: 'Idea',
  bought: 'Bought',
  given: 'Given',
};

export function normalizeGiftUrl(value: string): string | null {
  const url = value.trim();
  return url
    ? /^[a-z][a-z\d+.-]*:/i.test(url)
      ? url
      : `https://${url}`
    : null;
}

export function giftDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Open link';
  }
}

export function giftLabel(gift: Gift): string {
  return (
    gift.title || gift.note || (gift.url ? giftDomain(gift.url) : 'Photo idea')
  );
}

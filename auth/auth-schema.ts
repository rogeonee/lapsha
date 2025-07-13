import { z } from 'zod';

// email validation
const emailSchema = z.email('Please enter a valid email address');

// password validation
const passwordSchema = z
  .string()
  .min(1, 'Password is required')
  .min(6, 'Password must be at least 6 characters');

// name validation
const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .min(2, 'Name must be at least 2 characters');

// phone validation (optional)
const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .optional()
  .or(z.literal(''));

// sign in schema
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// sign up schema
export const signUpSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    phone: phoneSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// forgot password schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// type definitions
export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number format'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, 'Email or phone identifier is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export type SignupInput = z.infer<typeof signupSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshInput = z.infer<typeof refreshSchema>['body'];

import { z } from "zod";



export const signInCodeSchema = z.object({
  code: z.string().min(6).max(6),
});

export const SignInSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
  password: z
    .string()
    .min(8, { message: 'Be at least 8 characters long' })
    .regex(/[a-zA-Z]/, { message: 'Contain at least one letter.' })
    .regex(/[0-9]/, { message: 'Contain at least one number.' })
    .regex(/[^a-zA-Z0-9]/, {
      message: 'Contain at least one special character.',
    })
    .trim(),
});

export type SignInFormData = z.infer<typeof SignInSchema>;


export const SignUpSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters long.' })
    .trim(),
  email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
  password: z
    .string()
    .min(8, { message: 'Be at least 8 characters long' })
    .regex(/[a-zA-Z]/, { message: 'Contain at least one letter.' })
    .regex(/[0-9]/, { message: 'Contain at least one number.' })
    .regex(/[^a-zA-Z0-9]/, {
      message: 'Contain at least one special character.',
    })
    .trim(),
})

export const CustomerSchema = z.object({
  fullName: z
  .string()
  .min(2, { message: 'Name must be at least 2 characters long.' })
  .trim(),
  email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
  phone: z.string().trim(),
})
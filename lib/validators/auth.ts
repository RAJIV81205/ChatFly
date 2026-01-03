import { z } from "zod";

export const signupSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and _"),

  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(50, "Full name is too long"),

  email: z
    .string()
    .email("Invalid email address"),

  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export type SignupInput = z.infer<typeof signupSchema>;

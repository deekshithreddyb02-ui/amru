import { z } from "zod";

// Username: lowercase letters, digits, underscore/dot, 3-30 chars.
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be 30 characters or fewer")
  .regex(/^[a-z0-9._]+$/, "Only lowercase letters, digits, dot and underscore");

// Phone: optional, digits with optional leading +, 7-15 digits (E.164-ish).
export const phoneSchema = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\+?[0-9\s\-]{7,20}$/.test(v), {
    message: "Enter a valid phone number (digits, +, - only)",
  });

// Temp password: min 8, at least one letter and one digit.
export const tempPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be 72 characters or fewer")
  .refine((v) => /[A-Za-z]/.test(v) && /[0-9]/.test(v), {
    message: "Password must include at least one letter and one digit",
  });

export const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address");

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Full name is required")
  .max(100, "Full name is too long");

export type CreateEmployeeFields = {
  email: string;
  fullName: string;
  username: string;
  phone: string;
  tempPassword: string;
};

export type FieldErrors = Partial<Record<keyof CreateEmployeeFields, string>>;

export function validateCreateEmployee(fields: CreateEmployeeFields): FieldErrors {
  const errors: FieldErrors = {};
  const email = emailSchema.safeParse(fields.email);
  if (!email.success) errors.email = email.error.issues[0].message;

  const name = fullNameSchema.safeParse(fields.fullName);
  if (!name.success) errors.fullName = name.error.issues[0].message;

  const u = usernameSchema.safeParse(fields.username);
  if (!u.success) errors.username = u.error.issues[0].message;

  const p = phoneSchema.safeParse(fields.phone);
  if (!p.success) errors.phone = p.error.issues[0].message;

  const pwd = tempPasswordSchema.safeParse(fields.tempPassword);
  if (!pwd.success) errors.tempPassword = pwd.error.issues[0].message;

  return errors;
}

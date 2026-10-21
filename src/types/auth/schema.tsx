import * as z from "zod";

export const MIN_NEW_PASSWORD_LENGTH = 8;

/** Returns a message describing the first problem, or "" when the password is acceptable. */
export const validateNewPassword = (password: string, confirmation: string) => {
  if (password.length < MIN_NEW_PASSWORD_LENGTH) {
    return `Use at least ${MIN_NEW_PASSWORD_LENGTH} characters for your new password.`;
  }
  if (password !== confirmation) return "The passwords don't match.";
  return "";
};

export const AuthLoginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
});
export type AuthLoginType = z.infer<typeof AuthLoginSchema>;

/** International-style phone numbers: 10 to 15 digits with an optional leading +. */
export const PHONE_PATTERN = /^\+?\d{10,15}$/;

export const SignupSchema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required"),
    emailAddress: z
      .string()
      .min(1, "Email address is required")
      .email("Enter a valid email address"),
    phoneNumber: z
      .string()
      .min(1, "Mobile number is required")
      .refine(
        (value) => PHONE_PATTERN.test(value.replace(/[\s-]/g, "")),
        "Enter a valid mobile number, for example 0801 234 5678",
      ),
    department: z.string().min(1, "Select a department"),
    exam: z.string().min(1, "Select your class"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z
      .string()
      .min(6, "Confirm Password must be at least 6 characters long"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupSchemaType = z.infer<typeof SignupSchema>;

import * as z from "zod";
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

export const SignupSchema = z
  .object({
    fullName: z.string().min(1, "Institution name is required"),

    emailAddress: z.string().email().min(1, "Contact email is required"),
    phoneNumber: z.string().min(1, "Contact phone is required"),
    department: z.string().min(1, "Department is required"),
    exam: z.string().min(1, "Exam is required"),
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

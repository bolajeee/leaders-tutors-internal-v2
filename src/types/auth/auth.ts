export type AuthFormStepsType =
  | "login"
  | "resetPassword"
  | "verifyAccount"
  | "createPassword"
  | "signup";

export interface AuthResponse {
  token: string;
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  last_active: string; // ISO date string
  role: "Administrator" | "User" | "Manager" | string;
  status: "Active" | "Inactive" | "Suspended" | string;
  middle_name: string | null;
  // Enrollment fields returned at login — used to seed userEnrollment in the store
  departmentId?: string;
  departmentName?: string;
  examId?: string;
  examAbbreviation?: string;
}

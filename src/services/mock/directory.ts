/** Typed fixtures standing in for the preset-data endpoints in mock mode. */
export interface DropdownOption {
  value: string;
  label: string;
}

export const mockDepartments: DropdownOption[] = [
  { value: "basic", label: "Basic School" },
  { value: "junior", label: "Junior Secondary" },
  { value: "senior", label: "Senior Secondary" },
];

export const mockExams: DropdownOption[] = [
  { value: "basic-5", label: "Basic 5" },
  { value: "jss-2", label: "JSS 2" },
  { value: "sss-2", label: "SSS 2" },
];

export const mockPaymentMethods: DropdownOption[] = [
  { value: "CC", label: "Card payment (Paystack)" },
];

/** The verification code accepted by mock OTP screens (signup and recovery). */
export const MOCK_OTP = "123456";

/** An address the mock signup treats as already registered, to exercise the error state. */
export const MOCK_TAKEN_EMAIL = "taken@leaderstutors.com";

/** A password the mock login rejects, to exercise the error state. */
export const MOCK_WRONG_PASSWORD = "wrong-password";

export const labelFor = (options: DropdownOption[], value: string, fallback = "") =>
  options.find((option) => option.value === value)?.label ?? fallback;

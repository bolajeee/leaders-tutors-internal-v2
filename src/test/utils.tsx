import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useAuthStore } from "@/store/authStore";
import { useDemoStore, type DemoScenario } from "@/services/mock/demoStore";
import { queryClient as appQueryClient } from "@/lib/query-client";
import { resetNavigation } from "./navigation";
import MockCheckoutHost from "@/components/payment/MockCheckoutHost";

export const renderWithQuery = (ui: ReactElement) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } });
  return { client, ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>) };
};

export const resetAppState = () => {
  useAuthStore.setState({ user: null, token: null, userEnrollment: null });
  useDemoStore.getState().reset();
  appQueryClient.clear();
  resetNavigation();
};

/** Signs a demo student in with the given subscription scenario (mock mode). */
export const signInAs = (scenario: DemoScenario = "active") => {
  const email = scenario === "expired" ? "expired.student@leaderstutors.com" : "student@leaderstutors.com";
  useAuthStore.setState({
    token: "mock-session-test",
    user: {
      token: "mock-session-test",
      id: "demo-student",
      email,
      first_name: "Demo",
      last_name: "Student",
      phone_number: null,
      last_active: new Date().toISOString(),
      role: "Student",
      status: "Active",
      middle_name: null,
      departmentId: "basic",
      departmentName: "Basic School",
      examId: "basic-5",
      examAbbreviation: "Basic 5",
    },
    userEnrollment: {
      departmentId: "basic",
      departmentName: "Basic School",
      examId: "basic-5",
      examAbbreviation: "Basic 5",
      status: "active",
    },
  });
  useDemoStore.getState().seed(email, scenario);
  return email;
};

/** Renders UI beside the simulated Paystack checkout so payment flows can be driven. */
export const renderWithCheckout = (ui: ReactElement) =>
  renderWithQuery(
    <>
      {ui}
      <MockCheckoutHost />
    </>,
  );

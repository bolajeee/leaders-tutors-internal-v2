import { apiClient } from "@/lib/api-client";

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  cnewPassword: string;
}

export const changePassword = async (payload: ChangePasswordPayload) => {
  if (process.env.NEXT_PUBLIC_CURRICULUM_SOURCE !== "api") {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { success: true, message: "Password updated in local demo mode." };
  }
  const response = await apiClient.post<
    { success?: boolean; message?: string },
    ChangePasswordPayload
  >("/user/settings/change-password", payload);
  if (response?.success === false) {
    throw new Error(response.message || "Your password could not be updated.");
  }
  return response;
};

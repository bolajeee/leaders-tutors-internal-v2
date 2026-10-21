import { apiClient } from "@/lib/api-client";
import { isMockMode } from "@/lib/config";
import { ApiError } from "@/lib/errors";
import { MOCK_WRONG_PASSWORD } from "@/services/mock/directory";

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  cnewPassword: string;
}

export const changePassword = async (payload: ChangePasswordPayload) => {
  if (isMockMode()) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (payload.oldPassword === MOCK_WRONG_PASSWORD) {
      throw new ApiError("Your current password is incorrect.", 400);
    }
    return { success: true, message: "Password updated." };
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

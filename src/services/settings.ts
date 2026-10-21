import { getChangePasswordCapability, isMockMode } from "@/lib/config";
import { ApiError, FeatureUnavailableError } from "@/lib/errors";
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
  // The live API has no signed-in change-password call; recovery by emailed code is the route.
  throw new FeatureUnavailableError(
    getChangePasswordCapability().reason ?? "Changing your password is unavailable.",
  );
};

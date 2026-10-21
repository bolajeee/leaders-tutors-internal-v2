import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

import api from "./axios";
import { apiClient } from "./api-client";

describe("apiClient envelope normalization", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
  });

  it("unwraps the data property of the API envelope", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { status: "ok", data: { daysLeft: 12 } } });
    await expect(apiClient.get("/user/accounts/fetch-user-subscription")).resolves.toEqual({ daysLeft: 12 });
  });

  it("returns an unwrapped array payload unchanged", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [{ id: 1 }, { id: 2 }] } });
    await expect(apiClient.get("/list")).resolves.toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("falls back to the body when there is no envelope", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { accessKey: "abc" } });
    await expect(apiClient.post("/user/auth/login", {})).resolves.toEqual({ accessKey: "abc" });
  });

  it("keeps sibling metadata when the full envelope is requested", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: { id: 1 }, examData: { examId: 7 } } });
    await expect(apiClient.getEnvelope("/x")).resolves.toMatchObject({ examData: { examId: 7 } });
  });
});

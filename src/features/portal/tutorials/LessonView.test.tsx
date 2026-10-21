import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LessonView from "./LessonView";
import * as portal from "@/services/portal";
import { renderWithQuery, resetAppState, signInAs } from "@/test/utils";

const open = (lessonId: string) => renderWithQuery(<LessonView lessonId={lessonId} />);

describe("lesson page", () => {
  beforeEach(resetAppState);

  describe("with an active subscription", () => {
    beforeEach(() => signInAs("active"));

    it("shows the video, metadata, notes and CBT action", async () => {
      const { container } = open("living-things");
      expect(await screen.findByRole("heading", { level: 1, name: "Living and non-living things" })).toBeInTheDocument();

      // Subject / term / week / duration metadata.
      expect(screen.getByText(/Basic Science · First Term · Week 1/)).toBeInTheDocument();
      expect(screen.getByText("12:30")).toBeInTheDocument();

      const video = container.querySelector("video");
      expect(video).not.toBeNull();
      expect(video).toHaveAttribute("src", expect.stringContaining(".mp4"));
      expect(video).toHaveAttribute("controlslist", expect.stringContaining("nodownload"));

      const note = screen.getByRole("link", { name: /lesson note/i });
      expect(note).toHaveAttribute("href", "/sample-lesson-note.txt");
      expect(note).toHaveAttribute("download");

      expect(screen.getByRole("link", { name: /take cbt practice/i })).toHaveAttribute(
        "href",
        "/tutorials/living-things/practice",
      );
    });

    it("says so when a lesson has no CBT practice", async () => {
      open("skeletal-system");
      await screen.findByRole("heading", { level: 1, name: /skeletal and muscular system/i });
      expect(screen.getByText(/CBT practice isn't available for this lesson yet/i)).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /cbt practice/i })).not.toBeInTheDocument();
    });

    it("says so when a lesson has no notes", async () => {
      open("healthy-living");
      await screen.findByRole("heading", { level: 1, name: "Healthy living" });
      expect(screen.getByText(/No notes have been attached/i)).toBeInTheDocument();
    });

    it("explains a missing video instead of showing a broken player", async () => {
      const { container } = open("environment");
      await screen.findByRole("heading", { level: 1, name: "Our environment" });
      expect(container.querySelector("video")).toBeNull();
      expect(screen.getByText(/video for this lesson is not available yet/i)).toBeInTheDocument();
    });

    it("shows a not-found state for an unknown lesson", async () => {
      open("does-not-exist");
      expect(await screen.findByRole("heading", { name: /lesson not found/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /browse tutorials/i })).toHaveAttribute("href", "/tutorials");
    });
  });

  describe("with an expired subscription", () => {
    beforeEach(() => signInAs("expired"));

    it("shows the lesson title but locks video, notes and CBT", async () => {
      const { container } = open("living-things");
      expect(await screen.findByRole("heading", { name: /renew to open this lesson/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1, name: "Living and non-living things" })).toBeInTheDocument();
      expect(container.querySelector("video")).toBeNull();
      expect(screen.queryByRole("link", { name: /lesson note/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /cbt/i })).not.toBeInTheDocument();
    });

    it("offers renewal in an accessible dialog", async () => {
      const user = userEvent.setup();
      open("living-things");
      await user.click(await screen.findByRole("button", { name: /renew access/i }));
      const dialog = await screen.findByRole("dialog", { name: /renew learning access/i });
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(within(dialog).getByRole("button", { name: /proceed/i })).toBeInTheDocument();
    });
  });

  it("keeps the lesson locked, with a retry, when the subscription cannot be checked", async () => {
    signInAs("active");
    vi.spyOn(portal, "fetchUserSubscription").mockRejectedValue(new Error("offline"));
    const { container } = open("living-things");
    expect(await screen.findByText(/couldn't confirm your subscription/i)).toBeInTheDocument();
    expect(container.querySelector("video")).toBeNull();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});

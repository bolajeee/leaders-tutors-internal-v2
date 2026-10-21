import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Tutorials from "./Tutorials";
import * as curriculum from "@/services/curriculum";
import { CatalogRepository } from "@/services/curriculum";
import { CurriculumUnavailableError } from "@/types/curriculum";
import { nav } from "@/test/navigation";
import { renderWithQuery, resetAppState, signInAs } from "@/test/utils";

describe("tutorials page", () => {
  beforeEach(resetAppState);

  describe("active student", () => {
    beforeEach(() => signInAs("active"));

    it("lists subjects with their course images and opens nothing until one is chosen", async () => {
      renderWithQuery(<Tutorials />);
      const science = await screen.findByRole("button", { name: /basic science/i });
      expect(science).toHaveAttribute("aria-haspopup", "dialog");
      expect(within(science).getByRole("presentation", { hidden: true })).toHaveAttribute("src", "/course-covers/basic-science.svg");
      // No course image uploaded: the icon placeholder stands in.
      expect(within(screen.getByRole("button", { name: /social studies/i })).queryByRole("presentation", { hidden: true })).toBeNull();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("previews a course's terms in a modal and lists topics in a dropdown", async () => {
      const user = userEvent.setup();
      renderWithQuery(<Tutorials />);
      await user.click(await screen.findByRole("button", { name: /basic science/i }));

      const dialog = await screen.findByRole("dialog", { name: /basic science/i });
      expect(within(dialog).getByText(/3 terms · 5 topics/i)).toBeInTheDocument();
      expect(within(dialog).getByRole("button", { name: /first term/i })).toHaveAttribute("aria-expanded", "true");
      expect(within(dialog).getByRole("button", { name: /second term/i })).toHaveAttribute("aria-expanded", "false");
      expect(within(dialog).getByRole("link", { name: /start lesson: living and non-living things/i })).toHaveAttribute(
        "href",
        "/tutorials/living-things",
      );
      expect(within(dialog).getByText(/lessons for this week are coming soon/i)).toBeInTheDocument();

      await user.click(within(dialog).getByRole("button", { name: /second term/i }));
      expect(within(dialog).getByRole("link", { name: /forms of energy/i })).toHaveAttribute("href", "/tutorials/energy");
      expect(within(dialog).getByRole("button", { name: /first term/i })).toHaveAttribute("aria-expanded", "false");
    });

    it("closes with the close button and Escape", async () => {
      const user = userEvent.setup();
      renderWithQuery(<Tutorials />);
      await user.click(await screen.findByRole("button", { name: /mathematics/i }));
      await user.click(await screen.findByRole("button", { name: /close course/i }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /mathematics/i }));
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("opens the course named in the URL", async () => {
      nav.search = "subject=mathematics";
      renderWithQuery(<Tutorials />);
      const dialog = await screen.findByRole("dialog", { name: /mathematics/i });
      expect(within(dialog).getByRole("link", { name: /whole numbers/i })).toHaveAttribute("href", "/tutorials/whole-numbers");
    });

    it("says when a subject has no content yet", async () => {
      const user = userEvent.setup();
      renderWithQuery(<Tutorials />);
      await user.click(await screen.findByRole("button", { name: /social studies/i }));
      expect(await screen.findByText(/this subject is being prepared/i)).toBeInTheDocument();
    });

    it("filters by subject or lesson name and recovers from no results", async () => {
      const user = userEvent.setup();
      renderWithQuery(<Tutorials />);
      const search = await screen.findByRole("searchbox", { name: /search subjects and lessons/i });
      await user.type(search, "fractions");
      expect(screen.getByRole("button", { name: /mathematics/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /basic science/i })).not.toBeInTheDocument();

      await user.clear(search);
      await user.type(search, "zzz");
      expect(await screen.findByText(/no matching subjects/i)).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /clear search/i }));
      expect(await screen.findByRole("button", { name: /basic science/i })).toBeInTheDocument();
    });
  });

  describe("expired student", () => {
    beforeEach(() => signInAs("expired"));

    it("can browse the catalogue but lessons are locked behind renewal", async () => {
      const user = userEvent.setup();
      renderWithQuery(<Tutorials />);
      expect(await screen.findByText(/your learning access has expired/i)).toBeInTheDocument();
      await user.click(await screen.findByRole("button", { name: /basic science/i }));
      expect(screen.queryByRole("link", { name: /start lesson/i })).not.toBeInTheDocument();

      await user.click(await screen.findByRole("button", { name: /unlock living and non-living things/i }));
      const dialog = await screen.findByRole("dialog", { name: /renew learning access/i });
      expect(within(dialog).getByText(/student plan/i)).toBeInTheDocument();
    });
  });

  describe("failures", () => {
    beforeEach(() => signInAs("active"));

    it("reports an unavailable curriculum and retries", async () => {
      const user = userEvent.setup();
      const failing = new CatalogRepository(async () => {
        throw new CurriculumUnavailableError("Subject, term and week content is not available yet.");
      });
      const spy = vi.spyOn(curriculum, "getCurriculumRepository").mockReturnValue(failing);
      renderWithQuery(<Tutorials />);

      expect(await screen.findByRole("heading", { name: /curriculum unavailable/i })).toBeInTheDocument();
      expect(screen.getByText(/not available yet/i)).toBeInTheDocument();

      spy.mockRestore();
      await user.click(screen.getByRole("button", { name: /try again/i }));
      expect(await screen.findByRole("button", { name: /basic science/i })).toBeInTheDocument();
    });

    it("shows an empty library when the class has no subjects yet", async () => {
      vi.spyOn(curriculum, "getCurriculumRepository").mockReturnValue(new CatalogRepository(async () => []));
      renderWithQuery(<Tutorials />);
      expect(await screen.findByRole("heading", { name: /your library is on its way/i })).toBeInTheDocument();
    });

    it("keeps lessons locked when the subscription cannot be confirmed", async () => {
      const portal = await import("@/services/portal");
      vi.spyOn(portal, "fetchUserSubscription").mockRejectedValue(new Error("offline"));
      renderWithQuery(<Tutorials />);
      expect(await screen.findByText(/couldn't confirm your subscription/i)).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /start lesson/i })).not.toBeInTheDocument();
    });
  });
});

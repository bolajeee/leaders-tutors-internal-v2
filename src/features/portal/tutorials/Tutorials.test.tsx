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

    it("opens the first subject, term and week and offers lessons", async () => {
      renderWithQuery(<Tutorials />);
      expect(await screen.findByRole("button", { name: /basic science/i })).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("button", { name: /first term/i })).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("button", { name: /week 1/i })).toHaveAttribute("aria-expanded", "true");
      const start = await screen.findByRole("link", { name: /start lesson: living and non-living things/i });
      expect(start).toHaveAttribute("href", "/tutorials/living-things");
    });

    it("walks subject → term → week → lesson", async () => {
      const user = userEvent.setup();
      renderWithQuery(<Tutorials />);
      await user.click(await screen.findByRole("button", { name: /second term/i }));
      // The first week of a newly opened term is expanded for you.
      expect(await screen.findByRole("link", { name: /forms of energy/i })).toHaveAttribute("href", "/tutorials/energy");

      await user.click(screen.getByRole("button", { name: /mathematics/i }));
      await user.click(await screen.findByRole("button", { name: /week 2/i }));
      expect(await screen.findByRole("link", { name: /introduction to fractions/i })).toHaveAttribute("href", "/tutorials/fractions");
    });

    it("opens the subject named in the URL", async () => {
      nav.search = "subject=mathematics";
      renderWithQuery(<Tutorials />);
      expect(await screen.findByRole("button", { name: /mathematics/i })).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("button", { name: /basic science/i })).toHaveAttribute("aria-expanded", "false");
    });

    it("says when a week or subject has no content yet", async () => {
      const user = userEvent.setup();
      renderWithQuery(<Tutorials />);
      await user.click(await screen.findByRole("button", { name: /week 4/i }));
      expect(await screen.findByText(/lessons for this week are coming soon/i)).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /social studies/i }));
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
      expect(await screen.findByRole("button", { name: /basic science/i })).toHaveAttribute("aria-expanded", "true");
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

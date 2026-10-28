import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CourseModal from "./CourseModal";
import * as curriculum from "@/services/curriculum";
import type { CurriculumRepository, CurriculumSubject, CurriculumWeek } from "@/types/curriculum";
import { renderWithQuery, resetAppState } from "@/test/utils";

const subject: CurriculumSubject = {
  id: "SUB001",
  name: "Mathematics",
  description: "",
  terms: [
    { id: "TRM001", label: "First Term", order: 1, weeks: [], lessonCount: 2 },
    { id: "TRM002", label: "Second Term", order: 2, weeks: [], lessonCount: 0 },
  ],
};

const week: CurriculumWeek = {
  id: "w1",
  label: "Week 1",
  order: 1,
  lessons: [
    {
      id: "TUT001",
      subjectId: "SUB001",
      termId: "TRM001",
      weekId: "w1",
      subjectName: "Mathematics",
      termLabel: "First Term",
      weekLabel: "Week 1",
      title: "Whole numbers",
      summary: "Read, write and order whole numbers.",
      thumbnailUrl: "https://leaderstutors.com/uploads/thumbs/whole.png",
      duration: "",
      materials: [],
    },
  ],
};

const repository = (getWeeks: CurriculumRepository["getWeeks"]) =>
  vi.spyOn(curriculum, "getCurriculumRepository").mockReturnValue({ getWeeks } as unknown as CurriculumRepository);

const renderModal = (course = subject) =>
  renderWithQuery(<CourseModal subject={course} access="active" onClose={vi.fn()} onUnlock={vi.fn()} />);

describe("course modal with terms whose weeks load on demand", () => {
  beforeEach(resetAppState);

  it("previews each term's topic count before anything is fetched", async () => {
    const getWeeks = vi.fn().mockResolvedValue([week]);
    repository(getWeeks);
    const user = userEvent.setup();
    renderModal();

    const dialog = await screen.findByRole("dialog", { name: /mathematics/i });
    expect(within(dialog).getByText(/2 terms · 2 topics/i)).toBeInTheDocument();
    expect(within(dialog).getByText("Topics coming soon")).toBeInTheDocument(); // the empty second term

    // The second term has nothing to load, so opening it asks the API for nothing.
    await user.click(within(dialog).getByRole("button", { name: /second term/i }));
    expect(getWeeks).not.toHaveBeenCalledWith("SUB001", "TRM002");
  });

  it("fetches the open term's weeks and lists its lessons without a duration it does not have", async () => {
    const getWeeks = vi.fn().mockResolvedValue([week]);
    repository(getWeeks);
    renderModal();

    const dialog = await screen.findByRole("dialog");
    const link = await within(dialog).findByRole("link", { name: /start lesson: whole numbers/i });
    expect(link).toHaveAttribute("href", "/tutorials/TUT001");
    expect(getWeeks).toHaveBeenCalledTimes(1);
    expect(getWeeks).toHaveBeenCalledWith("SUB001", "TRM001");
    expect(within(dialog).getByText("1 week · 2 topics")).toBeInTheDocument();
    expect(within(dialog).queryByText(/duration/i)).not.toBeInTheDocument();
    const lessonRow = link.closest("li");
    expect(lessonRow).not.toBeNull();
    expect(within(lessonRow as HTMLLIElement).getByRole("presentation", { hidden: true })).toHaveAttribute(
      "src",
      "https://leaderstutors.com/uploads/thumbs/whole.png",
    );
  });

  it("renders a course's HTML description as sanitized formatted content", async () => {
    repository(vi.fn().mockResolvedValue([week]));
    renderModal({ ...subject, description: "<p>Study <strong>numbers</strong>.</p><script>alert('x')</script>" });

    const dialog = await screen.findByRole("dialog", { name: /mathematics/i });
    expect(within(dialog).getByText("numbers")).toHaveProperty("tagName", "STRONG");
    expect(dialog.querySelector("script")).toBeNull();
    expect(dialog).not.toHaveTextContent("<p>");
  });

  it("shows the API's message when a term cannot be loaded, and retries on request", async () => {
    const getWeeks = vi.fn().mockRejectedValueOnce(new Error("Your subscription has expired.")).mockResolvedValue([week]);
    repository(getWeeks);
    const user = userEvent.setup();
    renderModal();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Topics couldn't be loaded");
    expect(alert).toHaveTextContent("Your subscription has expired.");

    await user.click(within(alert).getByRole("button", { name: /try again/i }));
    expect(await screen.findByRole("link", { name: /start lesson: whole numbers/i })).toBeInTheDocument();
  });
});

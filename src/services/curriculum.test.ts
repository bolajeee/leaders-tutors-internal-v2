import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/live-api", () => ({ liveCall: vi.fn() }));

import { liveCall } from "@/lib/live-api";
import { ApiError } from "@/lib/errors";
import { countLessons, getCurriculumRepository } from "./curriculum";

describe("mock curriculum repository", () => {
  it("provides a subject, term, week, and lesson hierarchy", async () => {
    const repository = getCurriculumRepository();
    const subjects = await repository.getSubjects();
    const science = subjects.find((subject) => subject.id === "basic-science");
    expect(science?.terms[0].weeks[0].lessons[0].id).toBe("living-things");
  });

  it("resolves terms, weeks and lessons through the repository operations", async () => {
    const repository = getCurriculumRepository();
    const terms = await repository.getTerms("basic-science");
    expect(terms.map((term) => term.label)).toEqual(["First Term", "Second Term", "Third Term"]);
    const weeks = await repository.getWeeks("basic-science", terms[0].id);
    expect(weeks.map((week) => week.label)).toEqual(["Week 1", "Week 2", "Week 3", "Week 4"]);
    const lessons = await repository.getLessons("basic-science", terms[0].id, weeks[1].id);
    expect(lessons.map((lesson) => lesson.id)).toEqual(["skeletal-system"]);
  });

  it("resolves lesson details with their parent labels", async () => {
    const lesson = await getCurriculumRepository().getLesson("skeletal-system");
    expect(lesson).toMatchObject({
      subjectName: "Basic Science",
      termLabel: "First Term",
      weekLabel: "Week 2",
      duration: "18:42",
    });
    expect(lesson?.materials).toHaveLength(1);
  });

  it("models lessons without notes, video or CBT, and empty weeks and subjects", async () => {
    const repository = getCurriculumRepository();
    expect((await repository.getLesson("healthy-living"))?.materials).toEqual([]);
    expect((await repository.getLesson("environment"))?.videoUrl).toBeUndefined();
    expect((await repository.getLesson("skeletal-system"))?.assessment).toBeUndefined();
    const subjects = await repository.getSubjects();
    expect(subjects.find((subject) => subject.id === "social-studies")?.terms).toEqual([]);
  });

  it("returns null or empty lists for unknown ids", async () => {
    const repository = getCurriculumRepository();
    expect(await repository.getLesson("nope")).toBeNull();
    expect(await repository.getTerms("nope")).toEqual([]);
  });
});

describe("live curriculum repository (api mode)", () => {
  const subjectsReply = {
    success: true,
    message: "",
    response: 200,
    subjects: [
      {
        subject_id: "SUB001",
        subject_name: "MATHEMATICS",
        terms: [
          { term_id: "TRM001", term_name: "FIRST TERM", total_number_of_videos: 4 },
          { term_id: "TRM002", term_name: "SECOND TERM", total_number_of_videos: 0 },
        ],
      },
      { subject_id: "SUB002", subject_name: "Yoruba", terms: [] },
      { subject_id: "", subject_name: "Dropped: no id", terms: [] },
    ],
  };
  const weeksReply = {
    success: true,
    message: "",
    subject_name: "MATHEMATICS",
    term_name: "FIRST TERM",
    data: [
      {
        week_name: "WEEK 1",
        week_videos: [
          {
            tutorial_id: "TUT001",
            topic: "Whole numbers",
            summary: "Read, write and order whole numbers.",
            documentStoragePath: "https://leaderstutors.com/uploads/thumbs",
            thumbnail: "whole.png",
            description: "<p>Learn <strong>whole numbers</strong>.</p>",
            quiz_status: 1,
            quiz_question_counts: 10,
          },
          { tutorial_id: "", topic: "Dropped: no id" },
        ],
      },
      { week_name: "WEEK 2", week_videos: [] },
    ],
  };
  const tutorialReply = {
    success: true,
    message: "",
    data: [
      {
        tutorial_id: "TUT001",
        topic: "Whole numbers",
        summary: "Read, write and order whole numbers.",
        duration: "12:30",
        subject_name: "MATHEMATICS",
        term_name: "FIRST TERM",
        week_name: "WEEK 1",
        documentStoragePath_video: "https://leaderstutors.com/uploads/videos/",
        video: "whole.mp4",
        documentStoragePath_material: "https://leaderstutors.com/uploads/notes",
        material: "whole.pdf",
        description: "<p>Learn <strong>whole numbers</strong>.</p>",
      },
    ],
  };

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_CURRICULUM_SOURCE", "api");
    vi.mocked(liveCall).mockReset();
  });

  it("lists the student's subjects with their terms and topic counts, weeks not loaded yet", async () => {
    vi.mocked(liveCall).mockResolvedValue(subjectsReply);
    const subjects = await getCurriculumRepository().getSubjects();

    expect(liveCall).toHaveBeenCalledWith("/user/tutorials/fetch-deparment-class-subjects");
    expect(subjects.map((subject) => subject.name)).toEqual(["Mathematics", "Yoruba"]);
    expect(subjects[0].terms).toEqual([
      { id: "TRM001", label: "First Term", order: 1, weeks: [], lessonCount: 4 },
      { id: "TRM002", label: "Second Term", order: 2, weeks: [], lessonCount: 0 },
    ]);
    expect(countLessons(subjects[0])).toBe(4);
    expect(subjects[0].progress).toBeUndefined();
  });

  it("gives a subject its bundled cover, and none when there is no cover for it", async () => {
    vi.mocked(liveCall).mockResolvedValue(subjectsReply);
    const [maths, yoruba] = await getCurriculumRepository().getSubjects();
    expect(maths.imageUrl).toBe("/course-covers/mathematics.svg");
    expect(yoruba.imageUrl).toBeUndefined();
  });

  it("loads a term's weeks and lessons only when asked", async () => {
    vi.mocked(liveCall).mockResolvedValue(weeksReply);
    const weeks = await getCurriculumRepository().getWeeks("SUB001", "TRM001");

    expect(liveCall).toHaveBeenCalledWith("/user/tutorials/fetch-deparment-class-subject-weeks", {
      term_id: "TRM001",
      subject_id: "SUB001",
    });
    expect(weeks.map((week) => week.label)).toEqual(["Week 1", "Week 2"]);
    expect(weeks[0].lessons).toHaveLength(1);
    expect(weeks[0].lessons[0]).toMatchObject({
      id: "TUT001",
      title: "Whole numbers",
      subjectName: "Mathematics",
      termLabel: "First Term",
      weekLabel: "Week 1",
      thumbnailUrl: "https://leaderstutors.com/uploads/thumbs/whole.png",
      summary: "Read, write and order whole numbers.",
      description: "<p>Learn <strong>whole numbers</strong>.</p>",
    });
    // CBT practice has no in-app equivalent yet, so no dead practice link is offered.
    expect(weeks[0].lessons[0].assessment).toBeUndefined();
    expect(weeks[1].lessons).toEqual([]);
  });

  it("opens a lesson with its video and note", async () => {
    vi.mocked(liveCall).mockResolvedValue(tutorialReply);
    const lesson = await getCurriculumRepository().getLesson("TUT001");

    expect(liveCall).toHaveBeenCalledWith("/user/tutorials/fetch-tutorial", { tutorial_id: "TUT001" });
    expect(lesson).toMatchObject({
      id: "TUT001",
      title: "Whole numbers",
      subjectName: "Mathematics",
      termLabel: "First Term",
      weekLabel: "Week 1",
      duration: "12:30",
      videoUrl: "https://leaderstutors.com/uploads/videos/whole.mp4",
      description: "<p>Learn <strong>whole numbers</strong>.</p>",
    });
    expect(lesson?.materials).toEqual([
      { id: "TUT001-note", title: "Whole numbers lesson note", url: "https://leaderstutors.com/uploads/notes/whole.pdf", kind: "note" },
    ]);
  });

  it("returns null for a tutorial the API has no row for", async () => {
    vi.mocked(liveCall).mockResolvedValue({ success: true, message: "", data: [] });
    await expect(getCurriculumRepository().getLesson("NOPE")).resolves.toBeNull();
  });

  it("never falls back to fixtures: the API's refusal is what the student sees", async () => {
    vi.mocked(liveCall).mockRejectedValue(new ApiError("Your subscription has expired. Renew to continue.", 400));
    await expect(getCurriculumRepository().getSubjects()).rejects.toThrow("Your subscription has expired");
  });
});

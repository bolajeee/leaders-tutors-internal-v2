import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", () => ({ apiClient: { get: vi.fn() } }));

import { apiClient } from "@/lib/api-client";
import { getCurriculumRepository, normalizeCurriculum } from "./curriculum";
import { CurriculumUnavailableError } from "@/types/curriculum";

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

describe("normalizeCurriculum", () => {
  const payload = {
    data: [
      {
        subjectId: "s1",
        subject_name: "Physics",
        description: "Forces and motion",
        progress: 140,
        terms: [
          {
            termId: "t2",
            name: "Second Term",
            order: 2,
            weeks: [],
          },
          {
            termId: "t1",
            name: "First Term",
            position: 1,
            weeks: [
              {
                weekId: "w1",
                name: "Week 1",
                lessons: [
                  {
                    tutorialId: "l1",
                    tutorialTitle: "Motion",
                    tutorialDescription: "<p>Learn about <b>motion</b>&nbsp;today</p>",
                    tutorialDuration: 125,
                    tutorialVideo: "https://cdn.example.com/motion.mp4",
                    materialUrl: "https://cdn.example.com/motion.pdf",
                    cbtUrl: "https://cbt.example.com/motion",
                    questionCount: 10,
                  },
                  { tutorialId: "", tutorialTitle: "Dropped: no id" },
                  { tutorialId: "l3" },
                ],
              },
            ],
          },
        ],
      },
      { subjectId: "", subject_name: "Dropped" },
    ],
  };

  it("maps an enveloped API payload to the normalized tree", () => {
    const [physics, ...rest] = normalizeCurriculum(payload);
    expect(rest).toHaveLength(0);
    expect(physics).toMatchObject({ id: "s1", name: "Physics", description: "Forces and motion", progress: 100 });
    const lesson = physics.terms.find((term) => term.id === "t1")!.weeks[0].lessons[0];
    expect(lesson).toMatchObject({
      id: "l1",
      subjectId: "s1",
      subjectName: "Physics",
      termId: "t1",
      termLabel: "First Term",
      weekId: "w1",
      weekLabel: "Week 1",
      title: "Motion",
      summary: "Learn about motion today",
      duration: "2:05",
      videoUrl: "https://cdn.example.com/motion.mp4",
    });
    expect(lesson.materials).toEqual([
      { id: "l1-note", title: "Lesson note", url: "https://cdn.example.com/motion.pdf", kind: "note" },
    ]);
    expect(lesson.assessment).toEqual({
      label: "Take CBT practice",
      url: "https://cbt.example.com/motion",
      questionCount: 10,
    });
  });

  it("drops lessons without an id or title and subjects without an id", () => {
    const [physics] = normalizeCurriculum(payload);
    expect(physics.terms.flatMap((term) => term.weeks).flatMap((week) => week.lessons)).toHaveLength(1);
  });

  it("accepts a bare array and fills in defaults", () => {
    const [subject] = normalizeCurriculum([{ id: "s", name: "Art", terms: [] }]);
    expect(subject).toEqual({ id: "s", name: "Art", description: "", progress: 0, terms: [] });
  });

  it("reports unsupported payloads as unavailable instead of guessing", () => {
    expect(() => normalizeCurriculum({ message: "ok" })).toThrow(CurriculumUnavailableError);
    expect(() => normalizeCurriculum(null)).toThrow(CurriculumUnavailableError);
    expect(() => normalizeCurriculum("<html>")).toThrow(CurriculumUnavailableError);
  });
});

describe("api curriculum mode", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_CURRICULUM_SOURCE", "api");
    vi.mocked(apiClient.get).mockReset();
  });

  it("reports an unavailable state when no curriculum endpoint is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_CURRICULUM_API_PATH", "");
    await expect(getCurriculumRepository().getSubjects()).rejects.toBeInstanceOf(CurriculumUnavailableError);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("never falls back to fixtures when the request fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_CURRICULUM_API_PATH", "/user/tutorials/fetch-curriculum");
    vi.mocked(apiClient.get).mockRejectedValue(new Error("Network Error"));
    await expect(getCurriculumRepository().getSubjects()).rejects.toThrow("Network Error");
  });

  it("loads and normalizes the configured endpoint", async () => {
    vi.stubEnv("NEXT_PUBLIC_CURRICULUM_API_PATH", "/user/tutorials/fetch-curriculum");
    vi.mocked(apiClient.get).mockResolvedValue([{ id: "api-1", name: "Chemistry", terms: [] }]);
    const subjects = await getCurriculumRepository().getSubjects();
    expect(apiClient.get).toHaveBeenCalledWith("/user/tutorials/fetch-curriculum");
    expect(subjects.map((subject) => subject.id)).toEqual(["api-1"]);
  });
});

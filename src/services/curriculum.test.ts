import { describe, expect, it } from "vitest";
import { getCurriculumRepository } from "./curriculum";

describe("mock curriculum repository", () => {
  it("provides a subject, term, week, and lesson hierarchy", async () => {
    const repository = getCurriculumRepository();
    const subjects = await repository.getSubjects();
    const science = subjects.find((subject) => subject.id === "basic-science");
    expect(science?.terms[0].weeks[0].lessons[0].id).toBe("living-things");
  });

  it("resolves lesson details by id", async () => {
    const lesson = await getCurriculumRepository().getLesson("skeletal-system");
    expect(lesson).toMatchObject({ subjectId: "basic-science", duration: "18:42" });
    expect(lesson?.materials).toHaveLength(1);
  });
});

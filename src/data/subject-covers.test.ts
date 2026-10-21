import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { coverForSubject } from "./subject-covers";

const subjects = [
  "Mathematics",
  "English Language",
  "Basic Science",
  "Basic Technology",
  "Social Studies",
  "Civic Education",
  "Computer Science",
  "Business Studies",
  "Biology",
  "Chemistry",
  "Physics",
  "Economics",
  "Financial Accounting",
  "Government",
];

describe("coverForSubject", () => {
  it.each(subjects)("has a bundled cover file for %s", (name) => {
    const cover = coverForSubject(name);
    expect(cover).toBeDefined();
    expect(existsSync(join(process.cwd(), "public", cover!))).toBe(true);
  });

  it("ignores case, spacing and punctuation, and honours aliases", () => {
    expect(coverForSubject("  BASIC   science ")).toBe("/course-covers/basic-science.svg");
    expect(coverForSubject("Maths")).toBe("/course-covers/mathematics.svg");
    expect(coverForSubject("English Studies")).toBe("/course-covers/english.svg");
  });

  it("returns undefined for a subject with no bundled cover", () => {
    expect(coverForSubject("Yoruba")).toBeUndefined();
  });
});

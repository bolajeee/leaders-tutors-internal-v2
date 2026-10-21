import type {
  AcademicTerm,
  CurriculumSubject,
  CurriculumWeek,
  Lesson,
} from "@/types/curriculum";

const SAMPLE_VIDEO =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

interface LessonSeed {
  id: string;
  title: string;
  summary: string;
  duration?: string;
  /** Omit to model a lesson whose video has not been uploaded yet. */
  video?: boolean;
  note?: boolean;
  cbt?: boolean;
}

interface WeekSeed {
  label: string;
  lessons: LessonSeed[];
}

interface TermSeed {
  label: string;
  weeks: WeekSeed[];
}

interface SubjectSeed {
  id: string;
  name: string;
  description: string;
  progress: number;
  terms: TermSeed[];
}

const buildSubject = (seed: SubjectSeed): CurriculumSubject => ({
  id: seed.id,
  name: seed.name,
  description: seed.description,
  progress: seed.progress,
  terms: seed.terms.map((term, termIndex): AcademicTerm => {
    const termId = `${seed.id}-term-${termIndex + 1}`;
    return {
      id: termId,
      label: term.label,
      order: termIndex + 1,
      weeks: term.weeks.map((week, weekIndex): CurriculumWeek => {
        const weekId = `${termId}-week-${weekIndex + 1}`;
        return {
          id: weekId,
          label: week.label,
          order: weekIndex + 1,
          lessons: week.lessons.map(
            (item): Lesson => ({
              id: item.id,
              subjectId: seed.id,
              termId,
              weekId,
              subjectName: seed.name,
              termLabel: term.label,
              weekLabel: week.label,
              title: item.title,
              summary: item.summary,
              duration: item.duration ?? "12:30",
              videoUrl: item.video === false ? undefined : SAMPLE_VIDEO,
              materials:
                item.note === false
                  ? []
                  : [
                      {
                        id: `${item.id}-note`,
                        title: `${item.title} lesson note`,
                        url: "/sample-lesson-note.txt",
                        kind: "note",
                      },
                    ],
              assessment:
                item.cbt === false
                  ? undefined
                  : {
                      label: "Take CBT practice",
                      url: `/tutorials/${item.id}/practice`,
                      questionCount: 3,
                    },
            }),
          ),
        };
      }),
    };
  }),
});

/** Typed fixtures served when NEXT_PUBLIC_CURRICULUM_SOURCE=mock. */
export const curriculumFixtures: CurriculumSubject[] = [
  buildSubject({
    id: "basic-science",
    name: "Basic Science",
    description:
      "Understand the body, the environment, matter, and energy through practical examples.",
    progress: 42,
    terms: [
      {
        label: "First Term",
        weeks: [
          {
            label: "Week 1",
            lessons: [
              {
                id: "living-things",
                title: "Living and non-living things",
                summary:
                  "Identify the characteristics that distinguish living things from non-living things.",
              },
            ],
          },
          {
            label: "Week 2",
            lessons: [
              {
                id: "skeletal-system",
                title: "Skeletal and muscular system",
                summary:
                  "Identify the main bones in the human body and explain how muscles support movement.",
                duration: "18:42",
                cbt: false,
              },
            ],
          },
          {
            label: "Week 3",
            lessons: [
              {
                id: "healthy-living",
                title: "Healthy living",
                summary:
                  "Explore the daily habits that support a healthy body and mind.",
                duration: "10:56",
                note: false,
                cbt: false,
              },
            ],
          },
          { label: "Week 4", lessons: [] },
        ],
      },
      {
        label: "Second Term",
        weeks: [
          {
            label: "Week 1",
            lessons: [
              {
                id: "energy",
                title: "Forms of energy",
                summary:
                  "Recognise common forms of energy and how they change from one form to another.",
              },
            ],
          },
        ],
      },
      {
        label: "Third Term",
        weeks: [
          {
            label: "Week 1",
            lessons: [
              {
                id: "environment",
                title: "Our environment",
                summary:
                  "Describe natural and built environments and ways to protect them.",
                video: false,
                cbt: false,
              },
            ],
          },
        ],
      },
    ],
  }),
  buildSubject({
    id: "mathematics",
    name: "Mathematics",
    description:
      "Build confidence with numbers, shapes, measurement, and everyday problem solving.",
    progress: 68,
    terms: [
      {
        label: "First Term",
        weeks: [
          {
            label: "Week 1",
            lessons: [
              {
                id: "whole-numbers",
                title: "Whole numbers",
                summary: "Read, write, compare, and order whole numbers.",
              },
            ],
          },
          {
            label: "Week 2",
            lessons: [
              {
                id: "fractions",
                title: "Introduction to fractions",
                summary:
                  "Describe parts of a whole and compare simple fractions.",
                duration: "14:05",
              },
            ],
          },
        ],
      },
      {
        label: "Second Term",
        weeks: [
          {
            label: "Week 1",
            lessons: [
              {
                id: "perimeter",
                title: "Perimeter and area",
                summary: "Measure the distance around and the space inside simple shapes.",
                duration: "16:20",
              },
            ],
          },
        ],
      },
    ],
  }),
  buildSubject({
    id: "english",
    name: "English Studies",
    description:
      "Strengthen reading, writing, grammar, listening, and confident communication.",
    progress: 31,
    terms: [
      {
        label: "First Term",
        weeks: [
          {
            label: "Week 1",
            lessons: [
              {
                id: "parts-of-speech",
                title: "Parts of speech",
                summary:
                  "Recognise how nouns, verbs, adjectives, and adverbs work in sentences.",
              },
            ],
          },
        ],
      },
    ],
  }),
  buildSubject({
    id: "social-studies",
    name: "Social Studies",
    description: "Learn about communities, culture, and citizenship in Nigeria.",
    progress: 0,
    terms: [],
  }),
];

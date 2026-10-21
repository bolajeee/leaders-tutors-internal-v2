import type { CurriculumSubject, Lesson } from "@/types/curriculum";

const video = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

const lesson = (
  id: string,
  subjectId: string,
  termId: string,
  weekId: string,
  title: string,
  summary: string,
  duration = "12:30",
): Lesson => ({
  id,
  subjectId,
  termId,
  weekId,
  title,
  summary,
  duration,
  videoUrl: video,
  materials: [
    { id: `${id}-note`, title: `${title} lesson note`, url: "/sample-lesson-note.txt", kind: "note" },
  ],
  assessment: { label: "Take CBT practice", url: `/tutorials/${id}?practice=true`, questionCount: 20 },
});

const scienceTerms = [
  {
    id: "basic-science-term-1",
    label: "First Term",
    order: 1,
    weeks: [
      { id: "basic-science-t1-w1", label: "Week 1", order: 1, lessons: [lesson("living-things", "basic-science", "basic-science-term-1", "basic-science-t1-w1", "Living and non-living things", "Identify the characteristics that distinguish living things from non-living things.")] },
      { id: "basic-science-t1-w2", label: "Week 2", order: 2, lessons: [lesson("skeletal-system", "basic-science", "basic-science-term-1", "basic-science-t1-w2", "Skeletal and muscular system", "Identify the main bones in the human body and explain how muscles support movement.", "18:42")] },
      { id: "basic-science-t1-w3", label: "Week 3", order: 3, lessons: [lesson("healthy-living", "basic-science", "basic-science-term-1", "basic-science-t1-w3", "Healthy living", "Explore the daily habits that support a healthy body and mind.", "10:56")] },
    ],
  },
  { id: "basic-science-term-2", label: "Second Term", order: 2, weeks: [{ id: "basic-science-t2-w1", label: "Week 1", order: 1, lessons: [lesson("energy", "basic-science", "basic-science-term-2", "basic-science-t2-w1", "Forms of energy", "Recognise common forms of energy and how they change from one form to another.")] }] },
  { id: "basic-science-term-3", label: "Third Term", order: 3, weeks: [{ id: "basic-science-t3-w1", label: "Week 1", order: 1, lessons: [lesson("environment", "basic-science", "basic-science-term-3", "basic-science-t3-w1", "Our environment", "Describe natural and built environments and ways to protect them.")] }] },
];

export const curriculumFixtures: CurriculumSubject[] = [
  { id: "basic-science", name: "Basic Science", description: "Understand the body, the environment, matter, and energy through practical examples.", progress: 42, terms: scienceTerms },
  { id: "mathematics", name: "Mathematics", description: "Build confidence with numbers, shapes, measurement, and everyday problem solving.", progress: 68, terms: [{ id: "math-term-1", label: "First Term", order: 1, weeks: [{ id: "math-t1-w1", label: "Week 1", order: 1, lessons: [lesson("whole-numbers", "mathematics", "math-term-1", "math-t1-w1", "Whole numbers", "Read, write, compare, and order whole numbers.")] }] }] },
  { id: "english", name: "English Studies", description: "Strengthen reading, writing, grammar, listening, and confident communication.", progress: 31, terms: [{ id: "english-term-1", label: "First Term", order: 1, weeks: [{ id: "english-t1-w1", label: "Week 1", order: 1, lessons: [lesson("parts-of-speech", "english", "english-term-1", "english-t1-w1", "Parts of speech", "Recognise how nouns, verbs, adjectives, and adverbs work in sentences.")] }] }] },
  { id: "basic-technology", name: "Basic Technology", description: "Learn about tools, materials, simple machines, drawing, and practical technology.", progress: 15, terms: [{ id: "technology-term-1", label: "First Term", order: 1, weeks: [{ id: "technology-t1-w3", label: "Week 3", order: 3, lessons: [lesson("processing-wood", "basic-technology", "technology-term-1", "technology-t1-w3", "Processing of materials: wood", "Explain seasoning and identify common defects in processed wood.", "10:56")] }] }] },
  { id: "business-studies", name: "Business Studies", description: "Discover commerce, office practice, bookkeeping, and entrepreneurship.", progress: 0, terms: [{ id: "business-term-1", label: "First Term", order: 1, weeks: [] }] },
  { id: "civic-education", name: "Civic Education", description: "Explore citizenship, values, rights, responsibilities, and national identity.", progress: 0, terms: [{ id: "civic-term-1", label: "First Term", order: 1, weeks: [] }] },
];

const COVER_DIR = "/course-covers";

/** Cover file (without extension) for each subject taught on the platform. */
const covers = [
  "mathematics",
  "english",
  "basic-science",
  "basic-technology",
  "social-studies",
  "civic-education",
  "computer-science",
  "business-studies",
  "biology",
  "chemistry",
  "physics",
  "economics",
  "financial-accounting",
  "government",
] as const;

/** Alternative names a subject may be stored under, mapped to a cover. */
const aliases: Record<string, (typeof covers)[number]> = {
  maths: "mathematics",
  "english-language": "english",
  "english-studies": "english",
  computer: "computer-science",
  "computer-studies": "computer-science",
  business: "business-studies",
  accounting: "financial-accounting",
};

const slugOf = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * The bundled cover for a subject, matched by name, or undefined when none
 * exists. Used when a subject has no uploaded course image.
 */
export const coverForSubject = (name: string): string | undefined => {
  const slug = slugOf(name);
  const cover = (covers as readonly string[]).includes(slug) ? slug : aliases[slug];
  return cover ? `${COVER_DIR}/${cover}.svg` : undefined;
};

"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";

/**
 * A subject's uploaded course image. Falls back to the book icon only when no
 * image was uploaded or it fails to load. Decorative: the subject name is always
 * rendered next to it. Size and rounding come from `className`.
 */
export default function SubjectImage({ src, className = "h-10 w-10 rounded-xl" }: { src?: string; className?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (src && failedSrc !== src) {
    return (
      // Course images come from an arbitrary upload host, so next/image's allow-list does not apply.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => setFailedSrc(src)}
        className={`shrink-0 bg-slate-100 object-cover ${className}`}
      />
    );
  }
  return (
    <span className={`grid shrink-0 place-items-center bg-indigo-50 text-[var(--primary-color)] ${className}`}>
      <BookOpen className="h-[40%] w-[40%]" aria-hidden />
    </span>
  );
}

"use client";

import { useState } from "react";
import { PlayCircle, RefreshCw } from "lucide-react";

/**
 * Lesson video player. It is only rendered for students with an active
 * subscription, and it removes the casual download/picture-in-picture/context
 * menu affordances. This deters casual saving; it is not DRM.
 */
export default function SecureVideoPlayer({
  src,
  poster,
  title,
}: {
  src?: string;
  poster?: string;
  title: string;
}) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  if (!src) {
    return (
      <div className="grid aspect-video place-items-center bg-slate-950 p-6 text-center text-white">
        <div>
          <PlayCircle className="mx-auto h-12 w-12 text-white/80" aria-hidden />
          <p role="status" className="mt-3 font-semibold">
            The video for this lesson is not available yet.
          </p>
          <p className="mt-1 text-sm text-white/80">Read the lesson notes while you wait.</p>
        </div>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="grid aspect-video place-items-center bg-slate-950 p-6 text-center text-white">
        <div role="alert">
          <p className="font-semibold">This video could not be played.</p>
          <p className="mt-1 text-sm text-white/80">Check your connection and try again.</p>
          <button
            type="button"
            onClick={() => {
              setFailed(false);
              setAttempt((value) => value + 1);
            }}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-900"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Reload video
          </button>
        </div>
      </div>
    );
  }

  return (
    <video
      key={attempt}
      className="aspect-video w-full bg-black"
      controls
      playsInline
      preload="metadata"
      poster={poster}
      src={src}
      aria-label={`Lesson video: ${title}`}
      controlsList="nodownload noremoteplayback"
      disablePictureInPicture
      disableRemotePlayback
      onContextMenu={(event) => event.preventDefault()}
      onError={() => setFailed(true)}
    >
      Your browser does not support video playback.
    </video>
  );
}

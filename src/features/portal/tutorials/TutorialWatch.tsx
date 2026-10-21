"use client";
import {
  ArrowLeft,
  Play,
  Clock,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Lock,
  FileDown,
} from "lucide-react";
import { PortalWrapper } from "../PortalWrapper";
import { useAuthStore } from "@/store/authStore";
import { useState, useEffect } from "react";
import { Button } from "@/components/form";
import Link from "next/link";
import DOMPurify from "dompurify";
import { useSearchParams } from "next/navigation";
import { fetchTutorialById, fetchUserSubscription } from "@/services/portal";
import { TutorialVideo } from "@/types/portal";
import SubscriptionModal from "@/components/subscription/SubscriptionModal";
import { Avatar, Badge, Card } from "@/components/ui";

export default function TutorialWatch() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const tutorialId = searchParams.get("tutorialId");

  const [videoData, setVideoData] = useState<TutorialVideo | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  useEffect(() => {
    const loadVideoData = async () => {
      try {
        setIsLoading(true);

        const subscription = await fetchUserSubscription().catch(() => null);
        const isActive = !!subscription?.isSubscriptionActive;
        setHasActiveSubscription(isActive);

        if (!isActive || !tutorialId) {
          setVideoData(null);
          return;
        }

        const tutorial = await fetchTutorialById(tutorialId);
        setVideoData(tutorial);
      } catch (error) {
        console.error("Video data load error:", error);
        setVideoData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadVideoData();
  }, [tutorialId]);

  const userName = user
    ? `${user.first_name} ${user.last_name}`
    : "Student User";

  if (!hasActiveSubscription && !isLoading) {
    return (
      <PortalWrapper>
        <section className="px-4 md:px-8 py-16">
          <Card className="mx-auto max-w-lg p-10 text-center animate-fade-up">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="mb-2 text-xl font-bold tracking-tight text-ink">
              Unlock this tutorial
            </h2>
            <p className="mb-6 text-muted">
              You need an active subscription to watch tutorial videos.
            </p>
            <Button
              text="Upgrade Subscription"
              className="px-8"
              onClick={() => setShowSubscriptionModal(true)}
            />
          </Card>
          <SubscriptionModal
            isOpen={showSubscriptionModal}
            onClose={() => setShowSubscriptionModal(false)}
          />
        </section>
      </PortalWrapper>
    );
  }

  if (isLoading) {
    return (
      <PortalWrapper>
        <section className="grid gap-6 px-4 py-6 md:px-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="skeleton aspect-video w-full rounded-2xl" />
            <div className="skeleton h-6 w-2/3 rounded-lg" />
            <div className="skeleton h-4 w-1/3 rounded-lg" />
          </div>
          <div className="skeleton h-64 rounded-2xl" />
        </section>
      </PortalWrapper>
    );
  }

  if (!videoData) {
    return (
      <PortalWrapper>
        <section className="px-4 md:px-8 py-16">
          <Card className="mx-auto max-w-lg p-10 text-center animate-fade-up">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light text-primary">
              <Play className="h-7 w-7" />
            </div>
            <h2 className="mb-2 text-xl font-bold tracking-tight text-ink">
              Video Not Found
            </h2>
            <p className="mb-6 text-muted">
              The requested tutorial video could not be found.
            </p>
            <Link href="/tutorials">
              <Button
                text="Back to Tutorials"
                variant="secondary"
                className="px-8"
              />
            </Link>
          </Card>
        </section>
      </PortalWrapper>
    );
  }

  const examLabel = `${videoData.year ?? ""} ${videoData.exam ?? ""}`.trim();

  return (
    <PortalWrapper>
      {/* Hero header */}
      <section className="relative overflow-hidden border-b border-primary/10 bg-brand-gradient-soft">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-secondary/15 blur-3xl" />
        <div className="relative flex items-center gap-4 px-4 py-5 md:px-8">
          <Link
            href="/tutorials"
            aria-label="Back to tutorials"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-card transition hover:-translate-x-0.5 hover:bg-primary-light"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-muted">
              Now watching
            </p>
            <h1 className="truncate text-xl font-bold tracking-tight text-brand-gradient md:text-2xl">
              {videoData.title}
            </h1>
          </div>
        </div>
      </section>

      <section className="grid items-start gap-6 px-4 py-6 md:px-8 lg:grid-cols-3 animate-fade-up">
        {/* Player + details */}
        <div className="mx-auto w-full max-w-3xl space-y-4 lg:col-span-2 lg:max-w-none lg:space-y-6">
          <div className="-mx-4 flex min-h-[calc(100svh-9rem)] w-[calc(100%+2rem)] flex-col justify-center gap-4 bg-slate-950 px-4 py-8 md:-mx-8 md:w-[calc(100%+4rem)] md:px-8 lg:mx-0 lg:min-h-0 lg:w-full lg:gap-6 lg:bg-transparent lg:p-0">
            <div className="mx-auto w-full overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/15 lg:shadow-pop lg:ring-primary/20">
              <div className="relative aspect-video">
                {videoData.videoUrl ? (
                  <video
                    className="h-full w-full"
                    controls
                    poster={videoData.thumbnailUrl}
                  >
                    <source src={videoData.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/80">
                    Video URL is not available for this tutorial.
                  </div>
                )}
              </div>
            </div>

            {videoData.materialUrl ? (
              <a
                href={videoData.materialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mx-auto flex w-full items-center justify-between rounded-2xl border border-primary/10 bg-white p-4 text-sm font-semibold text-primary shadow-card transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-pop"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
                    <FileDown className="h-5 w-5" />
                  </span>
                  Tutorial material
                </span>
                <span className="text-xs uppercase tracking-wide">
                  Open PDF
                </span>
              </a>
            ) : null}
          </div>

          <Card className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">{videoData.subject || "Tutorial"}</Badge>
              {examLabel && <Badge tone="warning">{examLabel}</Badge>}
              {videoData.duration ? (
                <Badge tone="neutral">
                  <Clock className="h-3 w-3" /> {videoData.duration}
                </Badge>
              ) : null}
            </div>
            <h2 className="text-xl font-bold tracking-tight text-ink">
              {videoData.title}
            </h2>
            {videoData.description ? (
              <div className="border-t border-slate-100 pt-4">
                <h3 className="mb-2 text-sm font-semibold text-ink">
                  About this tutorial
                </h3>
                <div
                  className="text-sm leading-relaxed text-muted [&_a]:text-primary [&_a]:underline [&_li]:ml-5 [&_ol]:list-decimal [&_ol]:pl-1 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-1"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.isSupported
                      ? DOMPurify.sanitize(videoData.description)
                      : "",
                  }}
                />
              </div>
            ) : null}
          </Card>
        </div>

        {/* Side panel */}
        <aside className="space-y-6">
          <Card className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Tutorial details
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <BookOpen className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs text-muted">Subject</p>
                  <p className="font-medium-custom text-ink">
                    {videoData.subject || "Tutorial"}
                  </p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-secondary-hover">
                  <GraduationCap className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs text-muted">Exam</p>
                  <p className="font-medium-custom text-ink">
                    {videoData.exam || "-"}
                  </p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <CalendarDays className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs text-muted">Year</p>
                  <p className="font-medium-custom text-ink">
                    {videoData.year || "-"}
                  </p>
                </div>
              </li>
            </ul>
          </Card>

          <Card className="flex items-center gap-3">
            <Avatar name={userName} />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted">
                Student
              </p>
              <p className="truncate text-sm font-semibold text-ink">
                {userName}
              </p>
            </div>
          </Card>

          <Card
            className="border-0 text-white shadow-glow"
            style={{ background: "var(--gradient-brand)" }}
          >
            <h3 className="mb-1 text-lg font-bold">Continue Learning</h3>
            <p className="mb-4 text-sm text-white/80">
              Explore more tutorials to keep your momentum going.
            </p>
            <Link
              href="/tutorials"
              className="inline-flex h-10 items-center rounded-full bg-white px-5 text-sm font-medium-custom text-primary transition hover:bg-primary-light"
            >
              Browse all tutorials
            </Link>
          </Card>
        </aside>
      </section>
    </PortalWrapper>
  );
}

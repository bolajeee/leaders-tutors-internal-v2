import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { AlertCircle, LockKeyhole, RefreshCw } from "lucide-react";

type Icon = ComponentType<{ className?: string }>;

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
  compact = false,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="alert"
      className={`grid place-items-center text-center ${compact ? "px-4 py-8" : "px-6 py-16"}`}
    >
      <AlertCircle className="h-9 w-9 text-red-500" aria-hidden />
      <h2 className="mt-4 font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary-color)] px-4 text-sm font-semibold text-white hover:bg-[var(--primary-hover-color)]"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export function EmptyPanel({
  icon: IconComponent,
  title,
  message,
  action,
}: {
  icon: Icon;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center px-6 py-14 text-center">
      <span className="rounded-2xl bg-slate-50 p-4 text-slate-500">
        <IconComponent className="h-7 w-7" />
      </span>
      <h2 className="mt-4 font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingRows({ label, rows = 3 }: { label: string; rows?: number }) {
  return (
    <div role="status" aria-live="polite" className="space-y-4 p-6">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="skeleton h-16 rounded-xl" />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Shown wherever an expired student meets protected content. */
export function ExpiredNotice({
  title = "Your learning access has expired",
  message = "You can still browse the curriculum. Renew to open lessons.",
  onRenew,
  href,
}: {
  title?: string;
  message?: string;
  onRenew?: () => void;
  href?: string;
}) {
  const className =
    "inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary-color)] px-5 text-sm font-semibold text-slate-950 hover:bg-[var(--secondary-hover-color)] hover:text-white";
  return (
    <div
      role="status"
      className="flex flex-col gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex gap-3">
        <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-orange-700" aria-hidden />
        <div>
          <p className="font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-700">{message}</p>
        </div>
      </div>
      {href ? (
        <Link href={href} className={className}>
          Renew access
        </Link>
      ) : (
        <button type="button" onClick={onRenew} className={className}>
          Renew access
        </button>
      )}
    </div>
  );
}

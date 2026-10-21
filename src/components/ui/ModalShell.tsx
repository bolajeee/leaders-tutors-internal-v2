"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalShellProps {
  isOpen: boolean;
  title: string;
  /** Called on Escape, backdrop click and the close button. */
  onClose: () => void;
  children: ReactNode;
  icon?: ReactNode;
  closeLabel?: string;
  /** Disable dismissal while an action is in flight. */
  dismissible?: boolean;
  maxWidth?: string;
}

/** Open modals, innermost last. Only the top one reacts to the keyboard. */
const modalStack: symbol[] = [];

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal: role=dialog + aria-modal, labelled by its title, traps Tab
 * focus, closes on Escape, locks page scroll and restores focus on close.
 */
export default function ModalShell({
  isOpen,
  title,
  onClose,
  children,
  icon,
  closeLabel = "Close dialog",
  dismissible = true,
  maxWidth = "max-w-md",
}: ModalShellProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);

  useEffect(() => {
    onCloseRef.current = onClose;
    dismissibleRef.current = dismissible;
  });

  useEffect(() => {
    if (!isOpen) return;
    const self = Symbol("modal");
    modalStack.push(self);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    (focusables()[0] ?? panel)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== self) return;
      if (event.key === "Escape" && dismissibleRef.current) {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      modalStack.splice(modalStack.indexOf(self), 1);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && dismissible) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`max-h-[90vh] w-full ${maxWidth} overflow-y-auto rounded-2xl bg-white shadow-2xl outline-none`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div className="flex min-w-0 items-center gap-3">
            {icon && (
              <span className="shrink-0 rounded-xl bg-indigo-50 p-2.5 text-[var(--primary-color)]">
                {icon}
              </span>
            )}
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={!dismissible}
            aria-label={closeLabel}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useScrollLock } from "@/hooks/useScrollLock";

// Create a single portal container
const createPortalContainer = () => {
  const container = document.createElement("div");
  container.id = "modal-portal-container";
  document.body.appendChild(container);
  return container;
};

// Get or create portal container
const getPortalContainer = () => {
  let container = document.getElementById("modal-portal-container");
  if (!container) {
    container = createPortalContainer();
  }
  return container;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  /** Content to be rendered inside the modal */
  children: React.ReactNode;
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback when the modal is closed */
  onClose?: () => void;
  /** Whether to close the modal when clicking outside */
  closeOnOutsideClick?: boolean;
  /** Additional class names for the modal */
  className?: string;
  /** Id of the element that titles the dialog. */
  ariaLabelledBy?: string;
  /** Accessible name when no visible title exists. */
  ariaLabel?: string;
}

export const Modal: React.FC<ModalProps> = ({
  children,
  isOpen,
  onClose,
  closeOnOutsideClick = false,
  className = "",
  ariaLabelledBy,
  ariaLabel,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useClickOutside(
    modalRef as React.RefObject<HTMLElement>,
    onClose ?? (() => {}),
    closeOnOutsideClick,
  );

  useScrollLock({ isOpen });

  // Move focus into the dialog, keep Tab inside it, close on Escape, and
  // return focus to the opener afterwards.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusables = () =>
      Array.from(dialog?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    (focusables()[0] ?? dialog)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onCloseRef.current) {
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
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  // Cleanup portal container when no modals are open
  useEffect(() => {
    return () => {
      const container = document.getElementById("modal-portal-container");
      if (container && !container.hasChildNodes()) {
        container.remove();
      }
    };
  }, []);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={dialogRef}
      tabIndex={-1}
      className={`fixed w-full h-full inset-0 z-[999] overflow-y-auto bg-black/50 transition-opacity duration-200 ease-in-out outline-none ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabelledBy ? undefined : ariaLabel}
    >
      <div
        ref={modalRef}
        className={`w-full h-full relative transform transition-all duration-200 ease-in-out z-[1000]`}
      >
        {children}
      </div>
    </div>,
    getPortalContainer(),
  );
};

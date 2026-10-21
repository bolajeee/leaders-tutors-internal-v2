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
  ariaLabelledBy?: string;
}

export const Modal: React.FC<ModalProps> = ({
  children,
  isOpen,
  onClose,
  closeOnOutsideClick = false,
  className = "",
  ariaLabelledBy,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useClickOutside(
    modalRef as React.RefObject<HTMLElement>,
    onClose ?? (() => {}),
    closeOnOutsideClick,
  );

  useScrollLock({ isOpen });

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
      className={`fixed w-full h-full inset-0 z-[999] overflow-y-auto bg-black/50 transition-opacity duration-200 ease-in-out ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
    >
      <div
        ref={modalRef}
        className={`w-full h-full relative transform transition-all duration-200 ease-in-out z-[1000]`}
        role="document"
      >
        {children}
      </div>
    </div>,
    getPortalContainer(),
  );
};

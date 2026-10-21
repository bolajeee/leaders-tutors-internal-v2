import { useClickOutside } from "@/hooks/useClickOutside";
import { useScrollLock } from "@/hooks/useScrollLock";
import { ReactNode, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "../form";

interface SideDrawerProps {
  children: ReactNode;
  onClose: () => void;
  isOpen: boolean;
  width?: string;
  closeOnOutsideClick?: boolean;
  title?: string;
  className?: string;
  additionalAction?: ReactNode;
  icon?: ReactNode;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  children,
  onClose,
  isOpen,
  width = "500px",
  closeOnOutsideClick = false,
  title,
  className = "",
  additionalAction,
  icon,
}) => {
  const sideDrawerRef = useRef<HTMLDivElement>(null);

  useClickOutside(
    sideDrawerRef as React.RefObject<HTMLElement>,
    onClose,
    closeOnOutsideClick,
  );
  useScrollLock({ isOpen });

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1001]  animate-fade-right"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity duration-200 ease-in-out"
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={sideDrawerRef}
        className={`h-screen fixed right-0 top-0 bg-white shadow-xl transition-transform duration-200 ease-in-out transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } ${className}`}
        style={{ width }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-7 w-7 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary-color)]  to-[var(--secondary-color)] shadow-xl">
                {icon}
              </div>
            )}
            {title && (
              <h2 className="text-lg font-medium-custom text-[var(--title-color)]">
                {title}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-3">
            {additionalAction && (
              <div className="flex items-center gap-2">{additionalAction}</div>
            )}
            <Button
              size="sm"
              variant="secondary"
              text="Cancel"
              onClick={onClose}
            />
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-32px)] overflow-y-auto p-7 px-6 pb-0">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
};

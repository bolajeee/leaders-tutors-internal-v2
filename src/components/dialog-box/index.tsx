"use client";
import React, {
  useEffect,
  useState,
  useCallback,
  ReactElement,
  HTMLAttributes,
} from "react";
import { createPortal } from "react-dom";

// Todo:  lets agree on the lib to use instead of re inventing the wheels
type ConfirmDialogProps = {
  onConfirm: () => void;
  onCancel?: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
};

type DialogState = {
  isOpen: boolean;
  props: ConfirmDialogProps | null;
  position: { top: number; left: number } | null;
};

const dialogState = {
  current: null as DialogState | null,
  listeners: new Set<(state: DialogState | null) => void>(),

  set(state: DialogState | null) {
    this.current = state;
    this.listeners.forEach((listener) => listener(state));
  },

  subscribe(listener: (state: DialogState | null) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
};

const useDialogState = () => {
  const [state, setState] = useState<DialogState | null>(dialogState.current);

  useEffect(() => {
    const unsubscribe = dialogState.subscribe(setState);
    return () => {
      unsubscribe();
    };
  }, []);

  const open = useCallback(
    (props: ConfirmDialogProps, element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      const dialogHeight = 120;
      const dialogWidth = 240;

      let top = rect.top;
      let left = rect.left;

      // Position above the element if there's not enough space below
      if (rect.bottom + dialogHeight > viewportHeight) {
        top = rect.top - dialogHeight - 8;
      } else {
        top = rect.bottom + 8;
      }

      // Center horizontally on the element
      left = rect.left + rect.width / 2;

      // Ensure dialog doesn't go off-screen horizontally
      if (left + dialogWidth / 2 > viewportWidth) {
        left = viewportWidth - dialogWidth / 2 - 8;
      } else if (left - dialogWidth / 2 < 0) {
        left = dialogWidth / 2 + 8;
      }

      if (top < 8) {
        top = 8;
      } else if (top + dialogHeight > viewportHeight) {
        top = viewportHeight - dialogHeight - 8;
      }

      dialogState.set({
        isOpen: true,
        props,
        position: { top, left },
      });
    },
    [],
  );

  const close = useCallback(() => {
    dialogState.set(null);
  }, []);

  return { state, open, close };
};

const ConfirmDialog = ({
  position,
  onConfirm,
  onCancel,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Yes, Delete",
  cancelText = "Cancel",
  variant = "danger",
}: ConfirmDialogProps & { position: { top: number; left: number } | null }) => {
  const [isVisible, setIsVisible] = useState(false);

  const variantStyles = {
    danger: {
      button: "bg-[#C1272D] hover:bg-[#a11f24] text-white",
    },
    warning: {
      button: "bg-yellow-500 hover:bg-yellow-600 text-white",
    },
    info: {
      button: "bg-blue-500 hover:bg-blue-600 text-white",
    },
  };

  useEffect(() => {
    if (position) {
      setTimeout(() => setIsVisible(true), 50);
    }
  }, [position]);

  if (!position) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[9998] bg-black/20 transition-opacity duration-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        id="confirm-dialog"
        className={`fixed z-[9999] bg-white shadow-xl p-4 rounded-xl border border-gray-200 max-w-[240px] transition-all duration-300 ease-out ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: "translateX(-50%)",
          filter: "drop-shadow(0 10px 25px rgba(0, 0, 0, 0.15))",
        }}
      >
        <h3 className="text-sm font-medium-custom mb-2 text-gray-900">
          {title}
        </h3>
        <p className="text-xs text-gray-600 mb-4 leading-relaxed">{message}</p>
        <div className="flex gap-2">
          <button
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${variantStyles[variant].button} hover:shadow-md`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
          <button
            className="flex-1 px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 hover:shadow-md"
            onClick={onCancel}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
};

const DialogContainer = () => {
  const { state, close } = useDialogState();

  if (!state?.isOpen || !state.props) return null;

  return (
    <ConfirmDialog
      {...state.props}
      position={state.position}
      onCancel={() => {
        close();
        state.props?.onCancel?.();
      }}
      onConfirm={() => {
        close();
        state.props?.onConfirm();
      }}
    />
  );
};

const DialogPortal = () => {
  if (typeof window === "undefined") return null;

  return createPortal(<DialogContainer />, document.body);
};

// ✅ Fixed Trigger with correct typing
type TriggerProps<T extends HTMLElement> = {
  children: ReactElement<HTMLAttributes<T>>;
  dialogProps: ConfirmDialogProps;
  onDialogOpen?: () => void;
};

const DialogTrigger = <T extends HTMLElement>({
  children,
  dialogProps,
  onDialogOpen,
}: TriggerProps<T>) => {
  const { open } = useDialogState();

  const handleClick = (e: React.MouseEvent<T>) => {
    e.stopPropagation();
    open(dialogProps, e.currentTarget);
    onDialogOpen?.();
  };

  return React.cloneElement(children, { onClick: handleClick });
};

ConfirmDialog.Trigger = DialogTrigger;
ConfirmDialog.Dialog = DialogPortal;

export { ConfirmDialog };

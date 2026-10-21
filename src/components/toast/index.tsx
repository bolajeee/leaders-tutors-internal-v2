"use client";

import { Check, X, Info, AlertCircle } from "lucide-react";
import React from "react";
import {
  Slide,
  toast,
  ToastContainer,
  type ToastOptions,
} from "react-toastify";

type ToastVariant = "success" | "error" | "info" | "warning";

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <Check className="h-5 w-5 text-white" />,
  error: <X className="h-5 w-5 text-white" />,
  info: <Info className="h-5 w-5 text-white" />,
  warning: <AlertCircle className="h-5 w-5 text-white" />,
};

const ICON_BG_COLORS: Record<ToastVariant, string> = {
  success: "bg-green-500",
  error: "bg-red-500",
  info: "bg-blue-500",
  warning: "bg-amber-500",
};

const ToastContent = ({
  title,
  message,
  icon,
  iconBgColor,
}: {
  title?: string;
  message?: string;
  icon: React.ReactNode;
  iconBgColor: string;
}) => (
  <div className="flex items-start gap-3 w-full font-dta-regular">
    <div className={`${iconBgColor} rounded-full p-1 flex-shrink-0`}>
      {icon}
    </div>
    <div className="flex-1">
      <h3 className="text-white text-lg font-medium-custom">{title}</h3>
      <p className="text-gray-500">{message}</p>
    </div>
  </div>
);

export function ToastContainerWrapper() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar
      newestOnTop
      closeOnClick={false}
      pauseOnFocusLoss
      pauseOnHover
      draggable={false}
      transition={Slide}
      stacked={false}
      theme="light"
      limit={1}
      toastClassName="relative flex p-4 min-h-[100px] rounded-lg justify-between overflow-hidden cursor-pointer max-w-[90vw] sm:max-w-md"
      closeButton={({ closeToast }) => (
        <button
          onClick={closeToast}
          className="self-center font-dta-regular cursor-pointer bg-[var(--primary-color)] text-[11px] text-white font-medium-custom px-3 py-2 rounded-full  transition-colors whitespace-nowrap"
        >
          Dismiss
        </button>
      )}
    />
  );
}

export function showToast({
  variant,
  title,
  message,
  options,
}: {
  variant: ToastVariant;
  title?: string;
  message?: string;
  options?: ToastOptions;
}) {
  toast.dismiss();

  return toast[variant](
    <ToastContent
      title={title || ""}
      message={message || ""}
      icon={ICONS[variant]}
      iconBgColor={ICON_BG_COLORS[variant]}
    />,
    { icon: false, ...options },
  );
}

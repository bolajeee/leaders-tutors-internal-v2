import { ReactElement } from "react";

export type ConfirmDialogProps = {
  onConfirm: () => void;
  onCancel?: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
};

export type DialogState = {
  isOpen: boolean;
  props: ConfirmDialogProps | null;
  position: { top: number; left: number } | null;
};

export type TriggerProps = {
  children: ReactElement;
  dialogProps: ConfirmDialogProps;
  onDialogOpen?: () => void;
};

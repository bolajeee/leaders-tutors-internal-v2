import { SuccessCheckmark } from "../icons/SuccessCheckmark";
import { FailureIcon } from "../icons/FailureIcon";
import { InfoIcon } from "../icons/InfoIcon";
import { Modal } from "../dialog-box/Modal";
import { Button } from "../form/Buttons";
import { WarningIcon } from "../icons/warningIcon";

export type FeedbackDialogVariant = "success" | "error" | "info" | "warning";

interface FeedbackDialogProps {
  /** Title of the dialog */
  title?: string;
  /** Main text content of the dialog */
  text?: string;
  /** Text for the primary action button */
  btnText?: string;
  /** Callback when the dialog is closed */
  onClose?: () => void;
  /** Callback when the primary action button is clicked */
  onClick?: () => void;
  /** Whether the dialog is in a loading state */
  isLoading?: boolean;
  /** Whether the dialog is visible */
  isOpen: boolean;
  /** Variant of the dialog to determine styling */
  variant?: FeedbackDialogVariant;
  /** Additional class names for the dialog */
  className?: string;
  /** Loading text */
  loadingText?: string;
}

const getVariantIcon = (variant: FeedbackDialogVariant = "info") => {
  const icons = {
    success: <SuccessCheckmark />,
    error: <FailureIcon />,
    info: <InfoIcon />,
    warning: <WarningIcon />,
  };
  return icons[variant];
};

const getVariantBorder = (variant: FeedbackDialogVariant = "info") => {
  const borders = {
    success: "border-green-500",
    error: "border-red-400",
    info: "border-blue-500",
    warning: "border-yellow-500",
  };
  return borders[variant];
};

export const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  title,
  text,
  btnText,
  onClose,
  onClick,
  isLoading,
  isOpen,
  variant = "info",
  loadingText = "",
  className = "",
}) => {
  if (!isOpen) return null;

  const icon = getVariantIcon(variant);
  const borderClass = getVariantBorder(variant);

  const content = isLoading ? (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-75 space-y-2 min-h-50 bg-white rounded-xl p-10 flex flex-col gap-3 justify-center items-center text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-(--secondary-color)"></div>
        <span>{loadingText || "Loading..."}</span>
      </div>
    </div>
  ) : (
    <div className="w-full h-full flex items-center justify-center">
      <div
        className={`w-[90%] max-w-125 min-h-62.5 m-auto bg-white rounded-xl p-10 flex flex-col gap-3 justify-center items-center text-center border-2 ${borderClass} `}
        role="document"
      >
        {icon && (
          <div className="shrink-0 mb-2" aria-hidden="true">
            {icon}
          </div>
        )}

        {title && (
          <h3
            id="feedback-dialog-title"
            className="font-bold-custom text-lg text-(--body-color)"
          >
            {title}
          </h3>
        )}

        {text && (
          <p className="text-(--text-color) text-sm leading-relaxed">{text}</p>
        )}
        <div className="w-full mt-2 flex gap-4">
          {onClose && (
            <Button
              text="Cancel"
              onClick={onClose}
              fullWidth
              className="bg-gray-500 hover:bg-gray-600"
            />
          )}
          {btnText && (
            <Button
              text={btnText}
              onClick={onClick}
              fullWidth
              variant={
                variant === "error" || variant === "warning"
                  ? "danger"
                  : "primary"
              }
            />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={className}>
      {content}
    </Modal>
  );
};

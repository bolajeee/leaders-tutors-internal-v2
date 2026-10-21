import { InfoIcon, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"; // You can replace these with your own icons
import { FC } from "react";

type NotificationType = "info" | "warning" | "success" | "error";

type InlineNotificationProps = {
  type?: NotificationType;
  title?: string;
  description: string;
  actionBtn?: boolean;
  actionBtnText?: string;
  onActionBtnClick?: () => void;
};

const typeStyles: Record<
  NotificationType,
  {
    bg: string;
    text: string;
    border: string;
    Icon: FC;
  }
> = {
  info: {
    bg: "bg-blue-100",
    text: "text-blue-600",
    border: "border-blue-300",
    Icon: InfoIcon,
  },
  warning: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-300",
    Icon: AlertTriangle,
  },
  success: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
    Icon: CheckCircle2,
  },
  error: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
    Icon: XCircle,
  },
};

const InlineNotification: FC<InlineNotificationProps> = ({
  type = "info",
  title,
  description,
  actionBtn,
  onActionBtnClick,
  actionBtnText = "Okay",
}) => {
  const { bg, text, border, Icon } = typeStyles[type];

  return (
    <div
      className={`p-3 rounded-lg border ${border} ${text} ${bg} flex gap-2 items-start text-sm`}
    >
      <Icon />
      <div>
        {title && <strong className="block">{title}</strong>}
        <span>{description}</span>
      </div>
      {actionBtn && (
        <button
          className="ml-auto p-2 px-4 font-mtn bg-white rounded-[20px] hover:bg-white/50 transition-colors"
          onClick={onActionBtnClick}
        >
          {actionBtnText}
        </button>
      )}
    </div>
  );
};

export default InlineNotification;

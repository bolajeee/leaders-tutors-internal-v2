import { Badge, type BadgeTone } from "./Badge";
import type { TransactionStatus } from "@/types/payment";

const TONES: Record<TransactionStatus, { tone: BadgeTone; label: string }> = {
  success: { tone: "success", label: "Successful" },
  pending: { tone: "warning", label: "Pending" },
  failed: { tone: "danger", label: "Failed" },
  cancelled: { tone: "neutral", label: "Cancelled" },
};

export const TransactionStatusBadge = ({ status }: { status: TransactionStatus }) => (
  <Badge tone={TONES[status].tone} dot>
    {TONES[status].label}
  </Badge>
);

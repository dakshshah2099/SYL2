import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "shared" | "not-shared" | "pending" | "approved" | "denied" | "expired" | "active";
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  const statusStyles = {
    shared: "status-shared",
    "not-shared": "status-not-shared",
    pending: "status-pending",
    approved: "status-approved",
    denied: "status-denied",
    expired: "status-expired",
    active: "status-approved",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        statusStyles[status],
        className
      )}
    >
      {children}
    </span>
  );
}

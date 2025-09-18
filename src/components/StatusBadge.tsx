import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "insert" | "update" | "cancel" | "shipped" | "downloading" | "completed" | "failed" | "pending";
  className?: string;
}

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "insert":
        return {
          text: "Insert",
          className: "bg-status-success-bg text-status-success border-status-success/20"
        };
      case "update":
        return {
          text: "Update",
          className: "bg-status-info-bg text-status-info border-status-info/20"
        };
      case "cancel":
        return {
          text: "Cancel",
          className: "bg-status-error-bg text-status-error border-status-error/20"
        };
      case "shipped":
        return {
          text: "Shipped",
          className: "bg-status-success-bg text-status-success border-status-success/20"
        };
      case "downloading":
        return {
          text: "Downloading",
          className: "bg-status-pending-bg text-status-pending border-status-pending/20"
        };
      case "completed":
        return {
          text: "Completed",
          className: "bg-status-success-bg text-status-success border-status-success/20"
        };
      case "failed":
        return {
          text: "Failed",
          className: "bg-status-error-bg text-status-error border-status-error/20"
        };
      case "pending":
        return {
          text: "Pending",
          className: "bg-status-warning-bg text-status-warning border-status-warning/20"
        };
      default:
        return {
          text: status,
          className: "bg-muted text-muted-foreground"
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        config.className,
        className
      )}
    >
      {config.text}
    </Badge>
  );
};

export default StatusBadge;
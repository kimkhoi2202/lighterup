import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type JobStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "pending_review"
  | "completed"
  | "cancelled"
  | "disputed";

interface StatusBadgeProps {
  status: JobStatus;
  className?: string;
}

const statusConfig: Record<
  JobStatus,
  { label: string; className: string }
> = {
  open: {
    label: "Open",
    className: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  assigned: {
    label: "Assigned",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  },
  pending_review: {
    label: "Pending Review",
    className: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  },
  completed: {
    label: "Completed",
    className: "bg-gray-200 text-gray-600 hover:bg-gray-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-700 hover:bg-red-100",
  },
  disputed: {
    label: "Disputed",
    className: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge className={cn(config.className, className)} variant="outline">
      {config.label}
    </Badge>
  );
}

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/format";

interface JobFeedCardProps {
  job: {
    id: string;
    address: string;
    city: string;
    state: string;
    total_price_cents: number;
    complexity: "simple" | "medium" | "complex";
    lights_provided: boolean;
    storage_needed: boolean;
    estimated_length_feet: number;
    description: string;
    distance_miles?: number;
  };
  onAccept: (jobId: string) => void;
  onSkip: (jobId: string) => void;
  isAccepting?: boolean;
}

export function JobFeedCard({
  job,
  onAccept,
  onSkip,
  isAccepting = false,
}: JobFeedCardProps) {
  const complexityColors = {
    simple: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    complex: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <Card className="p-6 space-y-4">
      {/* Header with distance */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{job.address}</h3>
          <p className="text-sm text-muted-foreground">
            {job.city}, {job.state}
          </p>
        </div>
        {job.distance_miles !== undefined && (
          <Badge variant="secondary" className="ml-2">
            {job.distance_miles.toFixed(1)} mi
          </Badge>
        )}
      </div>

      {/* Job details */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Price:</span>
          <span className="text-lg font-bold text-[#EA2831]">
            {formatCurrency(job.total_price_cents)}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={complexityColors[job.complexity]}>
            {job.complexity.charAt(0).toUpperCase() + job.complexity.slice(1)}{" "}
            Complexity
          </Badge>
          {job.lights_provided && (
            <Badge variant="outline">Lights Provided</Badge>
          )}
          {job.storage_needed && (
            <Badge variant="outline">Storage Needed</Badge>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          <span className="font-medium">Estimated Length:</span>{" "}
          {job.estimated_length_feet} feet
        </div>

        {job.description && (
          <div className="text-sm">
            <p className="font-medium mb-1">Description:</p>
            <p className="text-muted-foreground line-clamp-2">
              {job.description}
            </p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={() => onSkip(job.id)}
          variant="outline"
          className="flex-1"
          disabled={isAccepting}
        >
          Skip
        </Button>
        <Button
          onClick={() => onAccept(job.id)}
          className="flex-1 bg-[#EA2831] hover:bg-[#EA2831]/90"
          disabled={isAccepting}
        >
          {isAccepting ? "Accepting..." : "Accept Job"}
        </Button>
      </div>
    </Card>
  );
}

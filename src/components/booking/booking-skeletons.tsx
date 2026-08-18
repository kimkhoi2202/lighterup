import { Skeleton } from "@/components/ui/skeleton";

export function EventMetaSkeleton() {
  return (
    <div className="flex h-full w-full flex-col space-y-6 p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="space-y-4 border-t border-zinc-100 pt-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    </div>
  );
}

export function DatePickerSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={`weekday-${index}`} className="h-5 rounded-md" />
        ))}
        {Array.from({ length: 35 }).map((_, index) => (
          <Skeleton key={`day-${index}`} className="aspect-square rounded-md" />
        ))}
      </div>
    </div>
  );
}

export function TimeSlotsSkeleton({ withHeader = true }: { withHeader?: boolean }) {
  return (
    <div className="flex h-full flex-col space-y-4">
      {withHeader && (
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-32" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-7 w-10 rounded-full" />
            <Skeleton className="h-7 w-10 rounded-full" />
          </div>
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={`slot-${index}`} className="h-9 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}

export function BookingFormSkeleton() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>

      <Skeleton className="h-16 w-full rounded-md" />

      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-4 w-40" />
        {Array.from({ length: 2 }).map((_, idx) => (
          <Skeleton key={idx} className="h-16 w-full rounded-md" />
        ))}
      </div>

      <div className="flex gap-3">
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}






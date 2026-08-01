import { Skeleton } from "@/components/ui/skeleton";

/**
 * Visual placeholder for the service detail modal while its content is being
 * prepared. Purely decorative — the announcement lives in the dialog's live
 * region, so screen readers hear one clear message instead of empty boxes.
 */
export function ServiceDialogSkeleton() {
  return (
    <div aria-hidden className="space-y-6 py-2">
      <div className="space-y-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>

      <div className="flex flex-wrap gap-2">
        {[64, 88, 72, 96].map((w) => (
          <Skeleton key={w} className="h-6 rounded-none" style={{ width: w }} />
        ))}
      </div>

      <div className="space-y-3">
        <Skeleton className="h-3 w-28" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-4 w-3/4" />
        ))}
      </div>

      <div className="space-y-3">
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-9 w-full rounded-none" />
        <Skeleton className="h-32 w-full rounded-none" />
        <Skeleton className="h-32 w-full rounded-none" />
      </div>
    </div>
  );
}

export default ServiceDialogSkeleton;

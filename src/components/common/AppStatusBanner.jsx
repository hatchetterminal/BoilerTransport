import { Info } from 'lucide-react';

export default function AppStatusBanner() {
  return (
    <div
      className="mx-4 mb-2 rounded-xl px-3 py-2 flex items-start gap-2 text-xs border bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300"
      role="status"
    >
      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
      <span>
        Parking locations follow Purdue’s published map; space availability is not reported. Bus and
        event details are sample data.
      </span>
    </div>
  );
}

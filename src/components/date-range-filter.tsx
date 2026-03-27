"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const RANGES = [
  { label: "اليوم", value: "today" },
  { label: "هذا الأسبوع", value: "week" },
  { label: "هذا الشهر", value: "month" },
  { label: "3 أشهر", value: "3months" },
];

export function DateRangeFilter({ activeRange }: { activeRange: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setRange = useCallback(
    (range: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("range", range);
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
      {RANGES.map((r) => (
        <button
          key={r.value}
          onClick={() => setRange(r.value)}
          className={`
            px-3 py-1.5 rounded-md text-sm font-medium transition-all
            ${
              activeRange === r.value
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }
          `}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

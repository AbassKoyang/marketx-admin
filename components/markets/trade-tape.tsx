"use client";

import Link from "next/link";
import { ArrowsLeftRight } from "@phosphor-icons/react";
import { useTrades } from "@/hooks/use-trading";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatProbability, formatRelativeTime } from "@/lib/utils";

export function TradeTape({ outcomeId }: { outcomeId?: number }) {
  const { data, isLoading } = useTrades(
    { page: 1, outcome: outcomeId },
    outcomeId != null,
  );

  const trades = data?.results ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Trade tape
        </span>
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
          {data?.count ?? 0} total
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-7 w-full" />
          ))}
        </div>
      ) : trades.length === 0 ? (
        <EmptyState
          icon={ArrowsLeftRight}
          title="No trades yet"
          description="Executions on this outcome will stream here."
          className="py-10"
        />
      ) : (
        <div className="flex flex-col divide-y divide-border/60">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className="flex items-center justify-between gap-3 px-0.5 py-2 text-[11px] transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono tabular-nums text-foreground">
                  {formatProbability(trade.price_decimal)}
                </span>
                <span className="text-muted-foreground">
                  × {trade.quantity}
                </span>
              </div>
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                {formatRelativeTime(trade.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/trades"
        className="text-[11px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        View full trade history
      </Link>
    </div>
  );
}

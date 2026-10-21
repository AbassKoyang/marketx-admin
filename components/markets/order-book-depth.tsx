"use client";

import { useMemo } from "react";
import { ArrowsDownUp } from "@phosphor-icons/react";
import { useOrderBook } from "@/hooks/use-markets";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import type { OrderBookLevel } from "@/lib/types";

function DepthRow({
  level,
  maxQuantity,
  tone,
}: {
  level: OrderBookLevel;
  maxQuantity: number;
  tone: "bid" | "ask";
}) {
  const width = maxQuantity > 0 ? (level.quantity / maxQuantity) * 100 : 0;

  return (
    <div className="relative flex items-center justify-between px-2.5 py-1.5">
      <span
        aria-hidden
        className={
          tone === "bid"
            ? "absolute inset-y-0 start-0 bg-foreground/8"
            : "absolute inset-y-0 end-0 bg-foreground/5"
        }
        style={{ width: `${width}%` }}
      />
      <span className="relative font-mono text-[11px] tabular-nums text-foreground">
        {formatPrice(level.price)}
      </span>
      <span className="relative font-mono text-[11px] tabular-nums text-muted-foreground">
        {level.quantity}
      </span>
    </div>
  );
}

function Column({
  title,
  levels,
  maxQuantity,
  tone,
}: {
  title: string;
  levels: OrderBookLevel[];
  maxQuantity: number;
  tone: "bid" | "ask";
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-2.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{title}</span>
        <span>Qty</span>
      </div>
      <div className="flex flex-col divide-y divide-border/60">
        {levels.length === 0 ? (
          <p className="px-2.5 py-3 text-[11px] text-muted-foreground">No orders</p>
        ) : (
          levels.map((level) => (
            <DepthRow
              key={`${tone}-${level.price}`}
              level={level}
              maxQuantity={maxQuantity}
              tone={tone}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function OrderBookDepth({
  outcomeId,
  isOpen,
}: {
  outcomeId?: number;
  isOpen: boolean;
}) {
  const { data, isLoading } = useOrderBook(outcomeId ?? 0, 8, isOpen);

  const { bids, asks, maxQuantity, spread } = useMemo(() => {
    const bids = [...(data?.bids ?? [])].sort((a, b) => b.price - a.price);
    const asks = [...(data?.asks ?? [])].sort((a, b) => a.price - b.price);
    const maxQuantity = Math.max(
      0,
      ...bids.map((level) => level.quantity),
      ...asks.map((level) => level.quantity),
    );
    const spread =
      bids[0] && asks[0] ? asks[0].price - bids[0].price : null;
    return { bids, asks, maxQuantity, spread };
  }, [data]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Order book
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span
            aria-hidden
            className={
              isOpen
                ? "size-1.5 rounded-full bg-foreground"
                : "size-1.5 rounded-full bg-muted-foreground/30"
            }
          />
          {isOpen ? "Live" : "Stopped"}
          {spread != null && (
            <span className="ms-1 font-mono tabular-nums">
              · spread {formatPrice(spread)}
            </span>
          )}
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : !data || (bids.length === 0 && asks.length === 0) ? (
        <EmptyState
          icon={ArrowsDownUp}
          title="Empty book"
          description="No resting orders for this outcome."
          className="py-10"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Column
            title="Bids"
            levels={bids}
            maxQuantity={maxQuantity}
            tone="bid"
          />
          <Column
            title="Asks"
            levels={asks}
            maxQuantity={maxQuantity}
            tone="ask"
          />
        </div>
      )}
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import {
  ActivityIcon,
  ArrowRight,
  ArrowsLeftRight,
  CheckCircle,
  Scales,
  XCircle,
} from "@phosphor-icons/react";
import { useActivity } from "@/hooks/use-activity";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatCredits,
  formatRelativeTime,
  formatTickProbability,
} from "@/lib/utils";
import type { ActivityEvent } from "@/lib/types";

function numberPayload(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "number" ? value : null;
}

function describeEvent(event: ActivityEvent) {
  const payload = (event.payload ?? {}) as Record<string, unknown>;
  const quantity = numberPayload(payload, "quantity");
  const notional = numberPayload(payload, "notional");
  const price = numberPayload(payload, "price");
  const limit = numberPayload(payload, "limit_price");
  const side = typeof payload.side === "string" ? payload.side : null;

  switch (event.event_type) {
    case "trade_executed":
      return {
        icon: ArrowsLeftRight,
        title: "Trade executed",
        description: `${quantity ?? "—"} contracts at ${
          price != null ? formatTickProbability(price) : "—"
        }${notional != null ? ` · ${formatCredits(notional)} credits` : ""}`,
      };
    case "order_placed": {
      const isMarketOrder =
        limit == null || (side === "buy" && limit === 9_999) || (side === "sell" && limit === 1);
      return {
        icon: ArrowRight,
        title: "Order placed",
        description: `${side ? side.toUpperCase() : "Order"} ${
          quantity ?? ""
        } contracts · ${
          isMarketOrder
            ? "market order"
            : `slippage cap ${formatTickProbability(limit)}`
        }`,
      };
    }
    case "order_filled":
      return {
        icon: CheckCircle,
        title: "Order filled",
        description: `${quantity ?? ""} contracts${
          notional != null ? ` · ${formatCredits(notional)} credits` : ""
        }`,
      };
    case "order_cancelled":
      return {
        icon: XCircle,
        title: "Order cancelled",
        description: "Legacy resting order cancelled and reservations released",
      };
    case "position_settled": {
      const payout = numberPayload(payload, "payout");
      return {
        icon: Scales,
        title: "Position settled",
        description:
          payout != null
            ? `Settlement payout ${formatCredits(payout)} credits`
            : "Resolution settled the contract payout",
      };
    }
    default:
      return {
        icon: ActivityIcon,
        title: "Activity",
        description: "System event",
      };
  }
}

export function ActivityFeed({
  outcomeId,
  limit,
  showLoadMore = false,
}: {
  outcomeId?: number;
  limit?: number;
  showLoadMore?: boolean;
}) {
  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useActivity(outcomeId);

  const events = data?.pages.flatMap((page) => page.results) ?? [];
  const visible = limit ? events.slice(0, limit) : events;

  if (isLoading) {
    return <TableSkeleton rows={6} cols={3} />;
  }

  if (visible.length === 0) {
    return (
      <EmptyState
        icon={ActivityIcon}
        title="No activity yet"
        description="Orders, executions, and settlements will appear here as they happen."
        className="py-10"
      />
    );
  }

  return (
    <div className="flex flex-col">
      <div className="divide-y divide-border">
        {visible.map((event, index) => {
          const info = describeEvent(event);
          const Icon = info.icon;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                duration: 0.3,
                bounce: 0,
                delay: Math.min(index * 0.02, 0.16),
              }}
              className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs transition-colors hover:bg-muted/40"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex size-6 shrink-0 items-center justify-center border border-border bg-muted/40 text-foreground">
                  <Icon size={12} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground">{info.title}</span>
                    <Badge
                      variant={event.visibility === "public" ? "outline" : "secondary"}
                      className="h-4 px-1 text-[9px] uppercase tracking-wider"
                    >
                      {event.visibility}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {info.description}
                  </p>
                </div>
              </div>
              <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                {formatRelativeTime(event.created_at)}
              </span>
            </motion.div>
          );
        })}
      </div>

      {showLoadMore && hasNextPage && (
        <div className="border-t border-border p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading…" : "Load older events"}
          </Button>
        </div>
      )}
    </div>
  );
}

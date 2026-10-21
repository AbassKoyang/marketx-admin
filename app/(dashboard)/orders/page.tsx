"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ListChecks, X } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useCancelOrder, useOrders } from "@/hooks/use-trading";
import { useOutcomes } from "@/hooks/use-outcomes";
import { getApiErrorMessage } from "@/lib/api";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Order, OrderStatus } from "@/lib/types";

const STATUS_VARIANT: Record<
  OrderStatus,
  "default" | "secondary" | "outline"
> = {
  open: "default",
  partially_filled: "outline",
  filled: "secondary",
  cancelled: "outline",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  open: "Open",
  partially_filled: "Partial",
  filled: "Filled",
  cancelled: "Cancelled",
};

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [cancelling, setCancelling] = useState<Order | null>(null);

  const { data, isLoading, isFetching } = useOrders(page);
  const cancelOrder = useCancelOrder();
  const { data: outcomesData } = useOutcomes();

  const outcomeNames = useMemo(() => {
    const map = new Map<number, string>();
    outcomesData?.results.forEach((item) => map.set(item.id, item.name));
    return map;
  }, [outcomesData]);

  const orders = data?.results ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Orders"
        description="Your operational orders. These are scoped to your account, not platform-wide."
      />

      {isLoading ? (
        <div className="border border-border bg-card">
          <TableSkeleton rows={8} cols={5} />
        </div>
      ) : orders.length === 0 ? (
        <div className="border border-border bg-card">
          <EmptyState
            icon={ListChecks}
            title="No orders"
            description="Submit an order from a market page or the trading API to see it here."
          />
        </div>
      ) : (
        <div className="border border-border bg-card">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-4">Order</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead className="text-end">Limit</TableHead>
                  <TableHead className="text-end">Filled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-end">Placed</TableHead>
                  <TableHead className="w-16 pe-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      duration: 0.3,
                      bounce: 0,
                      delay: Math.min(index * 0.02, 0.16),
                    }}
                    className="border-b transition-colors hover:bg-muted/40"
                  >
                    <TableCell className="ps-4">
                      <p className="font-mono text-[11px] tabular-nums text-foreground">
                        #{order.id}
                      </p>
                      <p className="mt-0.5 max-w-32 truncate font-mono text-[10px] text-muted-foreground">
                        {order.client_order_id}
                      </p>
                    </TableCell>
                    <TableCell className="text-[11px]">
                      {outcomeNames.get(order.outcome) ?? `Outcome #${order.outcome}`}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={order.side === "buy" ? "default" : "outline"}
                        className="text-[10px] uppercase tracking-wider"
                      >
                        {order.side}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end font-mono text-[11px] tabular-nums">
                      {formatPrice(order.limit_price)}
                    </TableCell>
                    <TableCell className="text-end font-mono text-[11px] tabular-nums">
                      {order.filled_quantity}/{order.original_quantity}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={STATUS_VARIANT[order.status]}
                        className="text-[10px] uppercase tracking-wider"
                      >
                        {STATUS_LABEL[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end text-[11px] text-muted-foreground tabular-nums">
                      {formatDateTime(order.created_at)}
                    </TableCell>
                    <TableCell className="pe-4">
                      {(order.status === "open" ||
                        order.status === "partially_filled") && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setCancelling(order)}
                          aria-label={`Cancel order ${order.id}`}
                        >
                          <X size={13} />
                        </Button>
                      )}
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="divide-y divide-border md:hidden">
            {orders.map((order) => (
              <li key={order.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">
                      {outcomeNames.get(order.outcome) ?? `Outcome #${order.outcome}`}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      #{order.id} · {formatDateTime(order.created_at)}
                    </p>
                  </div>
                  <Badge
                    variant={STATUS_VARIANT[order.status]}
                    className="text-[9px] uppercase tracking-wider"
                  >
                    {STATUS_LABEL[order.status]}
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={order.side === "buy" ? "default" : "outline"}
                      className="text-[9px] uppercase tracking-wider"
                    >
                      {order.side}
                    </Badge>
                    <span className="font-mono tabular-nums">
                      {formatPrice(order.limit_price)}
                    </span>
                    <span className="text-muted-foreground">
                      · {order.filled_quantity}/{order.original_quantity}
                    </span>
                  </div>

                  {(order.status === "open" ||
                    order.status === "partially_filled") && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setCancelling(order)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <Pagination
            page={page}
            count={data?.count ?? 0}
            onPageChange={setPage}
            className={isFetching ? "opacity-70" : undefined}
          />
        </div>
      )}

      <ConfirmDialog
        open={!!cancelling}
        onOpenChange={(open) => {
          if (!open) setCancelling(null);
        }}
        title={`Cancel order #${cancelling?.id ?? ""}?`}
        description="Cancelling releases any reserved credits or position quantity. This cannot be undone."
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        destructive
        loading={cancelOrder.isPending}
        onConfirm={() => {
          if (!cancelling) return;
          cancelOrder.mutate(cancelling.id, {
            onSuccess: () => {
              toast.success("Order cancelled");
              setCancelling(null);
            },
            onError: (error) => toast.error(getApiErrorMessage(error)),
          });
        }}
      />
    </div>
  );
}

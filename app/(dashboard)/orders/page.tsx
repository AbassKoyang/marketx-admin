"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ListChecks, MagnifyingGlass, X } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAdminOrders, useCancelAdminOrder } from "@/hooks/use-admin";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getApiErrorMessage } from "@/lib/api";
import { formatDateTime, formatProbability } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { UserCell } from "@/components/shared/user-cell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminOrder, OrderStatus } from "@/lib/types";

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

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "partially_filled", label: "Partial" },
  { value: "filled", label: "Filled" },
  { value: "cancelled", label: "Cancelled" },
];

const SIDE_OPTIONS = [
  { value: "all", label: "All sides" },
  { value: "buy", label: "Buy" },
  { value: "sell", label: "Sell" },
];

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [side, setSide] = useState("all");
  const [cancelling, setCancelling] = useState<AdminOrder | null>(null);
  const debouncedSearch = useDebouncedValue(search, 350);

  const { data, isLoading, isFetching, isError } = useAdminOrders({
    page,
    search: debouncedSearch,
    status: status === "all" ? "" : status,
    side: side === "all" ? "" : side,
  });
  const cancelOrder = useCancelAdminOrder();

  const orders = data?.results ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Orders"
        description="Every order on the platform. Cancel open orders to release reserved credits or contracts."
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={14}
            className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by user, market, outcome, or order id…"
            className="ps-8"
            aria-label="Search orders"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:w-40">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Status
          </Label>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(String(value ?? "all"));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 sm:w-36">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Side
          </Label>
          <Select
            value={side}
            onValueChange={(value) => {
              setSide(String(value ?? "all"));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIDE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="border border-border bg-card">
          <TableSkeleton rows={8} cols={6} />
        </div>
      ) : isError ? (
        <div className="border border-border bg-card">
          <EmptyState
            icon={ListChecks}
            title="Could not load orders"
            description="Staff access is required to view platform orders."
          />
        </div>
      ) : orders.length === 0 ? (
        <div className="border border-border bg-card">
          <EmptyState
            icon={ListChecks}
            title="No orders"
            description={
              debouncedSearch || status !== "all" || side !== "all"
                ? "No orders match these filters."
                : "Orders will appear here as soon as users place them."
            }
          />
        </div>
      ) : (
        <div
          className={
            "border border-border bg-card" +
            (isFetching ? " opacity-70 transition-opacity" : "")
          }
        >
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-4">User</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead className="text-end">Limit</TableHead>
                  <TableHead className="text-end">Filled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-end">Placed</TableHead>
                  <TableHead className="w-12 pe-4" />
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
                      <UserCell
                        user={order.user}
                        href={`/users/${order.user.id}`}
                        className="min-w-40"
                      />
                    </TableCell>
                    <TableCell>
                      <p className="max-w-56 truncate text-[11px] font-medium">
                        {order.market_title}
                      </p>
                      <p className="max-w-56 truncate text-[10px] text-muted-foreground">
                        {order.outcome_name}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={order.side === "buy" ? "default" : "outline"}
                        className="text-[9px] uppercase tracking-wider"
                      >
                        {order.side}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end font-mono text-[11px] tabular-nums">
                      {formatProbability(order.limit_price / 10_000)}
                    </TableCell>
                    <TableCell className="text-end font-mono text-[11px] tabular-nums">
                      {order.filled_quantity}/{order.original_quantity}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={STATUS_VARIANT[order.status]}
                        className="text-[9px] uppercase tracking-wider"
                      >
                        {STATUS_LABEL[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end text-[10px] text-muted-foreground tabular-nums">
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
                  <UserCell
                    user={order.user}
                    href={`/users/${order.user.id}`}
                    className="min-w-0"
                  />
                  <Badge
                    variant={STATUS_VARIANT[order.status]}
                    className="shrink-0 text-[9px] uppercase tracking-wider"
                  >
                    {STATUS_LABEL[order.status]}
                  </Badge>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">
                    {order.market_title}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {order.outcome_name}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2 font-mono tabular-nums">
                    <Badge
                      variant={order.side === "buy" ? "default" : "outline"}
                      className="text-[9px] uppercase tracking-wider"
                    >
                      {order.side}
                    </Badge>
                    {formatProbability(order.limit_price / 10_000)}
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

                <p className="font-mono text-[10px] text-muted-foreground">
                  #{order.id} · {formatDateTime(order.created_at)}
                </p>
              </li>
            ))}
          </ul>

          <Pagination
            page={page}
            count={data?.count ?? 0}
            pageSize={20}
            onPageChange={setPage}
            className={isFetching ? "opacity-70" : undefined}
          />
        </div>
      )}

      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <Link href="/users" className="underline-offset-2 hover:underline">
          Manage users
        </Link>
        to inspect an account&apos;s wallet, positions, and ledger.
      </div>

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

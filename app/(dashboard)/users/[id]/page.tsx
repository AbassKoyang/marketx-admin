"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowsLeftRight,
  Briefcase,
  Coins,
  ListChecks,
  Lock,
  Receipt,
  TrendUp,
  User as UserIcon,
} from "@phosphor-icons/react";
import {
  useAdminOrders,
  useAdminPositions,
  useAdminTrades,
  useAdminUser,
  useAdminUserLedger,
} from "@/hooks/use-admin";
import { getApiErrorMessage } from "@/lib/api";
import {
  formatCredits,
  formatDate,
  formatDateTime,
  formatSignedCredits,
  formatTickProbability,
  tradeNotional,
} from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { MetricCard } from "@/components/shared/metric-card";
import { UserCell, userDisplayName, userInitials } from "@/components/shared/user-cell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OrderStatus } from "@/lib/types";

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

type TabKey = "positions" | "orders" | "trades" | "ledger";

function isMarketOrder(order: { side: string; limit_price: number }) {
  return (
    (order.side === "buy" && order.limit_price === 9_999) ||
    (order.side === "sell" && order.limit_price === 1)
  );
}

function positionStateLabel(position: {
  settled_at: string | null;
  market_status: string;
}) {
  if (position.settled_at) return "Settled";
  if (position.market_status === "closed") return "Awaiting resolution";
  if (position.market_status === "void") return "Void";
  return "Open";
}

function pnl(units: number | null) {
  if (units == null || units === 0) return "—";
  return formatSignedCredits(units);
}

function PanelShell({
  children,
  isFetching,
  page,
  count,
  pageSize = 20,
  onPageChange,
}: {
  children: React.ReactNode;
  isFetching: boolean;
  page: number;
  count: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div
      className={
        "border border-border bg-card" +
        (isFetching ? " opacity-70 transition-opacity" : "")
      }
    >
      {children}
      <Pagination
        page={page}
        count={count}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </div>
  );
}

function PositionsPanel({ userId }: { userId: number }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useAdminPositions({
    page,
    user: userId,
  });
  const positions = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="border border-border bg-card">
        <TableSkeleton rows={6} cols={6} />
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="border border-border bg-card">
        <EmptyState
          icon={Briefcase}
          title="No positions"
          description="This account has not held any contracts yet."
        />
      </div>
    );
  }

  return (
    <PanelShell
      isFetching={isFetching}
      page={page}
      count={data?.count ?? 0}
      onPageChange={setPage}
    >
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="ps-4">Market</TableHead>
              <TableHead className="text-end">Qty</TableHead>
              <TableHead className="text-end">Price</TableHead>
              <TableHead className="text-end">Value / cost</TableHead>
              <TableHead className="text-end">P&amp;L</TableHead>
              <TableHead>State</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((position, index) => (
              <motion.tr
                key={position.id}
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
                  <p className="max-w-64 truncate text-[11px] font-medium">
                    {position.market_title}
                  </p>
                  <p className="max-w-64 truncate text-[10px] text-muted-foreground">
                    {position.outcome_name}
                  </p>
                </TableCell>
                <TableCell className="text-end font-mono text-[11px] tabular-nums">
                  {position.quantity}
                  {position.reserved_quantity > 0 && (
                    <p className="text-[9px] font-normal text-muted-foreground">
                      {position.reserved_quantity} reserved
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-end font-mono text-[11px] tabular-nums">
                  {formatTickProbability(position.current_price)}
                </TableCell>
                <TableCell className="text-end font-mono text-[11px] tabular-nums">
                  {position.settled_at || position.market_value == null
                    ? "—"
                    : formatCredits(position.market_value)}
                  {!position.settled_at && position.cost_basis > 0 && (
                    <p className="text-[9px] font-normal text-muted-foreground">
                      cost {formatCredits(position.cost_basis)}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-end font-mono text-[11px] tabular-nums">
                  {position.settled_at
                    ? pnl(position.realized_pnl)
                    : pnl(position.unrealized_pnl)}
                  {position.settled_at ? (
                    <p className="text-[9px] font-normal text-muted-foreground">
                      at settlement
                    </p>
                  ) : position.realized_pnl !== 0 ? (
                    <p className="text-[9px] font-normal text-muted-foreground">
                      realized {formatSignedCredits(position.realized_pnl)}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={position.settled_at ? "secondary" : "outline"}
                    className="text-[9px] uppercase tracking-wider"
                  >
                    {positionStateLabel(position)}
                  </Badge>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-border md:hidden">
        {positions.map((position) => (
          <li key={position.id} className="flex flex-col gap-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">
                  {position.market_title}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {position.outcome_name}
                </p>
              </div>
              <Badge
                variant={position.settled_at ? "secondary" : "outline"}
                className="shrink-0 text-[9px] uppercase tracking-wider"
              >
                {positionStateLabel(position)}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-2 font-mono text-[11px] tabular-nums">
              <span>
                {position.quantity}{" "}
                <span className="font-sans text-muted-foreground">
                  contracts
                  {position.reserved_quantity > 0
                    ? ` · ${position.reserved_quantity} reserved`
                    : ""}
                </span>
              </span>
              <span>{formatTickProbability(position.current_price)}</span>
            </div>
            <div className="flex items-center justify-between gap-2 font-mono text-[10px] tabular-nums text-muted-foreground">
              <span>
                {position.settled_at || position.market_value == null
                  ? "—"
                  : `${formatCredits(position.market_value)} value`}
                {!position.settled_at && position.cost_basis > 0 && (
                  <span> · cost {formatCredits(position.cost_basis)}</span>
                )}
              </span>
              <span>
                {position.settled_at
                  ? `realized ${pnl(position.realized_pnl)}`
                  : `unrealized ${pnl(position.unrealized_pnl)}`}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </PanelShell>
  );
}

function OrdersPanel({ userId }: { userId: number }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useAdminOrders({
    page,
    user: userId,
  });
  const orders = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="border border-border bg-card">
        <TableSkeleton rows={6} cols={6} />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="border border-border bg-card">
        <EmptyState
          icon={ListChecks}
          title="No orders"
          description="This account has not submitted any orders."
        />
      </div>
    );
  }

  return (
    <PanelShell
      isFetching={isFetching}
      page={page}
      count={data?.count ?? 0}
      onPageChange={setPage}
    >
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="ps-4">Order</TableHead>
              <TableHead>Market</TableHead>
              <TableHead>Side</TableHead>
              <TableHead className="text-end">Slippage cap</TableHead>
              <TableHead className="text-end">Filled</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pe-4 text-end">Placed</TableHead>
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
                  <p className="font-mono text-[11px] tabular-nums">
                    #{order.id}
                  </p>
                  <p className="max-w-28 truncate font-mono text-[10px] text-muted-foreground">
                    {order.client_order_id}
                  </p>
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
                  {isMarketOrder(order)
                    ? "Market"
                    : formatTickProbability(order.limit_price)}
                </TableCell>
                <TableCell className="text-end font-mono text-[11px] tabular-nums">
                  {order.filled_quantity}/{order.original_quantity}
                  {order.cancelled_at && order.remaining_quantity > 0 && (
                    <p className="text-[9px] font-normal text-muted-foreground">
                      {order.remaining_quantity} cancelled
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={STATUS_VARIANT[order.status]}
                    className="text-[9px] uppercase tracking-wider"
                  >
                    {STATUS_LABEL[order.status]}
                  </Badge>
                  {order.status === "partially_filled" &&
                    order.cancelled_at && (
                      <p className="mt-0.5 text-[9px] text-muted-foreground">
                        remainder closed
                      </p>
                    )}
                </TableCell>
                <TableCell className="pe-4 text-end text-[10px] text-muted-foreground tabular-nums">
                  {formatDateTime(order.created_at)}
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
                  {order.market_title}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {order.outcome_name}
                </p>
              </div>
              <Badge
                variant={STATUS_VARIANT[order.status]}
                className="shrink-0 text-[9px] uppercase tracking-wider"
              >
                {STATUS_LABEL[order.status]}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-2 font-mono text-[11px] tabular-nums">
              <span className="flex items-center gap-2">
                <Badge
                  variant={order.side === "buy" ? "default" : "outline"}
                  className="text-[9px] uppercase tracking-wider"
                >
                  {order.side}
                </Badge>
                {isMarketOrder(order)
                  ? "Market"
                  : formatTickProbability(order.limit_price)}
              </span>
              <span className="text-muted-foreground">
                {order.filled_quantity}/{order.original_quantity} filled
              </span>
            </div>
            {order.cancelled_at && order.remaining_quantity > 0 && (
              <p className="text-[10px] text-muted-foreground">
                {order.remaining_quantity} contract
                {order.remaining_quantity === 1 ? "" : "s"} cancelled with the
                remainder.
              </p>
            )}
            <p className="font-mono text-[10px] text-muted-foreground">
              #{order.id} · {formatDateTime(order.created_at)}
            </p>
          </li>
        ))}
      </ul>
    </PanelShell>
  );
}

function TradesPanel({ userId }: { userId: number }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useAdminTrades({
    page,
    user: userId,
  });
  const trades = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="border border-border bg-card">
        <TableSkeleton rows={6} cols={6} />
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="border border-border bg-card">
        <EmptyState
          icon={ArrowsLeftRight}
          title="No trades"
          description="This account has not had any matched executions."
        />
      </div>
    );
  }

  return (
    <PanelShell
      isFetching={isFetching}
      page={page}
      count={data?.count ?? 0}
      onPageChange={setPage}
    >
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="ps-4">Execution</TableHead>
              <TableHead>Side</TableHead>
              <TableHead>Market</TableHead>
              <TableHead>Counterparty</TableHead>
              <TableHead className="text-end">Price</TableHead>
              <TableHead className="text-end">Quantity</TableHead>
              <TableHead className="text-end">Notional</TableHead>
              <TableHead className="pe-4 text-end">Executed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade, index) => {
              const isBuyer = trade.buyer.id === userId;
              const counterparty = isBuyer ? trade.seller : trade.buyer;
              return (
                <motion.tr
                  key={trade.id}
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
                  <TableCell className="ps-4 font-mono text-[10px] text-muted-foreground">
                    {trade.execution_id.slice(0, 8)}…
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={isBuyer ? "default" : "outline"}
                      className="text-[9px] uppercase tracking-wider"
                    >
                      {isBuyer ? "Bought" : "Sold"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-56 truncate text-[11px] font-medium">
                      {trade.market_title}
                    </p>
                    <p className="max-w-56 truncate text-[10px] text-muted-foreground">
                      {trade.outcome_name}
                    </p>
                  </TableCell>
                  <TableCell>
                    <UserCell
                      user={counterparty}
                      href={`/users/${counterparty.id}`}
                      className="min-w-36"
                    />
                  </TableCell>
                  <TableCell className="text-end font-mono text-[11px] tabular-nums">
                    {formatTickProbability(trade.price)}
                  </TableCell>
                  <TableCell className="text-end font-mono text-[11px] tabular-nums">
                    {trade.quantity}
                  </TableCell>
                  <TableCell className="text-end font-mono text-[11px] tabular-nums">
                    {formatCredits(tradeNotional(trade))}
                  </TableCell>
                  <TableCell className="pe-4 text-end text-[10px] text-muted-foreground tabular-nums">
                    {formatDateTime(trade.created_at)}
                  </TableCell>
                </motion.tr>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-border md:hidden">
        {trades.map((trade) => {
          const isBuyer = trade.buyer.id === userId;
          const counterparty = isBuyer ? trade.seller : trade.buyer;
          return (
            <li key={trade.id} className="flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">
                    {trade.market_title}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {trade.outcome_name}
                  </p>
                </div>
                <Badge
                  variant={isBuyer ? "default" : "outline"}
                  className="shrink-0 text-[9px] uppercase tracking-wider"
                >
                  {isBuyer ? "Bought" : "Sold"}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2 font-mono text-[11px] tabular-nums">
                <span>{formatTickProbability(trade.price)}</span>
                <span className="text-muted-foreground">× {trade.quantity}</span>
              </div>
              <div className="flex items-center justify-between gap-2 font-mono text-[10px] tabular-nums text-muted-foreground">
                <span>with {userDisplayName(counterparty)}</span>
                <span>{formatCredits(tradeNotional(trade))} credits</span>
              </div>
              <p className="font-mono text-[10px] text-muted-foreground">
                {formatDateTime(trade.created_at)}
              </p>
            </li>
          );
        })}
      </ul>
    </PanelShell>
  );
}

function signed(units: number) {
  return units === 0 ? "—" : formatSignedCredits(units);
}

function LedgerPanel({ userId }: { userId: number }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useAdminUserLedger(userId, page);
  const entries = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="border border-border bg-card">
        <TableSkeleton rows={6} cols={5} />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="border border-border bg-card">
        <EmptyState
          icon={Receipt}
          title="No ledger entries"
          description="Reserves, releases, and settlement payouts will be recorded here."
        />
      </div>
    );
  }

  return (
    <PanelShell
      isFetching={isFetching}
      page={page}
      count={data?.count ?? 0}
      onPageChange={setPage}
    >
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="ps-4">Entry</TableHead>
              <TableHead className="text-end">Available</TableHead>
              <TableHead className="text-end">Reserved</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="pe-4 text-end">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, index) => (
              <motion.tr
                key={entry.id}
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
                  <Badge
                    variant="outline"
                    className="text-[9px] uppercase tracking-wider"
                  >
                    {entry.entry_type.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-end font-mono text-[11px] tabular-nums">
                  {signed(entry.available_delta)}
                </TableCell>
                <TableCell className="text-end font-mono text-[11px] tabular-nums text-muted-foreground">
                  {signed(entry.reserved_delta)}
                </TableCell>
                <TableCell className="font-mono text-[10px] text-muted-foreground">
                  {entry.reference_type}
                  {entry.reference_id
                    ? ` · ${entry.reference_id.slice(0, 12)}`
                    : ""}
                </TableCell>
                <TableCell className="max-w-72 truncate text-[11px] text-muted-foreground">
                  {entry.description || "—"}
                </TableCell>
                <TableCell className="pe-4 text-end text-[10px] text-muted-foreground tabular-nums">
                  {formatDateTime(entry.created_at)}
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-border md:hidden">
        {entries.map((entry) => (
          <li key={entry.id} className="flex flex-col gap-1.5 p-4">
            <div className="flex items-center justify-between gap-2">
              <Badge
                variant="outline"
                className="text-[9px] uppercase tracking-wider"
              >
                {entry.entry_type.replace(/_/g, " ")}
              </Badge>
              <span className="font-mono text-[10px] text-muted-foreground">
                {formatDateTime(entry.created_at)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 font-mono text-[11px] tabular-nums">
              <span>available {signed(entry.available_delta)}</span>
              <span className="text-muted-foreground">
                reserved {signed(entry.reserved_delta)}
              </span>
            </div>
            {entry.description && (
              <p className="line-clamp-2 text-[10px] text-muted-foreground">
                {entry.description}
              </p>
            )}
          </li>
        ))}
      </ul>
    </PanelShell>
  );
}

function UserDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="h-6 w-40 bg-muted" />
        <div className="h-4 w-64 bg-muted" />
      </div>
      <div className="border border-border bg-card">
        <TableSkeleton rows={6} cols={5} />
      </div>
    </div>
  );
}

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = Number(params?.id);
  const [tab, setTab] = useState<TabKey>("positions");

  const { data: user, isLoading, isError, error } = useAdminUser(userId);

  if (!Number.isFinite(userId)) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="User" description="Account not found." />
        <div className="border border-border bg-card">
          <EmptyState
            icon={UserIcon}
            title="Account not found"
            description="This user id is not valid."
          >
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/users" />}
            >
              Back to users
            </Button>
          </EmptyState>
        </div>
      </div>
    );
  }

  if (isLoading) return <UserDetailSkeleton />;

  if (isError || !user) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="User" description="Account could not be loaded." />
        <div className="border border-border bg-card">
          <EmptyState
            icon={UserIcon}
            title="Could not load this account"
            description={getApiErrorMessage(error)}
          >
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/users" />}
            >
              Back to users
            </Button>
          </EmptyState>
        </div>
      </div>
    );
  }

  const displayName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.username ||
    user.email;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back to users"
          render={<Link href="/users" />}
        >
          <ArrowLeft size={14} />
        </Button>
        <p className="text-[11px] text-muted-foreground">All users</p>
      </div>

      <div className="flex flex-col gap-4 border border-border bg-card p-4 sm:flex-row sm:items-start">
        <Avatar className="size-12 shrink-0">
          {user.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
          <AvatarFallback className="bg-foreground text-sm font-medium text-background">
            {userInitials(user)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">
              {displayName}
            </h2>
            <Badge
              variant={
                user.is_market_maker
                  ? "secondary"
                  : user.is_staff
                    ? "default"
                    : "outline"
              }
              className="text-[9px] uppercase tracking-wider"
            >
              {user.is_market_maker
                ? "Market maker"
                : user.is_staff
                  ? "Staff"
                  : "Customer"}
            </Badge>
            {user.is_market_maker ? (
              <Badge
                variant="outline"
                className="border-dashed text-[9px] uppercase tracking-wider text-muted-foreground"
              >
                System account
              </Badge>
            ) : (
              <Badge
                variant={user.is_active ? "secondary" : "outline"}
                className="text-[9px] uppercase tracking-wider"
              >
                {user.is_active ? "Active" : "Inactive"}
              </Badge>
            )}
            {user.is_verified && (
              <Badge
                variant="outline"
                className="text-[9px] uppercase tracking-wider"
              >
                Verified
              </Badge>
            )}
            {user.is_onboarded && (
              <Badge
                variant="outline"
                className="text-[9px] uppercase tracking-wider"
              >
                Onboarded
              </Badge>
            )}
          </div>

          <p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p>
          {user.username && (
            <p className="text-[10px] text-muted-foreground">
              @{user.username}
            </p>
          )}
          {user.is_market_maker && (
            <p className="text-[10px] text-muted-foreground">
              Platform liquidity account. Holds AMM inventory and cannot sign
              in.
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
            <span>Joined {formatDate(user.created_at)}</span>
            <span>
              Last login{" "}
              {user.last_login ? formatDateTime(user.last_login) : "never"}
            </span>
            <span className="capitalize">{user.auth_provider} auth</span>
            <span className="font-mono">
              {user.orders_count} orders · {user.open_positions_count}{" "}
              positions · {user.trades_count} trades
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Available"
          value={formatCredits(user.wallet.available_balance)}
          sub={
            user.is_market_maker
              ? "AMM operating credits"
              : "Spendable simulated credits"
          }
          icon={Coins}
          index={0}
        />
        <MetricCard
          label="Reserved"
          value={formatCredits(user.wallet.reserved_balance)}
          sub={
            user.is_market_maker
              ? "Issuance collateral"
              : "Held against legacy resting buys"
          }
          icon={Lock}
          index={1}
        />
        <MetricCard
          label="Open positions"
          value={user.open_positions_count.toLocaleString()}
          sub={`Cost basis ${formatCredits(user.cost_basis)}`}
          icon={Briefcase}
          index={2}
        />
        <MetricCard
          label="Realized P&L"
          value={formatSignedCredits(user.realized_pnl)}
          sub={
            user.is_market_maker ? "AMM trading gains" : "Across settled positions"
          }
          icon={TrendUp}
          index={3}
        />
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as TabKey)}
        className="gap-3"
      >
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
          <TabsTrigger value="ledger">Wallet ledger</TabsTrigger>
        </TabsList>

        <TabsContent value="positions">
          <PositionsPanel userId={userId} />
        </TabsContent>
        <TabsContent value="orders">
          <OrdersPanel userId={userId} />
        </TabsContent>
        <TabsContent value="trades">
          <TradesPanel userId={userId} />
        </TabsContent>
        <TabsContent value="ledger">
          <LedgerPanel userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

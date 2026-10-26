"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  MagnifyingGlass,
  Users,
  ArrowsLeftRight,
} from "@phosphor-icons/react";
import { useAdminOverview, useAdminPositions } from "@/hooks/use-admin";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  formatCredits,
  formatDateTime,
  formatSignedCredits,
  formatTickProbability,
} from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { MetricCard } from "@/components/shared/metric-card";
import { UserCell } from "@/components/shared/user-cell";
import { Badge } from "@/components/ui/badge";
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
import type { AdminPosition } from "@/lib/types";

const STATE_OPTIONS = [
  { value: "all", label: "All positions" },
  { value: "open", label: "Open" },
  { value: "settled", label: "Settled" },
];

const ACCOUNT_OPTIONS = [
  { value: "customers", label: "Customers" },
  { value: "market_maker", label: "Market maker" },
  { value: "all", label: "All accounts" },
];

function positionStateLabel(position: AdminPosition) {
  if (position.settled_at) return "Settled";
  if (position.market_status === "closed") return "Awaiting resolution";
  if (position.market_status === "void") return "Void";
  return "Open";
}

function formatPnl(units: number | null) {
  if (units == null || units === 0) return "—";
  return formatSignedCredits(units);
}

export default function PositionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [state, setState] = useState("all");
  const [account, setAccount] = useState("customers");
  const debouncedSearch = useDebouncedValue(search, 350);

  const { data: overview } = useAdminOverview();
  const { data, isLoading, isFetching, isError } = useAdminPositions({
    page,
    search: debouncedSearch,
    settled:
      state === "settled" ? true : state === "open" ? false : undefined,
    market_maker:
      account === "market_maker"
        ? true
        : account === "customers"
          ? false
          : undefined,
  });

  const positions = data?.results ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Positions"
        description="Customer contracts held with the LMSR market maker, valued at the current price vector. Market-maker inventory lives on its own account."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          label="Open positions"
          value={overview?.trading.open_positions.toLocaleString() ?? "—"}
          sub="Customer positions awaiting settlement"
          icon={Briefcase}
          index={0}
        />
        <MetricCard
          label="Customer accounts"
          value={overview?.users.total.toLocaleString() ?? "—"}
          sub="Excludes the liquidity account"
          icon={Users}
          index={1}
        />
        <MetricCard
          label="Total trades"
          value={overview?.trading.trades.toLocaleString() ?? "—"}
          sub="Executions incl. market maker"
          icon={ArrowsLeftRight}
          index={2}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
            placeholder="Search by user, market, or outcome…"
            className="ps-8"
            aria-label="Search positions"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:w-44">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            State
          </Label>
          <Select
            value={state}
            onValueChange={(value) => {
              setState(String(value ?? "all"));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 sm:w-44">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Account
          </Label>
          <Select
            value={account}
            onValueChange={(value) => {
              setAccount(String(value ?? "customers"));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNT_OPTIONS.map((option) => (
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
          <TableSkeleton rows={8} cols={8} />
        </div>
      ) : isError ? (
        <div className="border border-border bg-card">
          <EmptyState
            icon={Briefcase}
            title="Could not load positions"
            description="Staff access is required to view platform positions."
          />
        </div>
      ) : positions.length === 0 ? (
        <div className="border border-border bg-card">
          <EmptyState
            icon={Briefcase}
            title="No positions"
            description={
              debouncedSearch || state !== "all" || account !== "customers"
                ? "No positions match these filters."
                : "Contracts bought from the market maker will appear here."
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
                  <TableHead className="text-end">Qty</TableHead>
                  <TableHead className="text-end">Price</TableHead>
                  <TableHead className="text-end">Value / cost</TableHead>
                  <TableHead className="text-end">P&amp;L</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead className="pe-4 text-end">Updated</TableHead>
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
                      <UserCell
                        user={position.user}
                        href={`/users/${position.user.id}`}
                        className="min-w-40"
                      />
                    </TableCell>
                    <TableCell>
                      <p className="max-w-56 truncate text-[11px] font-medium">
                        {position.market_title}
                      </p>
                      <p className="max-w-56 truncate text-[10px] text-muted-foreground">
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
                        ? formatPnl(position.realized_pnl)
                        : formatPnl(position.unrealized_pnl)}
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
                    <TableCell className="pe-4 text-end text-[10px] text-muted-foreground tabular-nums">
                      {formatDateTime(position.updated_at)}
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
                  <UserCell
                    user={position.user}
                    href={`/users/${position.user.id}`}
                    className="min-w-0"
                  />
                  <Badge
                    variant={position.settled_at ? "secondary" : "outline"}
                    className="shrink-0 text-[9px] uppercase tracking-wider"
                  >
                    {positionStateLabel(position)}
                  </Badge>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">
                    {position.market_title}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {position.outcome_name}
                  </p>
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
                      ? `realized ${formatPnl(position.realized_pnl)}`
                      : `unrealized ${formatPnl(position.unrealized_pnl)}`}
                  </span>
                </div>
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
    </div>
  );
}

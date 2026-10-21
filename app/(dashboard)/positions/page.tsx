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
  formatProbability,
  formatSignedCredits,
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

const STATE_OPTIONS = [
  { value: "all", label: "All positions" },
  { value: "open", label: "Open" },
  { value: "settled", label: "Settled" },
];

export default function PositionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [state, setState] = useState("all");
  const debouncedSearch = useDebouncedValue(search, 350);

  const { data: overview } = useAdminOverview();
  const { data, isLoading, isFetching, isError } = useAdminPositions({
    page,
    search: debouncedSearch,
    settled:
      state === "settled" ? true : state === "open" ? false : undefined,
  });

  const positions = data?.results ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Positions"
        description="Every open and settled contract held by any account on the platform."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          label="Open positions"
          value={overview?.trading.open_positions.toLocaleString() ?? "—"}
          sub="Unsettled contracts platform-wide"
          icon={Briefcase}
          index={0}
        />
        <MetricCard
          label="Accounts"
          value={overview?.users.total.toLocaleString() ?? "—"}
          sub="Users holding or trading"
          icon={Users}
          index={1}
        />
        <MetricCard
          label="Total trades"
          value={overview?.trading.trades.toLocaleString() ?? "—"}
          sub="Matched executions"
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
      </div>

      {isLoading ? (
        <div className="border border-border bg-card">
          <TableSkeleton rows={8} cols={6} />
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
              debouncedSearch || state !== "all"
                ? "No positions match these filters."
                : "Buys and sells that leave accounts holding contracts will appear here."
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
                  <TableHead className="text-end">Quantity</TableHead>
                  <TableHead className="text-end">Reserved</TableHead>
                  <TableHead className="text-end">Avg entry</TableHead>
                  <TableHead className="text-end">Cost basis</TableHead>
                  <TableHead className="text-end">Realized P&amp;L</TableHead>
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
                    </TableCell>
                    <TableCell className="text-end font-mono text-[11px] tabular-nums text-muted-foreground">
                      {position.reserved_quantity}
                    </TableCell>
                    <TableCell className="text-end font-mono text-[11px] tabular-nums">
                      {position.average_entry_price != null
                        ? formatProbability(position.average_entry_price)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-end font-mono text-[11px] tabular-nums">
                      {formatCredits(position.cost_basis)}
                    </TableCell>
                    <TableCell className="text-end font-mono text-[11px] tabular-nums">
                      {position.realized_pnl === 0
                        ? "—"
                        : formatSignedCredits(position.realized_pnl)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={position.settled_at ? "secondary" : "outline"}
                        className="text-[9px] uppercase tracking-wider"
                      >
                        {position.settled_at ? "Settled" : "Open"}
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
                    {position.settled_at ? "Settled" : "Open"}
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
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    cost {formatCredits(position.cost_basis)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                  <span className="font-mono">
                    avg{" "}
                    {position.average_entry_price != null
                      ? formatProbability(position.average_entry_price)
                      : "—"}
                    {" · "}reserved {position.reserved_quantity}
                  </span>
                  <span className="font-mono">
                    {position.realized_pnl === 0
                      ? ""
                      : formatSignedCredits(position.realized_pnl)}
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

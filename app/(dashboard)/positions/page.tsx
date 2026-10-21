"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Coins, TrendUp } from "@phosphor-icons/react";
import { usePositions, usePositionSummary } from "@/hooks/use-portfolio";
import { useOutcomes } from "@/hooks/use-outcomes";
import {
  formatCredits,
  formatDateTime,
  formatPrice,
  formatSignedCredits,
} from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { MetricCard } from "@/components/shared/metric-card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PositionsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = usePositions(page);
  const { data: summary } = usePositionSummary();
  const { data: outcomesData } = useOutcomes();

  const outcomeNames = useMemo(() => {
    const map = new Map<number, string>();
    outcomesData?.results.forEach((item) => map.set(item.id, item.name));
    return map;
  }, [outcomesData]);

  const positions = data?.results ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Positions"
        description="Your open and settled contracts. Quantities are whole contracts; credits are simulated."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          label="Open positions"
          value={summary?.open_positions ?? 0}
          sub="Unsettled positions"
          icon={Briefcase}
          index={0}
        />
        <MetricCard
          label="Cost basis"
          value={formatCredits(summary?.total_cost_basis ?? 0)}
          sub="Simulated credits at cost"
          icon={Coins}
          index={1}
        />
        <MetricCard
          label="Realized P&L"
          value={
            <span
              className={
                (summary?.realized_pnl ?? 0) < 0
                  ? "text-muted-foreground"
                  : "text-foreground"
              }
            >
              {formatSignedCredits(summary?.realized_pnl ?? 0)}
            </span>
          }
          sub="Across settled positions"
          icon={TrendUp}
          index={2}
        />
      </div>

      {isLoading ? (
        <div className="border border-border bg-card">
          <TableSkeleton rows={8} cols={5} />
        </div>
      ) : positions.length === 0 ? (
        <div className="border border-border bg-card">
          <EmptyState
            icon={Briefcase}
            title="No positions"
            description="Buys and sells that leave you holding contracts will appear here."
          />
        </div>
      ) : (
        <div className="border border-border bg-card">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-4">Outcome</TableHead>
                  <TableHead className="text-end">Quantity</TableHead>
                  <TableHead className="text-end">Reserved</TableHead>
                  <TableHead className="text-end">Avg entry</TableHead>
                  <TableHead className="text-end">Cost basis</TableHead>
                  <TableHead className="text-end">Realized P&L</TableHead>
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
                    <TableCell className="ps-4 text-[11px]">
                      {outcomeNames.get(position.outcome) ??
                        `Outcome #${position.outcome}`}
                    </TableCell>
                    <TableCell className="text-end font-mono text-[11px] tabular-nums">
                      {position.quantity}
                    </TableCell>
                    <TableCell className="text-end font-mono text-[11px] tabular-nums text-muted-foreground">
                      {position.reserved_quantity}
                    </TableCell>
                    <TableCell className="text-end font-mono text-[11px] tabular-nums">
                      {position.average_entry_price != null
                        ? formatPrice(position.average_entry_price)
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
                        className="text-[10px] uppercase tracking-wider"
                      >
                        {position.settled_at ? "Settled" : "Open"}
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
                  <p className="truncate text-xs font-medium">
                    {outcomeNames.get(position.outcome) ??
                      `Outcome #${position.outcome}`}
                  </p>
                  <Badge
                    variant={position.settled_at ? "secondary" : "outline"}
                    className="text-[9px] uppercase tracking-wider"
                  >
                    {position.settled_at ? "Settled" : "Open"}
                  </Badge>
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
                      ? formatPrice(position.average_entry_price)
                      : "—"}
                    {" · "}reserved {position.reserved_quantity}
                  </span>
                  <span className="font-mono">
                    {position.settled_at
                      ? formatDateTime(position.settled_at)
                      : position.updated_at
                        ? formatDateTime(position.updated_at)
                        : ""}
                  </span>
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
    </div>
  );
}

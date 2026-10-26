"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowsLeftRight, MagnifyingGlass } from "@phosphor-icons/react";
import { useAdminTrades } from "@/hooks/use-admin";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  formatCredits,
  formatDateTime,
  formatTickProbability,
  tradeNotional,
} from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { UserCell, userDisplayName } from "@/components/shared/user-cell";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TradesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);

  const { data, isLoading, isFetching, isError } = useAdminTrades({
    page,
    search: debouncedSearch,
  });

  const trades = data?.results ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Trades"
        description="Every LMSR execution. One side is always the market maker, shown as its own account."
      />

      <div className="relative">
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
          placeholder="Search by buyer, seller, market, or outcome…"
          className="ps-8"
          aria-label="Search trades"
        />
      </div>

      {isLoading ? (
        <div className="border border-border bg-card">
          <TableSkeleton rows={8} cols={7} />
        </div>
      ) : isError ? (
        <div className="border border-border bg-card">
          <EmptyState
            icon={ArrowsLeftRight}
            title="Could not load trades"
            description="Staff access is required to view platform trades."
          />
        </div>
      ) : trades.length === 0 ? (
        <div className="border border-border bg-card">
          <EmptyState
            icon={ArrowsLeftRight}
            title="No trades"
            description={
              debouncedSearch
                ? "No execution matches this search."
                : "Executions appear here as soon as orders hit the market maker."
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
                  <TableHead className="ps-4">Execution</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead className="text-end">Price</TableHead>
                  <TableHead className="text-end">Quantity</TableHead>
                  <TableHead className="text-end">Notional</TableHead>
                  <TableHead className="pe-4 text-end">Executed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade, index) => (
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
                      <UserCell
                        user={trade.buyer}
                        href={`/users/${trade.buyer.id}`}
                        className="min-w-36"
                      />
                    </TableCell>
                    <TableCell>
                      <UserCell
                        user={trade.seller}
                        href={`/users/${trade.seller.id}`}
                        className="min-w-36"
                      />
                    </TableCell>
                    <TableCell>
                      <p className="max-w-56 truncate text-[11px] font-medium">
                        {trade.market_title}
                      </p>
                      <p className="max-w-56 truncate text-[10px] text-muted-foreground">
                        {trade.outcome_name}
                      </p>
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
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="divide-y divide-border md:hidden">
            {trades.map((trade) => (
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
                  <div className="shrink-0 text-end">
                    <p className="font-mono text-xs tabular-nums">
                      {formatTickProbability(trade.price)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      × {trade.quantity}
                    </p>
                  </div>
                </div>

                <p className="truncate text-[10px] text-muted-foreground">
                  <span className="text-foreground">
                    {userDisplayName(trade.buyer)}
                  </span>{" "}
                  bought from{" "}
                  <span className="text-foreground">
                    {userDisplayName(trade.seller)}
                  </span>
                </p>

                <p className="font-mono text-[10px] text-muted-foreground">
                  {formatCredits(tradeNotional(trade))} credits ·{" "}
                  {trade.execution_id.slice(0, 8)}… ·{" "}
                  {formatDateTime(trade.created_at)}
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
    </div>
  );
}

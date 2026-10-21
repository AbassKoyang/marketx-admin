"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowsLeftRight } from "@phosphor-icons/react";
import { useMyTrades, useTrades } from "@/hooks/use-trading";
import { useOutcomes } from "@/hooks/use-outcomes";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { cn, formatDateTime, formatProbability } from "@/lib/utils";

export default function TradesPage() {
  const [page, setPage] = useState(1);
  const [mine, setMine] = useState(false);
  const [outcome, setOutcome] = useState("all");

  const outcomeId = outcome === "all" ? undefined : Number(outcome);

  const allTrades = useTrades(
    { page, outcome: outcomeId },
    !mine,
  );
  const myTrades = useMyTrades(page, mine);
  const { data, isLoading, isFetching } = mine ? myTrades : allTrades;

  const { data: outcomesData } = useOutcomes();
  const outcomeNames = useMemo(() => {
    const map = new Map<number, string>();
    outcomesData?.results.forEach((item) => map.set(item.id, item.name));
    return map;
  }, [outcomesData]);

  const trades = data?.results ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Trades"
        description="Matched executions across every market. Trades are public and price is the resting order price."
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-1 border border-border p-0.5">
          <Button
            variant={mine ? "ghost" : "default"}
            size="xs"
            onClick={() => {
              setMine(false);
              setPage(1);
            }}
            aria-pressed={!mine}
          >
            All trades
          </Button>
          <Button
            variant={mine ? "default" : "ghost"}
            size="xs"
            onClick={() => {
              setMine(true);
              setPage(1);
            }}
            aria-pressed={mine}
          >
            My trades
          </Button>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Outcome
          </Label>
          <Select
            value={outcome}
            onValueChange={(value) => {
              setOutcome(String(value ?? "all"));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All outcomes</SelectItem>
              {outcomesData?.results.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isFetching && !isLoading && (
          <span className="text-[10px] text-muted-foreground">Updating…</span>
        )}
      </div>

      {isLoading ? (
        <div className="border border-border bg-card">
          <TableSkeleton rows={8} cols={5} />
        </div>
      ) : trades.length === 0 ? (
        <div className="border border-border bg-card">
          <EmptyState
            icon={ArrowsLeftRight}
            title="No trades"
            description={
              mine
                ? "Your executions will appear here after matching."
                : "Executions appear here as soon as orders match."
            }
          />
        </div>
      ) : (
        <div
          className={cn(
            "border border-border bg-card",
            isFetching && "opacity-70 transition-opacity",
          )}
        >
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-4">Execution</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead className="text-end">Price</TableHead>
                  <TableHead className="text-end">Quantity</TableHead>
                  <TableHead className="text-end pe-4">Executed</TableHead>
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
                    <TableCell className="text-[11px]">
                      {outcomeNames.get(trade.outcome) ?? `Outcome #${trade.outcome}`}
                    </TableCell>
                    <TableCell className="text-end font-mono text-[11px] tabular-nums">
                      {formatProbability(trade.price_decimal)}
                    </TableCell>
                    <TableCell className="text-end font-mono text-[11px] tabular-nums">
                      {trade.quantity}
                    </TableCell>
                    <TableCell className="pe-4 text-end text-[11px] text-muted-foreground tabular-nums">
                      {formatDateTime(trade.created_at)}
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="divide-y divide-border md:hidden">
            {trades.map((trade) => (
              <li key={trade.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">
                    {outcomeNames.get(trade.outcome) ?? `Outcome #${trade.outcome}`}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    {trade.execution_id.slice(0, 8)}… · {formatDateTime(trade.created_at)}
                  </p>
                </div>
                <div className="shrink-0 text-end">
                  <p className="font-mono text-xs tabular-nums">
                    {formatProbability(trade.price_decimal)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">× {trade.quantity}</p>
                </div>
              </li>
            ))}
          </ul>

          <Pagination page={page} count={data?.count ?? 0} onPageChange={setPage} />
        </div>
      )}

      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <Badge variant="outline" className="text-[9px] uppercase tracking-wider">
          Public
        </Badge>
        Trade payloads intentionally omit buyer and seller identities.
      </div>
    </div>
  );
}

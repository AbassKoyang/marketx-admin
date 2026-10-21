"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Coins, Lock, Receipt, Wallet as WalletIcon } from "@phosphor-icons/react";
import { useWallet, useWalletLedger } from "@/hooks/use-portfolio";
import {
  formatCredits,
  formatDateTime,
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

function signed(units: number) {
  return units === 0 ? "—" : formatSignedCredits(units);
}

export default function WalletPage() {
  const [page, setPage] = useState(1);
  const { data: wallet, isLoading: loadingWallet } = useWallet();
  const { data: ledger, isLoading: loadingLedger } = useWalletLedger(page);

  const available = wallet?.available_balance ?? 0;
  const reserved = wallet?.reserved_balance ?? 0;
  const entries = ledger?.results ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Wallet"
        description="Simulated virtual-credit wallet. There are no deposits, withdrawals, or real-money payments."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          label="Available"
          value={loadingWallet ? "—" : formatCredits(available)}
          sub="Spendable simulated credits"
          icon={Coins}
          index={0}
        />
        <MetricCard
          label="Reserved"
          value={loadingWallet ? "—" : formatCredits(reserved)}
          sub="Held against open buy orders"
          icon={Lock}
          index={1}
        />
        <MetricCard
          label="Total"
          value={loadingWallet ? "—" : formatCredits(available + reserved)}
          sub={
            wallet?.updated_at
              ? `Updated ${formatDateTime(wallet.updated_at)}`
              : "Available + reserved"
          }
          icon={WalletIcon}
          index={2}
        />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Ledger
            </h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Immutable record of every balance movement.
            </p>
          </div>
          <Badge variant="outline" className="text-[9px] uppercase tracking-wider">
            {ledger?.count ?? 0} entries
          </Badge>
        </div>

        {loadingLedger ? (
          <div className="border border-border bg-card">
            <TableSkeleton rows={8} cols={5} />
          </div>
        ) : entries.length === 0 ? (
          <div className="border border-border bg-card">
            <EmptyState
              icon={Receipt}
              title="No ledger entries"
              description="Reserves, releases, and settlement payouts will be recorded here."
            />
          </div>
        ) : (
          <div className="border border-border bg-card">
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
                          className="text-[10px] uppercase tracking-wider"
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
                      <TableCell className="max-w-[280px] truncate text-[11px] text-muted-foreground">
                        {entry.description || "—"}
                      </TableCell>
                      <TableCell className="pe-4 text-end text-[11px] text-muted-foreground tabular-nums">
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

            <Pagination
              page={page}
              count={ledger?.count ?? 0}
              onPageChange={setPage}
            />
          </div>
        )}
      </section>
    </div>
  );
}

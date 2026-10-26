"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CaretRight,
  Coins,
  Lock,
  MagnifyingGlass,
  Wallet as WalletIcon,
} from "@phosphor-icons/react";
import { useAdminOverview, useAdminWallets } from "@/hooks/use-admin";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatCredits, formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { MetricCard } from "@/components/shared/metric-card";
import { UserCell } from "@/components/shared/user-cell";
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

const ACCOUNT_OPTIONS = [
  { value: "customers", label: "Customers" },
  { value: "market_maker", label: "Market maker" },
  { value: "all", label: "All accounts" },
];

export default function WalletsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [account, setAccount] = useState("customers");
  const debouncedSearch = useDebouncedValue(search, 350);

  const { data: overview } = useAdminOverview();
  const { data, isLoading, isFetching, isError } = useAdminWallets({
    page,
    search: debouncedSearch,
    market_maker:
      account === "market_maker"
        ? true
        : account === "customers"
          ? false
          : undefined,
  });

  const wallets = data?.results ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Wallets"
        description="Simulated credit balances for customer accounts. The market-maker wallet holds issuance collateral and AMM inventory."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          label="Customer wallets"
          value={overview?.wallets.total.toLocaleString() ?? "—"}
          sub="Excludes the liquidity account"
          icon={WalletIcon}
          index={0}
        />
        <MetricCard
          label="Available credits"
          value={formatCredits(overview?.wallets.available ?? 0)}
          sub="Spendable across customer wallets"
          icon={Coins}
          index={1}
        />
        <MetricCard
          label="Reserved credits"
          value={formatCredits(overview?.wallets.reserved ?? 0)}
          sub="Collateral and legacy order reserves"
          icon={Lock}
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
            placeholder="Search by email, username, or name…"
            className="ps-8"
            aria-label="Search wallets"
          />
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
          <TableSkeleton rows={8} cols={5} />
        </div>
      ) : isError ? (
        <div className="border border-border bg-card">
          <EmptyState
            icon={WalletIcon}
            title="Could not load wallets"
            description="Staff access is required to view platform wallets."
          />
        </div>
      ) : wallets.length === 0 ? (
        <div className="border border-border bg-card">
          <EmptyState
            icon={WalletIcon}
            title="No wallets"
            description={
              debouncedSearch || account !== "customers"
                ? "No wallet matches these filters."
                : "Wallets are created when an account first needs credits."
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
                  <TableHead className="text-end">Available</TableHead>
                  <TableHead className="text-end">Reserved</TableHead>
                  <TableHead className="text-end">Total</TableHead>
                  <TableHead className="text-end">Created</TableHead>
                  <TableHead className="pe-4 text-end">Updated</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallets.map((wallet, index) => (
                  <motion.tr
                    key={wallet.id}
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
                        user={wallet.user}
                        href={`/users/${wallet.user.id}`}
                        className="min-w-44"
                      />
                    </TableCell>
                    <TableCell className="text-end font-mono text-[11px] tabular-nums">
                      {formatCredits(wallet.available_balance)}
                    </TableCell>
                    <TableCell className="text-end font-mono text-[11px] tabular-nums text-muted-foreground">
                      {formatCredits(wallet.reserved_balance)}
                    </TableCell>
                    <TableCell className="text-end font-mono text-[11px] tabular-nums">
                      {formatCredits(wallet.total_balance)}
                    </TableCell>
                    <TableCell className="text-end text-[10px] text-muted-foreground tabular-nums">
                      {formatDateTime(wallet.created_at)}
                    </TableCell>
                    <TableCell className="pe-4 text-end text-[10px] text-muted-foreground tabular-nums">
                      {formatDateTime(wallet.updated_at)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/users/${wallet.user.id}`}
                        aria-label={`View ${wallet.user.email}`}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <CaretRight size={13} />
                      </Link>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="divide-y divide-border md:hidden">
            {wallets.map((wallet) => (
              <li key={wallet.id}>
                <Link
                  href={`/users/${wallet.user.id}`}
                  className="flex flex-col gap-2 p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <UserCell user={wallet.user} className="min-w-0" />
                    <CaretRight
                      size={13}
                      className="mt-1 shrink-0 text-muted-foreground"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 font-mono text-[11px] tabular-nums">
                    <span>
                      {formatCredits(wallet.available_balance)}{" "}
                      <span className="font-sans text-muted-foreground">
                        available
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      {formatCredits(wallet.reserved_balance)} reserved
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                    <span className="font-mono">
                      total {formatCredits(wallet.total_balance)}
                    </span>
                    <span className="tabular-nums">
                      {formatDateTime(wallet.updated_at)}
                    </span>
                  </div>
                </Link>
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

      <p className="text-[10px] text-muted-foreground">
        Balances are simulated virtual credits. There are no deposits,
        withdrawals, or real-money payments. The market maker reserves 10,000
        credits per minted complete set.
      </p>
    </div>
  );
}

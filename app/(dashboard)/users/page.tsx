"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CaretRight,
  Coins,
  MagnifyingGlass,
  User,
  Users,
  Wallet,
} from "@phosphor-icons/react";
import { useAdminOverview, useAdminUsers } from "@/hooks/use-admin";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  formatCredits,
  formatDate,
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

const ROLE_OPTIONS = [
  { value: "all", label: "All accounts" },
  { value: "users", label: "Customers" },
  { value: "staff", label: "Staff" },
];

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const debouncedSearch = useDebouncedValue(search, 350);

  const { data: overview } = useAdminOverview();
  const { data, isLoading, isFetching, isError } = useAdminUsers({
    page,
    search: debouncedSearch,
    is_staff: role === "staff" ? true : role === "users" ? false : undefined,
  });

  const users = data?.results ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        description="Every account on MarketX, with wallet balances and trading footprint."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Accounts"
          value={overview?.users.total.toLocaleString() ?? "—"}
          sub="All registered users"
          icon={Users}
          index={0}
        />
        <MetricCard
          label="Active"
          value={overview?.users.active.toLocaleString() ?? "—"}
          sub={`${overview?.users.new_7d ?? 0} joined this week`}
          icon={User}
          index={1}
        />
        <MetricCard
          label="Staff"
          value={overview?.users.staff.toLocaleString() ?? "—"}
          sub="Operator accounts"
          icon={User}
          index={2}
        />
        <MetricCard
          label="Available credits"
          value={formatCredits(overview?.wallets.available ?? 0)}
          sub="Across every wallet"
          icon={Coins}
          index={3}
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
            aria-label="Search users"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:w-44">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Role
          </Label>
          <Select
            value={role}
            onValueChange={(value) => {
              setRole(String(value ?? "all"));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((option) => (
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
            icon={Users}
            title="Could not load users"
            description="Staff access is required to view accounts. Sign in with an operator account and try again."
          />
        </div>
      ) : users.length === 0 ? (
        <div className="border border-border bg-card">
          <EmptyState
            icon={Users}
            title="No users"
            description={
              debouncedSearch
                ? "No account matches this search."
                : "Registered accounts will appear here."
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
                  <TableHead>Role</TableHead>
                  <TableHead className="text-end">Available</TableHead>
                  <TableHead className="text-end">Reserved</TableHead>
                  <TableHead className="text-end">Orders</TableHead>
                  <TableHead className="text-end">Positions</TableHead>
                  <TableHead className="text-end">Trades</TableHead>
                  <TableHead className="text-end">Realized P&amp;L</TableHead>
                  <TableHead className="text-end">Joined</TableHead>
                  <TableHead className="w-10 pe-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, index) => (
                  <motion.tr
                    key={user.id}
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
                        user={user}
                        href={`/users/${user.id}`}
                        className="min-w-44"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge
                          variant={user.is_staff ? "default" : "outline"}
                          className="text-[9px] uppercase tracking-wider"
                        >
                          {user.is_staff ? "Staff" : "Customer"}
                        </Badge>
                        {!user.is_active && (
                          <Badge
                            variant="outline"
                            className="border-dashed text-[9px] uppercase tracking-wider text-muted-foreground"
                          >
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-end font-mono text-[11px] tabular-nums">
                      {formatCredits(user.wallet.available_balance)}
                    </TableCell>
                    <TableCell className="text-end font-mono text-[11px] tabular-nums text-muted-foreground">
                      {formatCredits(user.wallet.reserved_balance)}
                    </TableCell>
                    <TableCell className="text-end font-mono text-[11px] tabular-nums text-muted-foreground">
                      {user.orders_count}
                    </TableCell>
                    <TableCell className="text-end font-mono text-[11px] tabular-nums text-muted-foreground">
                      {user.open_positions_count}
                    </TableCell>
                    <TableCell className="text-end font-mono text-[11px] tabular-nums text-muted-foreground">
                      {user.trades_count}
                    </TableCell>
                    <TableCell className="text-end font-mono text-[11px] tabular-nums">
                      {user.realized_pnl === 0
                        ? "—"
                        : formatSignedCredits(user.realized_pnl)}
                    </TableCell>
                    <TableCell className="text-end text-[11px] text-muted-foreground tabular-nums">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell className="pe-4">
                      <Link
                        href={`/users/${user.id}`}
                        aria-label={`View ${user.email}`}
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
            {users.map((user) => (
              <li key={user.id}>
                <Link
                  href={`/users/${user.id}`}
                  className="flex flex-col gap-2 p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <UserCell user={user} className="min-w-0" />
                    <Badge
                      variant={user.is_staff ? "default" : "outline"}
                      className="shrink-0 text-[9px] uppercase tracking-wider"
                    >
                      {user.is_staff ? "Staff" : "Customer"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between gap-2 font-mono text-[11px] tabular-nums">
                    <span>
                      {formatCredits(user.wallet.available_balance)}{" "}
                      <span className="font-sans text-muted-foreground">
                        available
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      {formatCredits(user.wallet.reserved_balance)} reserved
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                    <span className="font-mono">
                      {user.orders_count} orders · {user.open_positions_count}{" "}
                      positions · {user.trades_count} trades
                    </span>
                    <span className="tabular-nums">
                      {formatDate(user.created_at)}
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

      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <Wallet size={13} />
        Balances are simulated credits. Each wallet is owned by one account.
      </div>
    </div>
  );
}

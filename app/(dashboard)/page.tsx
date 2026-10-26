"use client";

import Link from "next/link";
import {
  ArrowsLeftRight,
  Briefcase,
  Coins,
  ListChecks,
  Lock,
  Plus,
  Storefront,
  Users,
  Wallet,
} from "@phosphor-icons/react";
import { useAdminOverview } from "@/hooks/use-admin";
import { formatCredits } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { MetricCard } from "@/components/shared/metric-card";
import { ActivityFeed } from "@/components/markets/activity-feed";
import { CardGridSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardOverviewPage() {
  const { data: overview, isLoading } = useAdminOverview();

  const platformStats = [
    {
      label: "Customer accounts",
      value: overview?.users.total.toLocaleString() ?? "—",
      sub: `${overview?.users.active ?? 0} active · ${overview?.users.new_7d ?? 0} new this week`,
      icon: Users,
      href: "/users",
    },
    {
      label: "Customer wallets",
      value: overview?.wallets.total.toLocaleString() ?? "—",
      sub: "Excludes the liquidity account",
      icon: Wallet,
      href: "/wallet",
    },
    {
      label: "Available credits",
      value: overview ? formatCredits(overview.wallets.available) : "—",
      sub: "Simulated customer credits",
      icon: Coins,
      href: "/wallet",
    },
    {
      label: "Reserved credits",
      value: overview ? formatCredits(overview.wallets.reserved) : "—",
      sub: "Collateral and legacy order reserves",
      icon: Lock,
      href: "/wallet",
    },
  ];

  const tradingStats = [
    {
      label: "Open markets",
      value: overview?.markets.open.toLocaleString() ?? "—",
      sub: `${overview?.markets.total ?? 0} markets total`,
      icon: Storefront,
      href: "/markets?status=open",
    },
    {
      label: "Resting orders",
      value: overview?.trading.open_orders.toLocaleString() ?? "—",
      sub: `${overview?.trading.orders ?? 0} orders incl. market maker`,
      icon: ListChecks,
      href: "/orders",
    },
    {
      label: "Trades · 24h",
      value: overview?.trading.trades_24h.toLocaleString() ?? "—",
      sub: `${overview?.trading.trades ?? 0} executions incl. market maker`,
      icon: ArrowsLeftRight,
      href: "/trades",
    },
    {
      label: "Open positions",
      value: overview?.trading.open_positions.toLocaleString() ?? "—",
      sub: "Customer contracts awaiting settlement",
      icon: Briefcase,
      href: "/positions",
    },
  ];

  const marketMakerStats = [
    {
      label: "Market maker float",
      value: overview
        ? formatCredits(overview.market_maker.available_balance)
        : "—",
      sub:
        overview && overview.market_maker.accounts > 1
          ? `Across ${overview.market_maker.accounts} liquidity accounts`
          : "AMM operating credits",
      icon: Coins,
      href: overview?.market_maker.user_id
        ? `/users/${overview.market_maker.user_id}`
        : "/users",
    },
    {
      label: "Issuance collateral",
      value: overview
        ? formatCredits(overview.market_maker.reserved_balance)
        : "—",
      sub: "Backs minted complete sets",
      icon: Lock,
      href: "/wallet",
    },
    {
      label: "Market maker fills",
      value: overview?.market_maker.trades.toLocaleString() ?? "—",
      sub: `${overview?.market_maker.orders ?? 0} orders · ${
        overview?.market_maker.open_positions ?? 0
      } inventory positions`,
      icon: ArrowsLeftRight,
      href: "/trades",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Overview"
        description="Platform-wide operations: customer accounts, credits, markets, and trading activity. The market maker is reported separately."
      >
        <Button variant="outline" size="sm" render={<Link href="/users" />}>
          View users
        </Button>
        <Button size="sm" render={<Link href="/markets/new" />}>
          <Plus size={14} />
          Create market
        </Button>
      </PageHeader>

      <section className="flex flex-col gap-3">
        <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Accounts &amp; credits
        </h3>

        {isLoading ? (
          <CardGridSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {platformStats.map((stat, index) => (
              <MetricCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                sub={stat.sub}
                icon={stat.icon}
                href={stat.href}
                index={index}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Markets &amp; trading
        </h3>

        {isLoading ? (
          <CardGridSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {tradingStats.map((stat, index) => (
              <MetricCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                sub={stat.sub}
                icon={stat.icon}
                href={stat.href}
                index={index}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Market maker
          </h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Liquidity accounts excluded from customer totals. Every complete set
            is backed by reserved collateral.
          </p>
        </div>

        {isLoading ? (
          <CardGridSkeleton count={3} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {marketMakerStats.map((stat, index) => (
              <MetricCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                sub={stat.sub}
                icon={stat.icon}
                href={stat.href}
                index={index}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Recent activity
            </h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Live audit stream of orders, executions, and settlement events.
            </p>
          </div>
          <Button
            variant="ghost"
            size="xs"
            className="text-muted-foreground"
            render={<Link href="/activity" />}
          >
            View all
          </Button>
        </div>

        <Card className="py-0">
          <CardHeader className="sr-only">
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ActivityFeed limit={8} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

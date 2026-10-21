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
      label: "Users",
      value: overview?.users.total.toLocaleString() ?? "—",
      sub: `${overview?.users.active ?? 0} active · ${overview?.users.new_7d ?? 0} new this week`,
      icon: Users,
      href: "/users",
    },
    {
      label: "Wallets",
      value: overview?.wallets.total.toLocaleString() ?? "—",
      sub: "Accounts with a wallet",
      icon: Wallet,
      href: "/wallet",
    },
    {
      label: "Available credits",
      value: overview ? formatCredits(overview.wallets.available) : "—",
      sub: "Simulated, platform-wide",
      icon: Coins,
      href: "/wallet",
    },
    {
      label: "Reserved credits",
      value: overview ? formatCredits(overview.wallets.reserved) : "—",
      sub: "Held by open buy orders",
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
      label: "Open orders",
      value: overview?.trading.open_orders.toLocaleString() ?? "—",
      sub: `${overview?.trading.orders ?? 0} orders all-time`,
      icon: ListChecks,
      href: "/orders",
    },
    {
      label: "Trades · 24h",
      value: overview?.trading.trades_24h.toLocaleString() ?? "—",
      sub: `${overview?.trading.trades ?? 0} executions total`,
      icon: ArrowsLeftRight,
      href: "/trades",
    },
    {
      label: "Open positions",
      value: overview?.trading.open_positions.toLocaleString() ?? "—",
      sub: "Unsettled contracts",
      icon: Briefcase,
      href: "/positions",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Overview"
        description="Platform-wide operations: accounts, credits, markets, and trading activity."
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

"use client";

import Link from "next/link";
import {
  ArrowsLeftRight,
  Briefcase,
  ChartBar,
  Plus,
  Storefront,
} from "@phosphor-icons/react";
import { useMarkets } from "@/hooks/use-markets";
import { useTrades } from "@/hooks/use-trading";
import { usePositionSummary } from "@/hooks/use-portfolio";
import { PageHeader } from "@/components/shared/page-header";
import { MetricCard } from "@/components/shared/metric-card";
import { ActivityFeed } from "@/components/markets/activity-feed";
import { CardGridSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardOverviewPage() {
  const { data: totalMarketsData, isLoading: loadingMarkets } = useMarkets();
  const { data: openMarketsData, isLoading: loadingOpenMarkets } = useMarkets({
    status: "open",
  });
  const { data: tradesData, isLoading: loadingTrades } = useTrades();
  const { data: posSummary, isLoading: loadingPosSummary } =
    usePositionSummary();

  const isStatsLoading =
    loadingMarkets || loadingOpenMarkets || loadingTrades || loadingPosSummary;

  const stats = [
    {
      label: "Total markets",
      value: (totalMarketsData?.count ?? 0).toLocaleString(),
      sub: "All created markets",
      icon: ChartBar,
      href: "/markets",
    },
    {
      label: "Open markets",
      value: (openMarketsData?.count ?? 0).toLocaleString(),
      sub: "Accepting orders",
      icon: Storefront,
      href: "/markets?status=open",
    },
    {
      label: "Total trades",
      value: (tradesData?.count ?? 0).toLocaleString(),
      sub: "Matched platform executions",
      icon: ArrowsLeftRight,
      href: "/trades",
    },
    {
      label: "Open positions",
      value: (posSummary?.open_positions ?? 0).toLocaleString(),
      sub: "Unsettled contracts",
      icon: Briefcase,
      href: "/positions",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Overview"
        description="Operational status, trading volume, and system activity across all prediction markets."
      >
        <Button variant="outline" size="sm" render={<Link href="/markets" />}>
          View markets
        </Button>
        <Button size="sm" render={<Link href="/markets/new" />}>
          <Plus size={14} />
          Create market
        </Button>
      </PageHeader>

      <section className="flex flex-col gap-3">
        <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Market metrics
        </h3>

        {isStatsLoading ? (
          <CardGridSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((stat, index) => (
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

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowSquareOut,
  CalendarBlank,
  ChartLine,
  DotsThree,
  ImageSquare,
  Lock,
  PencilSimple,
  Play,
  Scales,
  Star,
  UploadSimple,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  useCloseMarket,
  useMarket,
  useMarketStats,
  usePublishMarket,
} from "@/hooks/use-markets";
import { getApiErrorMessage } from "@/lib/api";
import { cn, formatDate, formatProbability } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { MarketStatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ActivityFeed } from "@/components/markets/activity-feed";
import { OutcomePriceChart } from "@/components/markets/outcome-price-chart";
import { OrderBookDepth } from "@/components/markets/order-book-depth";
import { TradeTape } from "@/components/markets/trade-tape";
import { ResolveMarketDialog } from "@/components/markets/resolve-market-dialog";
import { UploadImageDialog } from "@/components/markets/upload-image-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-4 w-24" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}

export default function MarketDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();

  const { data: market, isLoading, error } = useMarket(slug);
  const isOpen = market?.status === "open";
  const { data: stats } = useMarketStats(slug, isOpen);

  const publishMarket = usePublishMarket(slug);
  const closeMarket = useCloseMarket(slug);

  const [selectedOutcomeId, setSelectedOutcomeId] = useState<number | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  const outcomes = useMemo(
    () => (market?.outcomes ?? []).filter((outcome) => outcome.is_active),
    [market],
  );
  const activeOutcome =
    outcomes.find((outcome) => outcome.id === selectedOutcomeId) ?? outcomes[0];

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !market) {
    return (
      <EmptyState
        icon={ChartLine}
        title="Market not found"
        description="This market may have been removed, or the link is incorrect."
      >
        <Button variant="outline" size="sm" render={<Link href="/markets" />}>
          <ArrowLeft size={13} />
          Back to markets
        </Button>
      </EmptyState>
    );
  }

  const canEdit = market.status === "draft" || market.status === "open";
  const canPublish = market.status === "draft";
  const canClose = market.status === "open";
  const canResolve = market.status === "closed";
  const nextAction = canPublish
    ? {
        label: "Publish",
        icon: Play,
        onClick: () => setPublishOpen(true),
      }
    : canClose
      ? {
          label: "Close market",
          icon: Lock,
          onClick: () => setCloseOpen(true),
        }
      : canResolve
        ? {
            label: "Resolve",
            icon: Scales,
            onClick: () => setResolveOpen(true),
          }
        : null;

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.3, bounce: 0 }}
      >
        <Link
          href="/markets"
          className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={12} />
          Markets
        </Link>
      </motion.div>

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="hidden size-16 shrink-0 items-center justify-center overflow-hidden border border-border bg-muted/40 sm:flex">
              {market.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={market.image_url}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <ImageSquare size={22} className="text-muted-foreground" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <MarketStatusBadge status={market.status} />
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                  {market.market_type === "binary" ? "Binary" : "Multi outcome"}
                </Badge>
                {market.is_featured && (
                  <Badge variant="secondary" className="gap-1 text-[10px] uppercase tracking-wider">
                    <Star size={10} weight="fill" />
                    Featured
                  </Badge>
                )}
                {market.category?.name && (
                  <span className="text-[11px] text-muted-foreground">
                    {market.category.name}
                  </span>
                )}
              </div>
              <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-balance">
                {market.title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">
                {market.question}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {nextAction && (
              <Button size="sm" onClick={nextAction.onClick}>
                <nextAction.icon size={13} />
                {nextAction.label}
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="icon-sm" aria-label="Market actions" />
                }
              >
                <DotsThree size={16} weight="bold" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem
                    render={<Link href={`/markets/${market.slug}/edit`} />}
                  >
                    <PencilSimple size={13} />
                    Edit market
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setImageOpen(true)}>
                  <UploadSimple size={13} />
                  Upload image
                </DropdownMenuItem>
                {canResolve && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setResolveOpen(true)}>
                      <Scales size={13} />
                      Resolve or void
                    </DropdownMenuItem>
                  </>
                )}
                {market.status === "open" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/trades")}>
                      <ChartLine size={13} />
                      View trades
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarBlank size={12} />
            Opens {formatDate(market.opens_at)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Lock size={12} />
            Closes {formatDate(market.closes_at)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Scales size={12} />
            Resolve by {formatDate(market.resolution_deadline)}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Latest price"
          value={
            stats?.latest_price != null
              ? formatProbability(stats.latest_price)
              : "—"
          }
          sub={
            stats?.last_trade_at
              ? `Last trade ${formatDate(stats.last_trade_at)}`
              : "No trades yet"
          }
          icon={ChartLine}
          index={0}
        />
        <MetricCard
          label="Volume"
          value={(stats?.total_volume ?? 0).toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}
          sub="Reported trade volume"
          index={1}
        />
        <MetricCard
          label="Trades"
          value={stats?.trade_count ?? 0}
          sub="Matched executions"
          index={2}
        />
        <MetricCard
          label="Outcomes"
          value={outcomes.length}
          sub={market.status === "draft" ? "Editable while draft" : "Locked after publish"}
          index={3}
        />
      </div>

      {/* Chart + book */}
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Outcome price</CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Historical probability for the selected outcome.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-1.5">
              {outcomes.map((outcome) => (
                <button
                  key={outcome.id}
                  type="button"
                  onClick={() => setSelectedOutcomeId(outcome.id)}
                  className={cn(
                    "border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    activeOutcome?.id === outcome.id
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                  )}
                >
                  {outcome.name}
                </button>
              ))}
            </div>
            <OutcomePriceChart outcomeId={activeOutcome?.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Depth</CardTitle>
            <p className="text-[11px] text-muted-foreground">
              {activeOutcome ? activeOutcome.name : "Select an outcome"}
            </p>
          </CardHeader>
          <CardContent>
            <OrderBookDepth outcomeId={activeOutcome?.id} isOpen={isOpen} />
          </CardContent>
        </Card>
      </div>

      {/* Outcomes + trades */}
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Outcomes</CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Winners pay 10,000 credits per contract at settlement.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border/60">
            {outcomes.length === 0 ? (
              <EmptyState
                icon={ChartLine}
                title="No active outcomes"
                description="Add at least two outcomes before publishing."
                className="py-8"
              />
            ) : (
              outcomes.map((outcome) => (
                <button
                  key={outcome.id}
                  type="button"
                  onClick={() => setSelectedOutcomeId(outcome.id)}
                  className={cn(
                    "flex items-center justify-between gap-3 py-2.5 text-start transition-colors",
                    activeOutcome?.id === outcome.id
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{outcome.name}</p>
                    <p className="truncate font-mono text-[10px] text-muted-foreground">
                      {outcome.slug}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {outcome.description && (
                      <span className="hidden max-w-40 truncate text-[10px] text-muted-foreground sm:inline">
                        {outcome.description}
                      </span>
                    )}
                    <Badge
                      variant={outcome.is_active ? "outline" : "secondary"}
                      className="text-[9px] uppercase tracking-wider"
                    >
                      {outcome.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent trades</CardTitle>
            <p className="text-[11px] text-muted-foreground">
              {activeOutcome ? activeOutcome.name : "Select an outcome"}
            </p>
          </CardHeader>
          <CardContent>
            <TradeTape outcomeId={activeOutcome?.id} />
          </CardContent>
        </Card>
      </div>

      {/* Resolution + activity */}
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Orders, executions, and settlement events.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <ActivityFeed outcomeId={activeOutcome?.id} limit={8} showLoadMore={false} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resolution</CardTitle>
            <p className="text-[11px] text-muted-foreground">
              How this market will be settled.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Criteria
              </span>
              <p className="text-xs leading-relaxed text-pretty">
                {market.resolution_criteria || "No criteria recorded."}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Source
              </span>
              <p className="text-xs leading-relaxed text-pretty">
                {market.resolution_source_description || "No source described."}
              </p>
              {market.resolution_source_url && (
                <a
                  href={market.resolution_source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-foreground underline-offset-4 hover:underline"
                >
                  Open source
                  <ArrowSquareOut size={11} />
                </a>
              )}
            </div>
            {market.description && (
              <div className="flex flex-col gap-1 border-t border-border pt-3">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Description
                </span>
                <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
                  {market.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title="Publish this market?"
        description="Publishing opens the market for trading. Outcomes become locked and cannot be added or removed."
        confirmLabel="Publish market"
        loading={publishMarket.isPending}
        onConfirm={() =>
          publishMarket.mutate(undefined, {
            onSuccess: () => {
              toast.success("Market published");
              setPublishOpen(false);
            },
            onError: (mutationError) =>
              toast.error(getApiErrorMessage(mutationError)),
          })
        }
      />

      <ConfirmDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title="Close this market?"
        description="Closing stops trading immediately and cancels every remaining open order, releasing reserved credits."
        confirmLabel="Close market"
        destructive
        loading={closeMarket.isPending}
        onConfirm={() =>
          closeMarket.mutate(undefined, {
            onSuccess: () => {
              toast.success("Market closed");
              setCloseOpen(false);
            },
            onError: (mutationError) =>
              toast.error(getApiErrorMessage(mutationError)),
          })
        }
      />

      <ResolveMarketDialog
        market={market}
        open={resolveOpen}
        onOpenChange={setResolveOpen}
      />

      <UploadImageDialog
        market={market}
        open={imageOpen}
        onOpenChange={setImageOpen}
      />
    </div>
  );
}

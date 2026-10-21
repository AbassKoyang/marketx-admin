"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Funnel,
  MagnifyingGlass,
  Plus,
  Star,
  X,
} from "@phosphor-icons/react";
import { useMarkets } from "@/hooks/use-markets";
import { useCategoriesList } from "@/hooks/use-categories";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { MarketStatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { MarketStatus, MarketType } from "@/lib/types";

const STATUS_OPTIONS: Array<{ value: MarketStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "resolved", label: "Resolved" },
  { value: "void", label: "Void" },
];

const TYPE_OPTIONS: Array<{ value: MarketType | "all"; label: string }> = [
  { value: "all", label: "All types" },
  { value: "binary", label: "Binary" },
  { value: "multi_outcome", label: "Multi outcome" },
];

function MarketsSkeleton() {
  return (
    <div className="border border-border bg-card">
      <TableSkeleton rows={8} cols={5} />
    </div>
  );
}

function FilterControls({
  status,
  marketType,
  category,
  onStatus,
  onType,
  onCategory,
}: {
  status: string;
  marketType: string;
  category: string;
  onStatus: (value: string) => void;
  onType: (value: string) => void;
  onCategory: (value: string) => void;
}) {
  const { data: categories } = useCategoriesList();

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <div className="flex flex-col gap-1.5">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Status
        </Label>
        <Select value={status || "all"} onValueChange={(v) => onStatus(String(v))}>
          <SelectTrigger className="w-full lg:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Type
        </Label>
        <Select value={marketType || "all"} onValueChange={(v) => onType(String(v))}>
          <SelectTrigger className="w-full lg:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Category
        </Label>
        <Select value={category || "all"} onValueChange={(v) => onCategory(String(v))}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories?.results.map((c) => (
              <SelectItem key={c.id} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function MarketsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const status = searchParams.get("status") ?? "";
  const category = searchParams.get("category") ?? "";
  const marketType = searchParams.get("market_type") ?? "";
  const search = searchParams.get("search") ?? "";
  const isFeatured = searchParams.get("featured") === "true";

  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const setParams = useCallback(
    (
      patch: Record<string, string | number | boolean | undefined>,
      resetPage = true,
    ) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([key, value]) => {
        if (value === undefined || value === "" || value === "all" || value === false) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });
      if (resetPage && !("page" in patch)) next.delete("page");
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (debouncedSearch === search) return;
    setParams({ search: debouncedSearch || undefined });
    // Only react to the debounced value so typing does not push history entries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const { data, isLoading, isFetching } = useMarkets({
    page,
    status: status as MarketStatus | "",
    category,
    market_type: marketType as MarketType | "",
    search,
    featured: isFeatured ? true : "",
  });

  const markets = data?.results ?? [];
  const activeFilterCount = [status, category, marketType, search, isFeatured].filter(
    Boolean,
  ).length;

  const clearFilters = () => {
    setSearchInput("");
    setParams({
      status: undefined,
      category: undefined,
      market_type: undefined,
      search: undefined,
      featured: undefined,
      page: undefined,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Markets"
        description="Create, publish, and resolve every prediction market on the platform."
      >
        <Button size="sm" render={<Link href="/markets/new" />}>
          <Plus size={14} />
          Create market
        </Button>
      </PageHeader>

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass
              size={14}
              className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search markets by question…"
              className="ps-8"
              aria-label="Search markets"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setFiltersOpen(true)}
          >
            <Funnel size={13} />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ms-1 h-4 px-1 text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          <Button
            variant={isFeatured ? "default" : "outline"}
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => setParams({ featured: isFeatured ? undefined : true })}
            aria-pressed={isFeatured}
          >
            <Star size={13} weight={isFeatured ? "fill" : "regular"} />
            Featured
          </Button>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="hidden text-muted-foreground lg:inline-flex"
              onClick={clearFilters}
            >
              <X size={12} />
              Clear
            </Button>
          )}
        </div>

        <div className="hidden lg:block">
          <FilterControls
            status={status}
            marketType={marketType}
            category={category}
            onStatus={(value) => setParams({ status: value })}
            onType={(value) => setParams({ market_type: value })}
            onCategory={(value) => setParams({ category: value })}
          />
        </div>
      </div>

      {/* Mobile filter sheet */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh]">
          <SheetHeader>
            <SheetTitle>Filter markets</SheetTitle>
            <SheetDescription>
              Narrow the list by lifecycle status, market type, or category.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-2">
            <FilterControls
              status={status}
              marketType={marketType}
              category={category}
              onStatus={(value) => setParams({ status: value })}
              onType={(value) => setParams({ market_type: value })}
              onCategory={(value) => setParams({ category: value })}
            />
            <div className="mt-4 flex flex-col gap-2">
              <Button
                variant={isFeatured ? "default" : "outline"}
                size="sm"
                onClick={() => setParams({ featured: isFeatured ? undefined : true })}
                aria-pressed={isFeatured}
              >
                <Star size={13} weight={isFeatured ? "fill" : "regular"} />
                Featured only
              </Button>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X size={12} />
                  Clear all filters
                </Button>
              )}
            </div>
          </div>
          <div className="border-t border-border p-4">
            <Button className="w-full" onClick={() => setFiltersOpen(false)}>
              Show results
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Results */}
      <div
        className={isFetching && !isLoading ? "opacity-60 transition-opacity" : ""}
        aria-busy={isFetching}
      >
        {isLoading ? (
          <MarketsSkeleton />
        ) : markets.length === 0 ? (
          <div className="border border-border bg-card">
            <EmptyState
              icon={MagnifyingGlass}
              title={activeFilterCount > 0 ? "No markets match" : "No markets yet"}
              description={
                activeFilterCount > 0
                  ? "Try a broader search or clear your filters to see more markets."
                  : "Create the first market, add its outcomes, then publish it for trading."
              }
            >
              {activeFilterCount > 0 ? (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button size="sm" render={<Link href="/markets/new" />}>
                  <Plus size={14} />
                  Create market
                </Button>
              )}
            </EmptyState>
          </div>
        ) : (
          <div className="border border-border bg-card">
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="ps-4">Market</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-end">Outcomes</TableHead>
                    <TableHead>Closes</TableHead>
                    <TableHead className="w-10 pe-4">
                      <span className="sr-only">Open</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {markets.map((market, index) => (
                    <motion.tr
                      key={market.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        type: "spring",
                        duration: 0.3,
                        bounce: 0,
                        delay: Math.min(index * 0.025, 0.2),
                      }}
                      className="border-b transition-colors hover:bg-muted/40"
                    >
                      <TableCell className="max-w-[380px] ps-4 align-top whitespace-normal">
                        <Link
                          href={`/markets/${market.slug}`}
                          className="flex items-center gap-1.5 font-medium text-foreground hover:underline"
                        >
                          <span className="line-clamp-1">{market.title}</span>
                          {market.is_featured && (
                            <Star
                              size={12}
                              weight="fill"
                              className="shrink-0 text-muted-foreground"
                              aria-label="Featured"
                            />
                          )}
                        </Link>
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                          {market.question}
                        </p>
                      </TableCell>
                      <TableCell>
                        <MarketStatusBadge status={market.status} />
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground">
                        {market.market_type === "binary" ? "Binary" : "Multi outcome"}
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground">
                        {market.category?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-end font-mono text-[11px] tabular-nums">
                        {market.outcomes?.length ?? 0}
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground tabular-nums">
                        {market.closes_at ? formatDate(market.closes_at) : "—"}
                      </TableCell>
                      <TableCell className="pe-4">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          render={<Link href={`/markets/${market.slug}`} />}
                          aria-label={`Open ${market.title}`}
                        >
                          <ArrowRight size={13} />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile list */}
            <ul className="divide-y divide-border md:hidden">
              {markets.map((market) => (
                <li key={market.id}>
                  <Link
                    href={`/markets/${market.slug}`}
                    className="flex items-start gap-3 p-4 transition-colors active:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="line-clamp-2 text-sm font-medium">{market.title}</p>
                        {market.is_featured && (
                          <Star
                            size={12}
                            weight="fill"
                            className="shrink-0 text-muted-foreground"
                          />
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                        {market.category?.name ?? "Uncategorised"} · Closes{" "}
                        {market.closes_at ? formatDate(market.closes_at) : "—"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <MarketStatusBadge status={market.status} />
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase tracking-wider"
                        >
                          {market.market_type === "binary" ? "Binary" : "Multi"}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {market.outcomes?.length ?? 0} outcomes
                        </span>
                      </div>
                    </div>
                    <ArrowRight
                      size={14}
                      className="mt-1 shrink-0 text-muted-foreground"
                    />
                  </Link>
                </li>
              ))}
            </ul>

            <Pagination
              page={page}
              count={data?.count ?? 0}
              onPageChange={(nextPage) => setParams({ page: nextPage }, false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function MarketsPage() {
  return (
    <Suspense fallback={<MarketsSkeleton />}>
      <MarketsContent />
    </Suspense>
  );
}

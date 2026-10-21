"use client";

import { useMemo, useState } from "react";
import { ChartLine } from "@phosphor-icons/react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { useOutcomeHistory } from "@/hooks/use-markets";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatUnixTimestamp } from "@/lib/utils";
import type { PriceHistoryRange } from "@/lib/types";

const RANGES: PriceHistoryRange[] = ["1H", "6H", "1D", "1W", "1M", "ALL"];

const chartConfig = {
  price: { label: "Probability", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function OutcomePriceChart({ outcomeId }: { outcomeId?: number }) {
  const [range, setRange] = useState<PriceHistoryRange>("1D");
  const { data, isLoading } = useOutcomeHistory(outcomeId ?? 0, { range });

  const points = useMemo(
    () =>
      (data?.data ?? []).map((point) => ({
        time: formatUnixTimestamp(point.timestamp, range),
        price: Number((point.price * 100).toFixed(2)),
        volume: point.volume,
      })),
    [data, range],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Price history
        </span>
        <ToggleGroup
          value={[range]}
          onValueChange={(value) => {
            const next = value[0] as PriceHistoryRange | undefined;
            if (next) setRange(next);
          }}
          size="sm"
          spacing={0}
        >
          {RANGES.map((option) => (
            <ToggleGroupItem
              key={option}
              value={option}
              className="px-2 font-mono text-[10px] uppercase tracking-wider"
            >
              {option}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {isLoading ? (
        <Skeleton className="h-52 w-full" />
      ) : points.length === 0 ? (
        <EmptyState
          icon={ChartLine}
          title="No price history"
          description="Trades for this outcome will draw the price chart."
          className="py-10"
        />
      ) : (
        <ChartContainer config={chartConfig} className="h-52 w-full aspect-auto">
          <LineChart data={points} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={28}
            />
            <YAxis
              width={42}
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              domain={["auto", "auto"]}
              tickFormatter={(value: number) => `${value}%`}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--border)", strokeDasharray: "3 3" }}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="var(--color-price)"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      )}
    </div>
  );
}

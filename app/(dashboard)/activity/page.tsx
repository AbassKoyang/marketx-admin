"use client";

import { useState } from "react";
import { ActivityIcon } from "@phosphor-icons/react";
import { useOutcomes } from "@/hooks/use-outcomes";
import { PageHeader } from "@/components/shared/page-header";
import { ActivityFeed } from "@/components/markets/activity-feed";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ActivityPage() {
  const [outcome, setOutcome] = useState("all");
  const outcomeId = outcome === "all" ? undefined : Number(outcome);
  const { data: outcomesData } = useOutcomes();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Activity"
        description="Chronological stream of orders, executions, and settlements across the platform."
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Outcome
          </Label>
          <Select
            value={outcome}
            onValueChange={(value) => setOutcome(String(value ?? "all"))}
          >
            <SelectTrigger className="w-56">
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

        <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <ActivityIcon size={12} />
          Private events are only visible to the account that generated them.
        </p>
      </div>

      <div className="border border-border bg-card">
        <ActivityFeed outcomeId={outcomeId} showLoadMore />
      </div>
    </div>
  );
}

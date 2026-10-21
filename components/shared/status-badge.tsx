"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MarketStatus } from "@/lib/types";

const STATUS_STYLES: Record<
  MarketStatus,
  { variant: "default" | "secondary" | "outline" | "ghost"; label: string }
> = {
  draft: { variant: "outline", label: "Draft" },
  open: { variant: "default", label: "Open" },
  closed: { variant: "secondary", label: "Closed" },
  resolved: { variant: "secondary", label: "Resolved" },
  void: { variant: "outline", label: "Void" },
};

export function MarketStatusBadge({
  status,
  className,
}: {
  status: MarketStatus;
  className?: string;
}) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.draft;

  return (
    <Badge
      variant={style.variant}
      className={cn(
        "gap-1.5 text-[10px] uppercase tracking-wider",
        status === "void" && "border-dashed text-muted-foreground",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full bg-current",
          status === "open" ? "opacity-100" : "opacity-40",
        )}
      />
      {style.label}
    </Badge>
  );
}

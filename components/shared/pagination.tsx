"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  count,
  pageSize = 10,
  onPageChange,
  className,
}: {
  page: number;
  count: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  if (count === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, count);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-t border-border px-4 py-3",
        className,
      )}
    >
      <p className="text-[11px] text-muted-foreground tabular-nums">
        <span className="text-foreground">{start}</span>–
        <span className="text-foreground">{end}</span> of{" "}
        <span className="text-foreground">{count}</span>
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <CaretLeft size={14} />
        </Button>
        <span className="min-w-14 text-center font-mono text-[11px] text-muted-foreground tabular-nums">
          {page} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <CaretRight size={14} />
        </Button>
      </div>
    </div>
  );
}

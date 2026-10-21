"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: React.ElementType;
  href?: string;
  index?: number;
  className?: string;
}

export function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  href,
  index = 0,
  className,
}: MetricCardProps) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {Icon && (
          <Icon
            size={15}
            className="text-muted-foreground transition-colors group-hover:text-foreground"
          />
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
          {value}
        </span>
        {href && (
          <ArrowUpRight
            size={13}
            className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          />
        )}
      </div>
      {sub && (
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {sub}
        </p>
      )}
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", duration: 0.35, bounce: 0, delay: index * 0.04 }}
      className={cn(
        "group relative border border-border bg-card p-4 transition-colors hover:border-foreground/25",
        className,
      )}
    >
      {href ? (
        <Link href={href} className="block">
          {content}
        </Link>
      ) : (
        content
      )}
    </motion.div>
  );
}

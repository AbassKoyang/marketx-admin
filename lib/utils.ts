export { cn } from "cn";

// ─── Credit Formatting ────────────────────────────────────────────────────────

export const CREDIT_SCALE = 10_000;
export const MIN_PRICE = 1;
export const MAX_PRICE = 9_999;

/** Format integer credit units → "1.23" display credits */
export function formatCredits(units: number): string {
  return (units / CREDIT_SCALE).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Format integer price tick (0–10000) → "0.42" */
export function formatPrice(tick: number): string {
  return (tick / CREDIT_SCALE).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

/** Format a 0–1 probability as "42.0%" */
export function formatProbability(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/** Format an integer LMSR tick (0–10000) as "42.0%" */
export function formatTickProbability(tick: number | null | undefined): string {
  if (tick == null) return "—";
  return `${(tick / 100).toFixed(1)}%`;
}

/** Format a signed credit delta, e.g. "+1.20" / "−0.50" */
export function formatSignedCredits(units: number): string {
  const formatted = formatCredits(Math.abs(units));
  return `${units < 0 ? "−" : "+"}${formatted}`;
}

/**
 * Exact trade cash. Legacy rows predate `notional` and store 0, so fall back
 * to the rounded price × quantity only in that case.
 */
export function tradeNotional(trade: {
  notional: number;
  price: number;
  quantity: number;
}): number {
  return trade.notional === 0 ? trade.price * trade.quantity : trade.notional;
}

/** Turn a display name into a URL-safe slug */
export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Format a price decimal already in 0-1 range */
export function formatPriceDecimal(price: number): string {
  return price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

// ─── Date Formatting ──────────────────────────────────────────────────────────

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Convert a Unix timestamp (seconds) to a readable label */
export function formatUnixTimestamp(ts: number, range: string): string {
  const date = new Date(ts * 1000);
  if (range === "1H" || range === "6H") {
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (range === "1D") {
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// ─── Status helpers ───────────────────────────────────────────────────────────

export function getStatusColor(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "open":
      return "default";
    case "draft":
      return "secondary";
    case "closed":
      return "outline";
    case "resolved":
      return "secondary";
    case "void":
      return "destructive";
    default:
      return "outline";
  }
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export function generateClientOrderId(): string {
  return `admin-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function truncate(str: string, n: number): string {
  return str.length > n ? `${str.slice(0, n)}…` : str;
}

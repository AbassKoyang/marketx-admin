import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  AdminOrder,
  AdminOverview,
  AdminPosition,
  AdminTrade,
  AdminUser,
  AdminWallet,
  PaginatedResponse,
  WalletLedgerEntry,
} from "@/lib/types";

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const adminKeys = {
  all: ["admin"] as const,
  overview: () => ["admin", "overview"] as const,
  users: (params: Record<string, unknown>) =>
    ["admin", "users", params] as const,
  user: (id: number) => ["admin", "user", id] as const,
  userLedger: (id: number, params: Record<string, unknown>) =>
    ["admin", "user", id, "ledger", params] as const,
  wallets: (params: Record<string, unknown>) =>
    ["admin", "wallets", params] as const,
  orders: (params: Record<string, unknown>) =>
    ["admin", "orders", params] as const,
  positions: (params: Record<string, unknown>) =>
    ["admin", "positions", params] as const,
  trades: (params: Record<string, unknown>) =>
    ["admin", "trades", params] as const,
};

const PAGE_SIZE = 20;

function cleanParams(params: Record<string, unknown>) {
  const merged: Record<string, unknown> = {
    page_size: PAGE_SIZE,
    ...params,
  };
  return Object.fromEntries(
    Object.entries(merged).filter(
      ([, value]) => value !== "" && value !== undefined && value !== null,
    ),
  );
}

// ─── Overview ────────────────────────────────────────────────────────────────

export function useAdminOverview() {
  return useQuery<AdminOverview>({
    queryKey: adminKeys.overview(),
    queryFn: () => apiFetch<AdminOverview>("/api/admin/overview/"),
    staleTime: 30_000,
  });
}

// ─── Users ───────────────────────────────────────────────────────────────────

type AdminUserFilters = {
  page?: number;
  search?: string;
  is_staff?: boolean;
  is_active?: boolean;
  onboarded?: boolean;
  /** true = liquidity account only, false = customers only. */
  market_maker?: boolean;
};

export function useAdminUsers(filters: AdminUserFilters = {}) {
  return useQuery<PaginatedResponse<AdminUser>>({
    queryKey: adminKeys.users(filters),
    queryFn: () =>
      apiFetch<PaginatedResponse<AdminUser>>("/api/admin/users/", {
        params: cleanParams(filters),
      }),
    placeholderData: (prev) => prev,
  });
}

export function useAdminUser(id: number) {
  return useQuery<AdminUser>({
    queryKey: adminKeys.user(id),
    queryFn: () => apiFetch<AdminUser>(`/api/admin/users/${id}/`),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useAdminUserLedger(id: number, page = 1) {
  const params = { page };
  return useQuery<PaginatedResponse<WalletLedgerEntry>>({
    queryKey: adminKeys.userLedger(id, params),
    queryFn: () =>
      apiFetch<PaginatedResponse<WalletLedgerEntry>>(
        `/api/admin/users/${id}/ledger/`,
        { params: cleanParams(params) },
      ),
    placeholderData: (prev) => prev,
    enabled: Number.isFinite(id) && id > 0,
  });
}

// ─── Wallets ─────────────────────────────────────────────────────────────────

export function useAdminWallets(
  params: { page?: number; search?: string; market_maker?: boolean } = {},
) {
  return useQuery<PaginatedResponse<AdminWallet>>({
    queryKey: adminKeys.wallets(params),
    queryFn: () =>
      apiFetch<PaginatedResponse<AdminWallet>>("/api/admin/wallets/", {
        params: cleanParams(params),
      }),
    placeholderData: (prev) => prev,
  });
}

// ─── Orders ──────────────────────────────────────────────────────────────────

type AdminOrderFilters = {
  page?: number;
  search?: string;
  status?: string;
  side?: string;
  user?: number;
  /** true = market-maker/AMM orders only, false = customer orders only. */
  market_maker?: boolean;
};

export function useAdminOrders(params: AdminOrderFilters = {}) {
  return useQuery<PaginatedResponse<AdminOrder>>({
    queryKey: adminKeys.orders(params),
    queryFn: () =>
      apiFetch<PaginatedResponse<AdminOrder>>("/api/admin/orders/", {
        params: cleanParams(params),
      }),
    placeholderData: (prev) => prev,
  });
}

export function useCancelAdminOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<AdminOrder>(`/api/admin/orders/${id}/cancel/`, {
        method: "post",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "positions"] });
      qc.invalidateQueries({ queryKey: ["admin", "wallets"] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "overview"] });
      qc.invalidateQueries({ queryKey: ["admin", "user"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["wallet-ledger"] });
      qc.invalidateQueries({ queryKey: ["positions"] });
      qc.invalidateQueries({ queryKey: ["positions-summary"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
      qc.invalidateQueries({ queryKey: ["market-stats"] });
      qc.invalidateQueries({ queryKey: ["order-book"] });
      qc.invalidateQueries({ queryKey: ["trades"] });
    },
  });
}

// ─── Positions ───────────────────────────────────────────────────────────────

type AdminPositionFilters = {
  page?: number;
  search?: string;
  user?: number;
  settled?: boolean;
  /** true = house inventory only, false = customer positions only. */
  market_maker?: boolean;
};

export function useAdminPositions(params: AdminPositionFilters = {}) {
  return useQuery<PaginatedResponse<AdminPosition>>({
    queryKey: adminKeys.positions(params),
    queryFn: () =>
      apiFetch<PaginatedResponse<AdminPosition>>("/api/admin/positions/", {
        params: cleanParams(params),
      }),
    placeholderData: (prev) => prev,
  });
}

// ─── Trades ──────────────────────────────────────────────────────────────────

type AdminTradeFilters = {
  page?: number;
  search?: string;
  user?: number;
  /** false returns only trades where neither party is the house account. */
  market_maker?: boolean;
};

export function useAdminTrades(params: AdminTradeFilters = {}) {
  return useQuery<PaginatedResponse<AdminTrade>>({
    queryKey: adminKeys.trades(params),
    queryFn: () =>
      apiFetch<PaginatedResponse<AdminTrade>>("/api/admin/trades/", {
        params: cleanParams(params),
      }),
    placeholderData: (prev) => prev,
  });
}

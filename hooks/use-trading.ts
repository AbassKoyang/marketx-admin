import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  Order,
  OrderSide,
  PaginatedResponse,
  Quote,
  Trade,
} from "@/lib/types";

export function useTrades(
  params: { page?: number; outcome?: number } = {},
  enabled = true,
) {
  return useQuery<PaginatedResponse<Trade>>({
    queryKey: ["trades", params],
    queryFn: () =>
      apiFetch<PaginatedResponse<Trade>>("/api/trading/trades/", { params }),
    placeholderData: (prev) => prev,
    refetchInterval: 15_000,
    enabled,
  });
}

export function useMyTrades(page = 1, enabled = true) {
  return useQuery<PaginatedResponse<Trade>>({
    queryKey: ["my-trades", { page }],
    queryFn: () =>
      apiFetch<PaginatedResponse<Trade>>("/api/trading/trades/", {
        params: { page, mine: true },
      }),
    placeholderData: (prev) => prev,
    enabled,
  });
}

export function useTradesFeed(outcomeId?: number) {
  return useInfiniteQuery<PaginatedResponse<Trade>>({
    queryKey: ["trades-feed", { outcomeId }],
    queryFn: ({ pageParam = 1 }) =>
      apiFetch<PaginatedResponse<Trade>>("/api/trading/trades/", {
        params: { page: pageParam, ...(outcomeId ? { outcome: outcomeId } : {}) },
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.next ? (lastPageParam as number) + 1 : undefined,
  });
}

export function useOrders(page = 1) {
  return useQuery<PaginatedResponse<Order>>({
    queryKey: ["orders", { page }],
    queryFn: () =>
      apiFetch<PaginatedResponse<Order>>("/api/trading/orders/", {
        params: { page },
      }),
    placeholderData: (prev) => prev,
  });
}

/**
 * Read-only LMSR quote. Call it before submitting to show expected cash,
 * average price, and how much of the requested quantity can actually fill.
 */
export function useQuote(
  params: {
    outcome?: number;
    side?: OrderSide;
    quantity?: number;
    limit_price?: number | null;
  },
  enabled = true,
) {
  const { outcome, side, quantity, limit_price } = params;
  const canQuote =
    enabled &&
    Number.isFinite(outcome) &&
    (outcome ?? 0) > 0 &&
    !!side &&
    Number.isFinite(quantity) &&
    (quantity ?? 0) > 0;

  return useQuery<Quote>({
    queryKey: ["quote", { outcome, side, quantity, limit_price }],
    queryFn: () =>
      apiFetch<Quote>("/api/trading/quote/", {
        params: {
          outcome,
          side,
          quantity,
          ...(limit_price != null ? { limit_price } : {}),
        },
      }),
    enabled: canQuote,
    staleTime: 5_000,
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<Order>(`/api/trading/orders/${id}/`, { method: "delete" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["wallet-ledger"] });
      qc.invalidateQueries({ queryKey: ["positions"] });
      qc.invalidateQueries({ queryKey: ["positions-summary"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useSubmitOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      outcome: number;
      side: OrderSide;
      /** Optional slippage cap. Omit for a market order. */
      limit_price?: number | null;
      quantity: number;
      client_order_id: string;
    }) =>
      apiFetch<Order>("/api/trading/orders/", {
        method: "post",
        data: payload,
      }),
    onSuccess: () => {
      // Orders execute immediately; there is nothing to poll. Refresh every
      // derived view instead.
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["wallet-ledger"] });
      qc.invalidateQueries({ queryKey: ["positions"] });
      qc.invalidateQueries({ queryKey: ["positions-summary"] });
      qc.invalidateQueries({ queryKey: ["market-stats"] });
      qc.invalidateQueries({ queryKey: ["order-book"] });
      qc.invalidateQueries({ queryKey: ["trades"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
      qc.invalidateQueries({ queryKey: ["quote"] });
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

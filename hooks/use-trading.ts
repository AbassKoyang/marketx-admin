import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Trade, PaginatedResponse } from "@/lib/types";

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

import type { Order } from "@/lib/types";

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

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<Order>(`/api/trading/orders/${id}/`, { method: "delete" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["positions"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useSubmitOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      outcome: number;
      side: "buy" | "sell";
      limit_price: number;
      quantity: number;
      client_order_id: string;
    }) =>
      apiFetch<Order>("/api/trading/orders/", {
        method: "post",
        data: payload,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["positions"] });
    },
  });
}

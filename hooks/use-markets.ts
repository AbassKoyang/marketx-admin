import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  Market,
  MarketStats,
  PaginatedResponse,
  MarketStatus,
  MarketType,
  PriceHistoryRange,
  PriceHistoryResponse,
  OrderBook,
} from "@/lib/types";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const marketKeys = {
  all: ["markets"] as const,
  list: (filters: Record<string, unknown>) =>
    [...marketKeys.all, filters] as const,
  detail: (slug: string) => ["market", slug] as const,
  stats: (slug: string) => ["market-stats", slug] as const,
  orderBook: (outcomeId: number, limit?: number) =>
    ["order-book", outcomeId, { limit }] as const,
  outcomeHistory: (
    outcomeId: number,
    params: { range: PriceHistoryRange; limit?: number; offset?: number },
  ) => ["outcome-history", outcomeId, params] as const,
};

// ─── Market List ──────────────────────────────────────────────────────────────

type MarketFilters = {
  page?: number;
  status?: MarketStatus | "";
  category?: string;
  market_type?: MarketType | "";
  search?: string;
  featured?: boolean | "";
};

export function useMarkets(filters: MarketFilters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== "" && v !== undefined),
  );

  return useQuery<PaginatedResponse<Market>>({
    queryKey: marketKeys.list(filters),
    queryFn: () =>
      apiFetch<PaginatedResponse<Market>>("/api/markets/", { params }),
    placeholderData: (prev) => prev,
  });
}

// ─── Market Detail ────────────────────────────────────────────────────────────

export function useMarket(slug: string) {
  return useQuery<Market>({
    queryKey: marketKeys.detail(slug),
    queryFn: () => apiFetch<Market>(`/api/markets/${slug}/`),
    enabled: !!slug,
  });
}

// ─── Market Stats ─────────────────────────────────────────────────────────────

export function useMarketStats(slug: string, isOpen = false) {
  return useQuery<MarketStats>({
    queryKey: marketKeys.stats(slug),
    queryFn: () => apiFetch<MarketStats>(`/api/markets/${slug}/stats/`),
    enabled: !!slug,
    refetchInterval: isOpen ? 10_000 : false,
  });
}

// ─── Outcome Price History ────────────────────────────────────────────────────

export function useOutcomeHistory(
  outcomeId: number,
  params: { range: PriceHistoryRange; limit?: number; offset?: number } = {
    range: "1D",
  },
) {
  return useQuery<PriceHistoryResponse>({
    queryKey: marketKeys.outcomeHistory(outcomeId, params),
    queryFn: () =>
      apiFetch<PriceHistoryResponse>(`/api/outcomes/${outcomeId}/history/`, {
        params,
      }),
    enabled: !!outcomeId,
  });
}

// ─── Order Book ───────────────────────────────────────────────────────────────

export function useOrderBook(outcomeId: number, limit = 10, isOpen = false) {
  return useQuery<OrderBook>({
    queryKey: marketKeys.orderBook(outcomeId, limit),
    queryFn: () =>
      apiFetch<OrderBook>(`/api/trading/order-books/${outcomeId}/`, {
        params: { limit },
      }),
    enabled: !!outcomeId,
    refetchInterval: isOpen ? 8_000 : false,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function usePublishMarket(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<Market>(`/api/markets/${slug}/publish/`, { method: "post" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: marketKeys.detail(slug) });
      qc.invalidateQueries({ queryKey: marketKeys.all });
    },
  });
}

export function useCloseMarket(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<Market>(`/api/markets/${slug}/close/`, { method: "post" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: marketKeys.detail(slug) });
      qc.invalidateQueries({ queryKey: marketKeys.all });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["positions"] });
    },
  });
}

export function useResolveMarket(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      winning_outcome?: number;
      is_void: boolean;
      evidence_summary: string;
      evidence_url?: string;
    }) =>
      apiFetch<Market>(`/api/markets/${slug}/resolve/`, {
        method: "post",
        data: payload,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: marketKeys.detail(slug) });
      qc.invalidateQueries({ queryKey: marketKeys.all });
      qc.invalidateQueries({ queryKey: ["positions"] });
      qc.invalidateQueries({ queryKey: ["trades"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useCreateMarket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Market> & { category_id?: number }) =>
      apiFetch<Market>("/api/markets/", { method: "post", data: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: marketKeys.all });
    },
  });
}

export function useUpdateMarket(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Market> & { category_id?: number }) =>
      apiFetch<Market>(`/api/markets/${slug}/`, {
        method: "patch",
        data: payload,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: marketKeys.detail(slug) });
      qc.invalidateQueries({ queryKey: marketKeys.all });
    },
  });
}

export function useUploadMarketImage(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      return apiFetch<Market>(`/api/markets/${slug}/upload_image/`, {
        method: "post",
        data: formData,
        headers: { "Content-Type": undefined },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: marketKeys.detail(slug) });
      qc.invalidateQueries({ queryKey: marketKeys.all });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  MarketOutcome,
  OutcomeWritePayload,
  PaginatedResponse,
} from "@/lib/types";

export const outcomeKeys = {
  all: ["outcomes"] as const,
  list: (params: { page?: number } = {}) =>
    [...outcomeKeys.all, params] as const,
};

/** Global active outcomes — used for filters, not market detail (markets embed outcomes). */
export function useOutcomes(page = 1) {
  return useQuery<PaginatedResponse<MarketOutcome>>({
    queryKey: outcomeKeys.list({ page }),
    queryFn: () =>
      apiFetch<PaginatedResponse<MarketOutcome>>("/api/outcomes/", {
        params: { page },
      }),
    placeholderData: (prev) => prev,
  });
}

export function useCreateOutcome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: OutcomeWritePayload) =>
      apiFetch<MarketOutcome>("/api/outcomes/", {
        method: "post",
        data: payload,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: outcomeKeys.all });
      qc.invalidateQueries({ queryKey: ["market"] });
      qc.invalidateQueries({ queryKey: ["markets"] });
    },
  });
}

export function useUpdateOutcome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<OutcomeWritePayload> & { id: number }) =>
      apiFetch<MarketOutcome>(`/api/outcomes/${id}/`, {
        method: "patch",
        data: payload,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: outcomeKeys.all });
      qc.invalidateQueries({ queryKey: ["market"] });
      qc.invalidateQueries({ queryKey: ["markets"] });
    },
  });
}

export function useDeleteOutcome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/outcomes/${id}/`, { method: "delete" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: outcomeKeys.all });
      qc.invalidateQueries({ queryKey: ["market"] });
      qc.invalidateQueries({ queryKey: ["markets"] });
    },
  });
}

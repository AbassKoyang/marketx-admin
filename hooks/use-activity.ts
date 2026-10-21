import { useInfiniteQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { ActivityEvent, PaginatedResponse } from "@/lib/types";

export function useActivity(outcomeId?: number) {
  return useInfiniteQuery<PaginatedResponse<ActivityEvent>>({
    queryKey: ["activity", { outcomeId }],
    queryFn: ({ pageParam = 1 }) =>
      apiFetch<PaginatedResponse<ActivityEvent>>("/api/trading/activity/", {
        params: {
          page: pageParam,
          ...(outcomeId ? { outcome: outcomeId } : {}),
        },
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.next ? (lastPageParam as number) + 1 : undefined,
    refetchInterval: 20_000,
  });
}

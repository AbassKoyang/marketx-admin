import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { MarketCategory, PaginatedResponse } from "@/lib/types";

export const categoryKeys = {
  all: ["market-categories"] as const,
  list: (page?: number) => [...categoryKeys.all, { page }] as const,
  detail: (slug: string) => [...categoryKeys.all, slug] as const,
};

export function useCategories(page = 1) {
  return useQuery<PaginatedResponse<MarketCategory>>({
    queryKey: categoryKeys.list(page),
    queryFn: () =>
      apiFetch<PaginatedResponse<MarketCategory>>("/api/categories/", {
        params: { page },
      }),
    placeholderData: (prev) => prev,
  });
}

/** Flat list of all categories for dropdowns (fetches page 1, usually enough) */
export function useCategoriesList() {
  return useQuery<PaginatedResponse<MarketCategory>>({
    queryKey: categoryKeys.list(1),
    queryFn: () =>
      apiFetch<PaginatedResponse<MarketCategory>>("/api/categories/"),
    staleTime: 60_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<MarketCategory>) =>
      apiFetch<MarketCategory>("/api/categories/", {
        method: "post",
        data: payload,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useUpdateCategory(slug?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: Partial<MarketCategory> | { slug: string; data: Partial<MarketCategory> }) => {
      const targetSlug = "slug" in params && typeof params.slug === "string" ? params.slug : slug;
      const data = "data" in params ? params.data : params;
      return apiFetch<MarketCategory>(`/api/categories/${targetSlug}/`, {
        method: "patch",
        data,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all });
      qc.invalidateQueries({ queryKey: ["markets"] });
    },
  });
}

export function useDeleteCategory(slug?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetSlug?: string) =>
      apiFetch(`/api/categories/${targetSlug || slug}/`, { method: "delete" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  Position,
  PositionSummary,
  Wallet,
  WalletLedgerEntry,
  PaginatedResponse,
} from "@/lib/types";

export function usePositions(page = 1) {
  return useQuery<PaginatedResponse<Position>>({
    queryKey: ["positions", { page }],
    queryFn: () =>
      apiFetch<PaginatedResponse<Position>>("/api/trading/positions/", {
        params: { page },
      }),
    placeholderData: (prev) => prev,
  });
}

export function usePositionSummary() {
  return useQuery<PositionSummary>({
    queryKey: ["positions-summary"],
    queryFn: () =>
      apiFetch<PositionSummary>("/api/trading/positions/summary/"),
  });
}

export function useWallet() {
  return useQuery<Wallet>({
    queryKey: ["wallet"],
    queryFn: () => apiFetch<Wallet>("/api/wallet/"),
    staleTime: 15_000,
  });
}

export function useWalletLedger(page = 1) {
  return useQuery<PaginatedResponse<WalletLedgerEntry>>({
    queryKey: ["wallet-ledger", { page }],
    queryFn: () =>
      apiFetch<PaginatedResponse<WalletLedgerEntry>>("/api/wallet/ledger/", {
        params: { page },
      }),
    placeholderData: (prev) => prev,
  });
}

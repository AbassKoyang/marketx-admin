"use client";

import { useState } from "react";
import { Warning, Scales } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useResolveMarket } from "@/hooks/use-markets";
import { getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Market } from "@/lib/types";

export function ResolveMarketDialog({
  market,
  open,
  onOpenChange,
}: {
  market: Market;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useResolveMarket(market.slug);
  const [isVoid, setIsVoid] = useState(false);
  const [winningOutcome, setWinningOutcome] = useState("");
  const [evidenceSummary, setEvidenceSummary] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const activeOutcomes = market.outcomes.filter((outcome) => outcome.is_active);

  const canSubmit =
    evidenceSummary.trim().length > 0 &&
    (isVoid || winningOutcome !== "") &&
    confirmed &&
    !mutation.isPending;

  const reset = () => {
    setIsVoid(false);
    setWinningOutcome("");
    setEvidenceSummary("");
    setEvidenceUrl("");
    setConfirmed(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const submit = () => {
    mutation.mutate(
      {
        is_void: isVoid,
        ...(isVoid ? {} : { winning_outcome: Number(winningOutcome) }),
        evidence_summary: evidenceSummary.trim(),
        ...(evidenceUrl.trim() ? { evidence_url: evidenceUrl.trim() } : {}),
      },
      {
        onSuccess: () => {
          toast.success(
            isVoid ? "Market voided and settled" : "Market resolved and settled",
          );
          reset();
          onOpenChange(false);
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Resolve market</DialogTitle>
          <DialogDescription>
            Resolution is final and settles every position against the winning
            outcome. Capture the evidence that supports this decision.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2.5 border border-border bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
          <Warning size={15} className="mt-0.5 shrink-0 text-foreground" />
          <p>
            Resolving pays <span className="text-foreground">10,000 credits</span>{" "}
            per winning contract. Voiding refunds all open positions and cannot
            be undone.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={isVoid ? "outline" : "default"}
              size="sm"
              onClick={() => setIsVoid(false)}
              aria-pressed={!isVoid}
            >
              <Scales size={13} />
              Winning outcome
            </Button>
            <Button
              type="button"
              variant={isVoid ? "default" : "outline"}
              size="sm"
              onClick={() => setIsVoid(true)}
              aria-pressed={isVoid}
            >
              Void market
            </Button>
          </div>

          {!isVoid && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="winning-outcome">Winning outcome</Label>
              <Select
                value={winningOutcome || undefined}
                onValueChange={(value) => setWinningOutcome(String(value ?? ""))}
              >
                <SelectTrigger id="winning-outcome" className="w-full">
                  <SelectValue placeholder="Select the winning outcome" />
                </SelectTrigger>
                <SelectContent>
                  {activeOutcomes.map((outcome) => (
                    <SelectItem key={outcome.id} value={String(outcome.id)}>
                      {outcome.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="evidence-summary">Evidence summary</Label>
            <Textarea
              id="evidence-summary"
              value={evidenceSummary}
              onChange={(event) => setEvidenceSummary(event.target.value)}
              placeholder="Describe the verified result and where it was confirmed…"
              rows={4}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="evidence-url">
              Evidence URL{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="evidence-url"
              type="url"
              value={evidenceUrl}
              onChange={(event) => setEvidenceUrl(event.target.value)}
              placeholder="https://…"
            />
          </div>

          <Label className="items-start gap-2.5 text-[11px] leading-relaxed text-muted-foreground">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-0.5 size-3.5 accent-foreground"
            />
            <span>
              I confirm this result is final and supported by the evidence above.
            </span>
          </Label>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={submit}
            disabled={!canSubmit}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            {mutation.isPending
              ? "Settling…"
              : isVoid
                ? "Void and settle"
                : "Resolve and settle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

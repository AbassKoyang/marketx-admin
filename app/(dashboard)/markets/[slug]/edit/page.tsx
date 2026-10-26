"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, ImageSquare, Plus, Star } from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  useMarket,
  useUpdateMarket,
  useUploadMarketImage,
} from "@/hooks/use-markets";
import { useCreateOutcome, useUpdateOutcome } from "@/hooks/use-outcomes";
import { useCategoriesList } from "@/hooks/use-categories";
import { getApiErrorMessage } from "@/lib/api";
import { toSlug } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UploadImageDialog } from "@/components/markets/upload-image-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
import type { Market, MarketOutcome, MarketType } from "@/lib/types";

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type FormState = {
  title: string;
  question: string;
  market_type: MarketType;
  category_id: string;
  description: string;
  resolution_criteria: string;
  resolution_source_description: string;
  resolution_source_url: string;
  opens_at: string;
  closes_at: string;
  resolution_deadline: string;
  is_featured: boolean;
  liquidity_b: string;
};

function formFromMarket(market: Market): FormState {
  return {
    title: market.title,
    question: market.question,
    market_type: market.market_type,
    category_id: String(market.category?.id ?? ""),
    description: market.description,
    resolution_criteria: market.resolution_criteria,
    resolution_source_description: market.resolution_source_description,
    resolution_source_url: market.resolution_source_url,
    opens_at: toLocalInput(market.opens_at),
    closes_at: toLocalInput(market.closes_at),
    resolution_deadline: toLocalInput(market.resolution_deadline),
    is_featured: market.is_featured,
    liquidity_b: String(market.liquidity_b),
  };
}

function OutcomeRow({
  outcome,
  disabled,
  onSave,
  onToggleActive,
  saving,
}: {
  outcome: MarketOutcome;
  disabled: boolean;
  onSave: (id: number, name: string, description: string) => void;
  onToggleActive: (outcome: MarketOutcome) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(outcome.name);
  const [description, setDescription] = useState(outcome.description);

  const dirty = name !== outcome.name || description !== outcome.description;

  return (
    <div className="flex flex-col gap-2 border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] text-muted-foreground">
          {String(outcome.display_order).padStart(2, "0")} · {outcome.slug}
        </span>
        <div className="flex items-center gap-2">
          <Badge
            variant={outcome.is_active ? "outline" : "secondary"}
            className="text-[9px] uppercase tracking-wider"
          >
            {outcome.is_active ? "Active" : "Inactive"}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={disabled || saving}
            onClick={() => onToggleActive(outcome)}
          >
            {outcome.is_active ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </div>
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        disabled={disabled}
        aria-label={`Outcome ${outcome.slug} name`}
      />
      <Input
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        disabled={disabled}
        placeholder="Short description"
        aria-label={`Outcome ${outcome.slug} description`}
      />
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="xs"
          disabled={!dirty || disabled || saving || !name.trim()}
          onClick={() => onSave(outcome.id, name.trim(), description.trim())}
        >
          <Check size={11} />
          Save outcome
        </Button>
      </div>
    </div>
  );
}

function EditMarketForm({ market }: { market: Market }) {
  const slug = market.slug;
  const { data: categories } = useCategoriesList();
  const updateMarket = useUpdateMarket(slug);
  const updateOutcome = useUpdateOutcome();
  const createOutcome = useCreateOutcome();
  const uploadImage = useUploadMarketImage(slug);

  const [form, setForm] = useState<FormState>(() => formFromMarket(market));
  const [imageOpen, setImageOpen] = useState(false);
  const [newOutcome, setNewOutcome] = useState({ name: "", description: "" });
  // Issued markets must be unlocked explicitly before depth can be changed,
  // because every change reprices all outcomes immediately.
  const [depthUnlocked, setDepthUnlocked] = useState(false);

  const isDraft = market.status === "draft";
  const canEdit = isDraft || market.status === "open";
  const depthLocked = canEdit && market.issued_quantity > 0 && !depthUnlocked;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = () => {
    if (!form.title.trim() || !form.question.trim() || !form.category_id) {
      toast.error("Title, question, and category are required.");
      return;
    }

    const depth = Number(form.liquidity_b);
    if (!form.liquidity_b.trim() || !Number.isInteger(depth) || depth < 1) {
      toast.error("Liquidity depth must be a whole number of at least 1.");
      return;
    }

    updateMarket.mutate(
      {
        title: form.title.trim(),
        question: form.question.trim(),
        description: form.description.trim(),
        category_id: Number(form.category_id),
        resolution_criteria: form.resolution_criteria.trim(),
        resolution_source_description:
          form.resolution_source_description.trim(),
        resolution_source_url: form.resolution_source_url.trim(),
        opens_at: new Date(form.opens_at).toISOString(),
        closes_at: new Date(form.closes_at).toISOString(),
        resolution_deadline: new Date(form.resolution_deadline).toISOString(),
        is_featured: form.is_featured,
        liquidity_b: depth,
      },
      {
        onSuccess: () => {
          toast.success("Market updated");
          setDepthUnlocked(false);
        },
        onError: (mutationError) =>
          toast.error(getApiErrorMessage(mutationError)),
      },
    );
  };

  const addOutcome = () => {
    if (!newOutcome.name.trim()) {
      toast.error("Outcome name is required.");
      return;
    }
    createOutcome.mutate(
      {
        market: market.id,
        name: newOutcome.name.trim(),
        slug: toSlug(newOutcome.name),
        description: newOutcome.description.trim(),
        display_order: market.outcomes.length + 1,
        is_active: true,
      },
      {
        onSuccess: () => {
          toast.success("Outcome added");
          setNewOutcome({ name: "", description: "" });
        },
        onError: (mutationError) =>
          toast.error(getApiErrorMessage(mutationError)),
      },
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <Link
          href={`/markets/${slug}`}
          className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={12} />
          Back to market
        </Link>
      </div>

      <PageHeader
        title="Edit market"
        description={
          isDraft
            ? "Draft markets can be fully edited. Outcomes lock on publication."
            : canEdit
              ? "Live markets can update copy and schedule. Outcome identity is locked."
              : "This market is settled and can no longer be edited."
        }
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setImageOpen(true)}
          disabled={uploadImage.isPending}
        >
          <ImageSquare size={13} />
          Image
        </Button>
        <Button
          size="sm"
          onClick={save}
          disabled={!canEdit || updateMarket.isPending}
        >
          {updateMarket.isPending ? "Saving…" : "Save changes"}
        </Button>
      </PageHeader>

      {!canEdit && (
        <div className="border border-border bg-muted/40 p-3 text-[11px] text-muted-foreground">
          Resolved and void markets are read-only.
        </div>
      )}

      <fieldset disabled={!canEdit} className="flex flex-col gap-6">
        <section className="flex flex-col gap-4 border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-medium">Basics</h2>
              <p className="text-[11px] text-muted-foreground">
                Public identity and category.
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
              {market.status}
            </Badge>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="question">Question</Label>
            <Textarea
              id="question"
              value={form.question}
              onChange={(event) => update("question", event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Market type</Label>
              <div className="flex h-8 items-center border border-input px-2.5 text-xs text-muted-foreground">
                {form.market_type === "binary" ? "Binary" : "Multi outcome"}
                <span className="ms-auto text-[10px]">Read-only</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.category_id || undefined}
                onValueChange={(value) => update("category_id", String(value ?? ""))}
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.results.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              rows={3}
            />
          </div>
        </section>

        <section className="flex flex-col gap-4 border border-border bg-card p-5">
          <div>
            <h2 className="text-sm font-medium">Resolution</h2>
            <p className="text-[11px] text-muted-foreground">
              The criteria and evidence admin will settle against.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="criteria">Resolution criteria</Label>
            <Textarea
              id="criteria"
              value={form.resolution_criteria}
              onChange={(event) => update("resolution_criteria", event.target.value)}
              rows={4}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="source-description">Source description</Label>
            <Input
              id="source-description"
              value={form.resolution_source_description}
              onChange={(event) =>
                update("resolution_source_description", event.target.value)
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="source-url">Source URL</Label>
            <Input
              id="source-url"
              type="url"
              value={form.resolution_source_url}
              onChange={(event) =>
                update("resolution_source_url", event.target.value)
              }
            />
          </div>
        </section>

        <section className="flex flex-col gap-4 border border-border bg-card p-5">
          <div>
            <h2 className="text-sm font-medium">Schedule</h2>
            <p className="text-[11px] text-muted-foreground">
              Trading window and resolution deadline.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="opens-at">Opens at</Label>
              <Input
                id="opens-at"
                type="datetime-local"
                value={form.opens_at}
                onChange={(event) => update("opens_at", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="closes-at">Closes at</Label>
              <Input
                id="closes-at"
                type="datetime-local"
                value={form.closes_at}
                onChange={(event) => update("closes_at", event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="resolution-deadline">Resolution deadline</Label>
            <Input
              id="resolution-deadline"
              type="datetime-local"
              value={form.resolution_deadline}
              onChange={(event) =>
                update("resolution_deadline", event.target.value)
              }
            />
          </div>

          <Label className="items-center gap-2 text-[11px] text-muted-foreground">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(event) => update("is_featured", event.target.checked)}
              className="size-3.5 accent-foreground"
            />
            <span className="flex items-center gap-1.5">
              <Star size={12} weight="fill" />
              Featured market
            </span>
          </Label>
        </section>

        <section className="flex flex-col gap-4 border border-border bg-card p-5">
          <div>
            <h2 className="text-sm font-medium">Market maker</h2>
            <p className="text-[11px] text-muted-foreground">
              LMSR pricing depth and issuance. Issuance counters are read-only.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Issued sets</Label>
              <div className="flex h-8 items-center border border-input px-2.5 font-mono text-xs tabular-nums">
                {market.issued_quantity.toLocaleString()} /{" "}
                {market.issuance_limit.toLocaleString()}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Read-only. Each set is backed by 10,000 credits of collateral.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="liquidity-b">Liquidity depth (b)</Label>
              <Input
                id="liquidity-b"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={form.liquidity_b}
                onChange={(event) =>
                  update("liquidity_b", event.target.value)
                }
                disabled={depthLocked}
              />
              <p className="text-[10px] text-muted-foreground">
                Higher depth absorbs larger orders with less price movement, at
                a larger worst-case subsidy.
              </p>
            </div>
          </div>

          {market.issued_quantity > 0 && (
            <div className="flex flex-col gap-2 border border-border bg-muted/40 p-3">
              <p className="text-[11px] text-muted-foreground">
                This market has issued{" "}
                {market.issued_quantity.toLocaleString()} complete sets. Changing
                depth reprices every outcome immediately and moves all holder
                valuations.
              </p>
              <Label className="items-start gap-2 text-[11px]">
                <input
                  type="checkbox"
                  checked={depthUnlocked}
                  onChange={(event) => {
                    setDepthUnlocked(event.target.checked);
                    if (!event.target.checked) {
                      update("liquidity_b", String(market.liquidity_b));
                    }
                  }}
                  className="mt-0.5 size-3.5 accent-foreground"
                  disabled={!canEdit}
                />
                I understand the repricing impact — unlock depth editing
              </Label>
            </div>
          )}
        </section>
      </fieldset>

      <section className="flex flex-col gap-4 border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-medium">Outcomes</h2>
            <p className="text-[11px] text-muted-foreground">
              {isDraft
                ? "Add, rename, or deactivate outcomes before publishing."
                : "Outcome identity is locked after publication."}
            </p>
          </div>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
            {market.outcomes.length}
          </Badge>
        </div>

        <div className="flex flex-col gap-3">
          {market.outcomes.map((outcome) => (
            <OutcomeRow
              key={`${outcome.id}-${outcome.name}-${outcome.description}`}
              outcome={outcome}
              disabled={!isDraft}
              saving={updateOutcome.isPending}
              onSave={(id, name, description) =>
                updateOutcome.mutate(
                  { id, name, description },
                  {
                    onSuccess: () => toast.success("Outcome updated"),
                    onError: (mutationError) =>
                      toast.error(getApiErrorMessage(mutationError)),
                  },
                )
              }
              onToggleActive={(target) =>
                updateOutcome.mutate(
                  { id: target.id, is_active: !target.is_active },
                  {
                    onSuccess: () =>
                      toast.success(
                        target.is_active
                          ? "Outcome deactivated"
                          : "Outcome activated",
                      ),
                    onError: (mutationError) =>
                      toast.error(getApiErrorMessage(mutationError)),
                  },
                )
              }
            />
          ))}
        </div>

        {isDraft && (
          <>
            <Separator />
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Add outcome
              </span>
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <Input
                  value={newOutcome.name}
                  onChange={(event) =>
                    setNewOutcome((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Outcome name"
                  aria-label="New outcome name"
                />
                <Input
                  value={newOutcome.description}
                  onChange={(event) =>
                    setNewOutcome((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Short description (optional)"
                  aria-label="New outcome description"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOutcome}
                  disabled={createOutcome.isPending}
                >
                  <Plus size={13} />
                  Add
                </Button>
              </div>
              {market.market_type === "binary" && market.outcomes.length >= 2 && (
                <p className="text-[10px] text-muted-foreground">
                  Binary markets are expected to have exactly two outcomes.
                </p>
              )}
            </div>
          </>
        )}
      </section>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/markets/${slug}`} />}
        >
          Cancel
        </Button>
        <Button size="sm" onClick={save} disabled={!canEdit || updateMarket.isPending}>
          {updateMarket.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <UploadImageDialog market={market} open={imageOpen} onOpenChange={setImageOpen} />
    </div>
  );
}

export default function EditMarketPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { data: market, isLoading, error } = useMarket(slug);

  if (isLoading || (!market && !error)) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !market) {
    return (
      <EmptyState
        icon={ImageSquare}
        title="Market not found"
        description="This market may have been removed, or the link is incorrect."
      >
        <Button variant="outline" size="sm" render={<Link href="/markets" />}>
          <ArrowLeft size={13} />
          Back to markets
        </Button>
      </EmptyState>
    );
  }

  return <EditMarketForm key={market.id} market={market} />;
}

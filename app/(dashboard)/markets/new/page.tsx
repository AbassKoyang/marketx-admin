"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Star,
  Trash,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useCategoriesList } from "@/hooks/use-categories";
import { useCreateMarket } from "@/hooks/use-markets";
import { useCreateOutcome } from "@/hooks/use-outcomes";
import { getApiErrorMessage } from "@/lib/api";
import { cn, formatDate, toSlug } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MarketType } from "@/lib/types";

const STEPS = [
  { id: 1, label: "Basics" },
  { id: 2, label: "Resolution" },
  { id: 3, label: "Schedule" },
  { id: 4, label: "Outcomes" },
  { id: 5, label: "Review" },
] as const;

type OutcomeDraft = { name: string; description: string };

type Draft = {
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
  outcomes: OutcomeDraft[];
};

function localDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function initialDraft(): Draft {
  const now = new Date();
  const closes = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const deadline = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  return {
    title: "",
    question: "",
    market_type: "binary",
    category_id: "",
    description: "",
    resolution_criteria: "",
    resolution_source_description: "",
    resolution_source_url: "",
    opens_at: localDateTime(now),
    closes_at: localDateTime(closes),
    resolution_deadline: localDateTime(deadline),
    is_featured: false,
    outcomes: [
      { name: "Yes", description: "" },
      { name: "No", description: "" },
    ],
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[10px] text-destructive">{message}</p>;
}

export default function NewMarketPage() {
  const router = useRouter();
  const { data: categories, isLoading: loadingCategories } = useCategoriesList();
  const createMarket = useCreateMarket();
  const createOutcome = useCreateOutcome();

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateOutcome = (index: number, patch: Partial<OutcomeDraft>) => {
    setDraft((prev) => ({
      ...prev,
      outcomes: prev.outcomes.map((outcome, outcomeIndex) =>
        outcomeIndex === index ? { ...outcome, ...patch } : outcome,
      ),
    }));
    setErrors((prev) => {
      if (!prev.outcomes) return prev;
      const next = { ...prev };
      delete next.outcomes;
      return next;
    });
  };

  const setType = (type: MarketType) => {
    setDraft((prev) => ({
      ...prev,
      market_type: type,
      outcomes:
        type === "binary" && prev.outcomes.length !== 2
          ? [
              { name: "Yes", description: "" },
              { name: "No", description: "" },
            ]
          : prev.outcomes,
    }));
  };

  const validateStep = (target: number) => {
    const next: Record<string, string> = {};

    if (target === 1) {
      if (!draft.title.trim()) next.title = "A market title is required.";
      if (!draft.question.trim()) next.question = "A question is required.";
      if (!draft.category_id) next.category_id = "Choose a category.";
    }

    if (target === 2) {
      if (!draft.resolution_criteria.trim()) {
        next.resolution_criteria = "Describe how the market resolves.";
      }
    }

    if (target === 3) {
      if (!draft.opens_at) next.opens_at = "Set an opening time.";
      if (!draft.closes_at) next.closes_at = "Set a closing time.";
      if (!draft.resolution_deadline) {
        next.resolution_deadline = "Set a resolution deadline.";
      }
      if (draft.opens_at && draft.closes_at) {
        if (new Date(draft.closes_at) <= new Date(draft.opens_at)) {
          next.closes_at = "Closing time must be after opening time.";
        }
      }
      if (draft.closes_at && draft.resolution_deadline) {
        if (new Date(draft.resolution_deadline) < new Date(draft.closes_at)) {
          next.resolution_deadline =
            "Resolution deadline must be on or after the closing time.";
        }
      }
    }

    if (target === 4) {
      const named = draft.outcomes.filter((outcome) => outcome.name.trim());
      if (named.length < 2) {
        next.outcomes = "Add at least two named outcomes.";
      }
      const slugs = named.map((outcome) => toSlug(outcome.name));
      if (new Set(slugs).size !== slugs.length) {
        next.outcomes = "Outcome names must be unique.";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((prev) => Math.min(prev + 1, STEPS.length));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    for (const target of [1, 2, 3, 4]) {
      if (!validateStep(target)) {
        setStep(target);
        return;
      }
    }

    setSubmitting(true);
    let createdSlug: string | null = null;

    try {
      const market = await createMarket.mutateAsync({
        title: draft.title.trim(),
        question: draft.question.trim(),
        market_type: draft.market_type,
        description: draft.description.trim(),
        category_id: Number(draft.category_id),
        resolution_criteria: draft.resolution_criteria.trim(),
        resolution_source_description:
          draft.resolution_source_description.trim(),
        resolution_source_url: draft.resolution_source_url.trim(),
        opens_at: new Date(draft.opens_at).toISOString(),
        closes_at: new Date(draft.closes_at).toISOString(),
        resolution_deadline: new Date(draft.resolution_deadline).toISOString(),
        is_featured: draft.is_featured,
      });

      createdSlug = market.slug;

      for (const [index, outcome] of draft.outcomes.entries()) {
        await createOutcome.mutateAsync({
          market: market.id,
          name: outcome.name.trim(),
          slug: toSlug(outcome.name),
          description: outcome.description.trim(),
          display_order: index + 1,
          is_active: true,
        });
      }

      toast.success("Market created as a draft");
      router.push(`/markets/${market.slug}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      if (createdSlug) router.push(`/markets/${createdSlug}`);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategory = useMemo(
    () => categories?.results.find((c) => String(c.id) === draft.category_id),
    [categories, draft.category_id],
  );

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader
        title="Create market"
        description="Draft a market, define its outcomes, and publish when it is ready for trading."
      >
        <Button variant="ghost" size="sm" render={<Link href="/markets" />}>
          <ArrowLeft size={13} />
          Cancel
        </Button>
      </PageHeader>

      {/* Step indicator */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-1">
          {STEPS.map((item) => {
            const complete = step > item.id;
            const active = step === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id < step) setStep(item.id);
                }}
                disabled={item.id > step}
                className={cn(
                  "flex items-center gap-1.5 text-[10px] uppercase tracking-wider transition-colors",
                  active
                    ? "text-foreground"
                    : complete
                      ? "text-muted-foreground hover:text-foreground"
                      : "text-muted-foreground/40",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center border text-[9px] tabular-nums",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border",
                  )}
                >
                  {complete ? <Check size={10} weight="bold" /> : item.id}
                </span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>
        <div className="h-px w-full bg-border">
          <motion.div
            className="h-px bg-foreground"
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", duration: 0.4, bounce: 0 }}
          />
        </div>
      </div>

      <div className="border border-border bg-card">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ type: "spring", duration: 0.25, bounce: 0 }}
            className="flex flex-col gap-5 p-5"
          >
            {step === 1 && (
              <>
                <div className="flex flex-col gap-1">
                  <h2 className="text-sm font-medium">Market basics</h2>
                  <p className="text-[11px] text-muted-foreground">
                    The public identity of this market. Titles are immutable after
                    publication.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={draft.title}
                    onChange={(event) => update("title", event.target.value)}
                    placeholder="BUK Faculty Cup winner"
                    aria-invalid={!!errors.title}
                  />
                  <FieldError message={errors.title} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="question">Question</Label>
                  <Textarea
                    id="question"
                    value={draft.question}
                    onChange={(event) => update("question", event.target.value)}
                    placeholder="Which faculty will win the BUK Faculty Cup?"
                    aria-invalid={!!errors.question}
                  />
                  <FieldError message={errors.question} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label>Market type</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={draft.market_type === "binary" ? "default" : "outline"}
                        onClick={() => setType("binary")}
                        aria-pressed={draft.market_type === "binary"}
                      >
                        Binary
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          draft.market_type === "multi_outcome" ? "default" : "outline"
                        }
                        onClick={() => setType("multi_outcome")}
                        aria-pressed={draft.market_type === "multi_outcome"}
                      >
                        Multi outcome
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={draft.category_id || undefined}
                      onValueChange={(value) =>
                        update("category_id", String(value ?? ""))
                      }
                    >
                      <SelectTrigger
                        id="category"
                        className="w-full"
                        aria-invalid={!!errors.category_id}
                      >
                        <SelectValue
                          placeholder={
                            loadingCategories ? "Loading…" : "Choose a category"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.results.map((category) => (
                          <SelectItem key={category.id} value={String(category.id)}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError message={errors.category_id} />
                    {!loadingCategories && categories?.results.length === 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        No categories yet.{" "}
                        <Link href="/categories" className="underline underline-offset-2">
                          Create one first
                        </Link>
                        .
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="description">
                    Description{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={draft.description}
                    onChange={(event) => update("description", event.target.value)}
                    placeholder="Context for traders…"
                    rows={3}
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="flex flex-col gap-1">
                  <h2 className="text-sm font-medium">Resolution</h2>
                  <p className="text-[11px] text-muted-foreground">
                    Make the settlement rule unambiguous. Admins will resolve
                    against this text and evidence.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="criteria">Resolution criteria</Label>
                  <Textarea
                    id="criteria"
                    value={draft.resolution_criteria}
                    onChange={(event) =>
                      update("resolution_criteria", event.target.value)
                    }
                    placeholder="The winning faculty announced by the BUK sports directorate is the winning outcome."
                    rows={4}
                    aria-invalid={!!errors.resolution_criteria}
                  />
                  <FieldError message={errors.resolution_criteria} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="source-description">Source description</Label>
                  <Input
                    id="source-description"
                    value={draft.resolution_source_description}
                    onChange={(event) =>
                      update("resolution_source_description", event.target.value)
                    }
                    placeholder="BUK Sports Directorate official announcement"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="source-url">
                    Source URL <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="source-url"
                    type="url"
                    value={draft.resolution_source_url}
                    onChange={(event) =>
                      update("resolution_source_url", event.target.value)
                    }
                    placeholder="https://…"
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="flex flex-col gap-1">
                  <h2 className="text-sm font-medium">Schedule</h2>
                  <p className="text-[11px] text-muted-foreground">
                    Trading runs between the opening and closing times. Resolution
                    must happen before the deadline.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="opens-at">Opens at</Label>
                    <Input
                      id="opens-at"
                      type="datetime-local"
                      value={draft.opens_at}
                      onChange={(event) => update("opens_at", event.target.value)}
                      aria-invalid={!!errors.opens_at}
                    />
                    <FieldError message={errors.opens_at} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="closes-at">Closes at</Label>
                    <Input
                      id="closes-at"
                      type="datetime-local"
                      value={draft.closes_at}
                      onChange={(event) => update("closes_at", event.target.value)}
                      aria-invalid={!!errors.closes_at}
                    />
                    <FieldError message={errors.closes_at} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="resolution-deadline">Resolution deadline</Label>
                  <Input
                    id="resolution-deadline"
                    type="datetime-local"
                    value={draft.resolution_deadline}
                    onChange={(event) =>
                      update("resolution_deadline", event.target.value)
                    }
                    aria-invalid={!!errors.resolution_deadline}
                  />
                  <FieldError message={errors.resolution_deadline} />
                </div>

                <Label className="items-start gap-2.5 text-[11px] leading-relaxed text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={draft.is_featured}
                    onChange={(event) =>
                      update("is_featured", event.target.checked)
                    }
                    className="mt-0.5 size-3.5 accent-foreground"
                  />
                  <span className="flex items-center gap-1.5">
                    <Star size={12} weight="fill" />
                    Feature this market on the platform
                  </span>
                </Label>
              </>
            )}

            {step === 4 && (
              <>
                <div className="flex flex-col gap-1">
                  <h2 className="text-sm font-medium">Outcomes</h2>
                  <p className="text-[11px] text-muted-foreground">
                    Every outcome must be distinct. A winning contract pays 10,000
                    credits at settlement.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {draft.outcomes.map((outcome, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-2 border border-border p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {draft.market_type === "multi_outcome" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() =>
                              update(
                                "outcomes",
                                draft.outcomes.filter((_, i) => i !== index),
                              )
                            }
                            disabled={draft.outcomes.length <= 2}
                            aria-label={`Remove outcome ${index + 1}`}
                          >
                            <Trash size={12} />
                          </Button>
                        )}
                      </div>
                      <Input
                        value={outcome.name}
                        onChange={(event) =>
                          updateOutcome(index, { name: event.target.value })
                        }
                        placeholder="Outcome name"
                        aria-label={`Outcome ${index + 1} name`}
                      />
                      <Input
                        value={outcome.description}
                        onChange={(event) =>
                          updateOutcome(index, { description: event.target.value })
                        }
                        placeholder="Short description (optional)"
                        aria-label={`Outcome ${index + 1} description`}
                      />
                    </div>
                  ))}
                </div>

                {draft.market_type === "multi_outcome" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() =>
                      update("outcomes", [
                        ...draft.outcomes,
                        { name: "", description: "" },
                      ])
                    }
                  >
                    <Plus size={13} />
                    Add outcome
                  </Button>
                )}

                <FieldError message={errors.outcomes} />
              </>
            )}

            {step === 5 && (
              <>
                <div className="flex flex-col gap-1">
                  <h2 className="text-sm font-medium">Review</h2>
                  <p className="text-[11px] text-muted-foreground">
                    The market is created as a draft. Publish it from the detail
                    page when outcomes and schedule look correct.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                      {draft.market_type === "binary" ? "Binary" : "Multi outcome"}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                      Draft
                    </Badge>
                    {draft.is_featured && (
                      <Badge variant="secondary" className="gap-1 text-[10px] uppercase tracking-wider">
                        <Star size={10} weight="fill" />
                        Featured
                      </Badge>
                    )}
                    {selectedCategory && (
                      <span className="text-[11px] text-muted-foreground">
                        {selectedCategory.name}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{draft.title || "Untitled"}</span>
                    <span className="text-xs text-muted-foreground">
                      {draft.question}
                    </span>
                  </div>

                  <Separator />

                  <dl className="grid gap-3 text-[11px] sm:grid-cols-2">
                    <div className="flex flex-col gap-0.5">
                      <dt className="uppercase tracking-wider text-muted-foreground">
                        Opens
                      </dt>
                      <dd className="tabular-nums">{formatDate(draft.opens_at)}</dd>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <dt className="uppercase tracking-wider text-muted-foreground">
                        Closes
                      </dt>
                      <dd className="tabular-nums">{formatDate(draft.closes_at)}</dd>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <dt className="uppercase tracking-wider text-muted-foreground">
                        Resolve by
                      </dt>
                      <dd className="tabular-nums">
                        {formatDate(draft.resolution_deadline)}
                      </dd>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <dt className="uppercase tracking-wider text-muted-foreground">
                        Outcomes
                      </dt>
                      <dd>{draft.outcomes.length}</dd>
                    </div>
                  </dl>

                  <Separator />

                  <div className="flex flex-col gap-1">
                    <span className="uppercase tracking-wider text-muted-foreground text-[10px]">
                      Outcomes
                    </span>
                    <ul className="flex flex-col divide-y divide-border/60">
                      {draft.outcomes.map((outcome, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between gap-3 py-2"
                        >
                          <span className="text-xs font-medium">{outcome.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {outcome.description || "—"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between gap-2 border-t border-border p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            disabled={step === 1 || submitting}
          >
            <ArrowLeft size={13} />
            Back
          </Button>

          {step < STEPS.length ? (
            <Button size="sm" onClick={goNext}>
              Continue
              <ArrowRight size={13} />
            </Button>
          ) : (
            <Button size="sm" onClick={submit} disabled={submitting}>
              {submitting ? "Creating…" : "Create market"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

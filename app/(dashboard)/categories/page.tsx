"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PencilSimple, Plus, Tag, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/hooks/use-categories";
import { getApiErrorMessage } from "@/lib/api";
import { cn, toSlug } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MarketCategory } from "@/lib/types";

type CategoryDraft = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  display_order: string;
  is_active: boolean;
};

const EMPTY_DRAFT: CategoryDraft = {
  name: "",
  slug: "",
  description: "",
  icon: "",
  display_order: "0",
  is_active: true,
};

function CategorySheet({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: MarketCategory | null;
}) {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const [draft, setDraft] = useState<CategoryDraft>(() =>
    editing
      ? {
          name: editing.name,
          slug: editing.slug,
          description: editing.description,
          icon: editing.icon,
          display_order: String(editing.display_order),
          is_active: editing.is_active,
        }
      : EMPTY_DRAFT,
  );
  const [slugTouched, setSlugTouched] = useState(!!editing);

  const load = (category: MarketCategory | null) => {
    setDraft(
      category
        ? {
            name: category.name,
            slug: category.slug,
            description: category.description,
            icon: category.icon,
            display_order: String(category.display_order),
            is_active: category.is_active,
          }
        : EMPTY_DRAFT,
    );
    setSlugTouched(!!category);
  };

  const pending = createCategory.isPending || updateCategory.isPending;

  const submit = () => {
    if (!draft.name.trim()) {
      toast.error("Category name is required.");
      return;
    }
    const slug = draft.slug.trim() || toSlug(draft.name);
    const payload = {
      name: draft.name.trim(),
      slug,
      description: draft.description.trim(),
      icon: draft.icon.trim(),
      display_order: Number(draft.display_order) || 0,
      is_active: draft.is_active,
    };

    const onSuccess = () => {
      toast.success(editing ? "Category updated" : "Category created");
      onOpenChange(false);
      load(null);
    };
    const onError = (error: unknown) => toast.error(getApiErrorMessage(error));

    if (editing) {
      updateCategory.mutate(
        { slug: editing.slug, data: payload },
        { onSuccess, onError },
      );
    } else {
      createCategory.mutate(payload, { onSuccess, onError });
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) load(null);
        onOpenChange(next);
      }}
    >
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{editing ? "Edit category" : "New category"}</SheetTitle>
          <SheetDescription>
            Categories group markets in discovery and admin filters.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={draft.name}
              onChange={(event) => {
                const name = event.target.value;
                setDraft((prev) => ({
                  ...prev,
                  name,
                  slug: slugTouched ? prev.slug : toSlug(name),
                }));
              }}
              placeholder="Campus Sports"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={draft.slug}
              onChange={(event) => {
                setSlugTouched(true);
                setDraft((prev) => ({ ...prev, slug: event.target.value }));
              }}
              placeholder="campus-sports"
              className="font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={draft.description}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, description: event.target.value }))
              }
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="icon">Icon</Label>
              <Input
                id="icon"
                value={draft.icon}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, icon: event.target.value }))
                }
                placeholder="trophy"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="display-order">Display order</Label>
              <Input
                id="display-order"
                type="number"
                value={draft.display_order}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    display_order: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <Label className="items-center gap-2 text-[11px] text-muted-foreground">
            <input
              type="checkbox"
              checked={draft.is_active}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, is_active: event.target.checked }))
              }
              className="size-3.5 accent-foreground"
            />
            Active and visible to traders
          </Label>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={pending}>
            {pending ? "Saving…" : editing ? "Save category" : "Create category"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default function CategoriesPage() {
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<MarketCategory | null>(null);
  const [deleting, setDeleting] = useState<MarketCategory | null>(null);

  const { data, isLoading } = useCategories(page);
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const categories = data?.results ?? [];

  const openCreate = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const openEdit = (category: MarketCategory) => {
    setEditing(category);
    setSheetOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Categories"
        description="Group markets for discovery, filtering, and reporting."
      >
        <Button size="sm" onClick={openCreate}>
          <Plus size={14} />
          New category
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="border border-border bg-card">
          <TableSkeleton rows={6} cols={4} />
        </div>
      ) : categories.length === 0 ? (
        <div className="border border-border bg-card">
          <EmptyState
            icon={Tag}
            title="No categories yet"
            description="Create a category before drafting markets so they can be grouped."
          >
            <Button size="sm" onClick={openCreate}>
              <Plus size={14} />
              New category
            </Button>
          </EmptyState>
        </div>
      ) : (
        <div className="border border-border bg-card">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-4">Category</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead className="text-end">Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 pe-4 text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category, index) => (
                  <motion.tr
                    key={category.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      duration: 0.3,
                      bounce: 0,
                      delay: Math.min(index * 0.025, 0.2),
                    }}
                    className="border-b transition-colors hover:bg-muted/40"
                  >
                    <TableCell className="ps-4 whitespace-normal">
                      <p className="font-medium">{category.name}</p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                        {category.description || "No description"}
                      </p>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {category.slug}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {category.icon || "—"}
                    </TableCell>
                    <TableCell className="text-end font-mono text-[11px] tabular-nums">
                      {category.display_order}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={category.is_active ? "outline" : "secondary"}
                        className="text-[10px] uppercase tracking-wider"
                      >
                        {category.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="pe-4">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => openEdit(category)}
                          aria-label={`Edit ${category.name}`}
                        >
                          <PencilSimple size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() =>
                            updateCategory.mutate(
                              {
                                slug: category.slug,
                                data: { is_active: !category.is_active },
                              },
                              {
                                onSuccess: () =>
                                  toast.success(
                                    category.is_active
                                      ? "Category deactivated"
                                      : "Category activated",
                                  ),
                                onError: (error) =>
                                  toast.error(getApiErrorMessage(error)),
                              },
                            )
                          }
                          disabled={updateCategory.isPending}
                          aria-label={
                            category.is_active
                              ? `Deactivate ${category.name}`
                              : `Activate ${category.name}`
                          }
                        >
                          <span
                            className={cn(
                              "text-[10px]",
                              category.is_active
                                ? "text-muted-foreground"
                                : "text-foreground",
                            )}
                          >
                            {category.is_active ? "Off" : "On"}
                          </span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeleting(category)}
                          aria-label={`Delete ${category.name}`}
                        >
                          <Trash size={13} />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="divide-y divide-border md:hidden">
            {categories.map((category) => (
              <li key={category.id} className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{category.name}</p>
                    <Badge
                      variant={category.is_active ? "outline" : "secondary"}
                      className="text-[9px] uppercase tracking-wider"
                    >
                      {category.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    {category.slug} · order {category.display_order}
                  </p>
                  {category.description && (
                    <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => openEdit(category)}
                    aria-label={`Edit ${category.name}`}
                  >
                    <PencilSimple size={13} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setDeleting(category)}
                    aria-label={`Delete ${category.name}`}
                  >
                    <Trash size={13} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          <Pagination
            page={page}
            count={data?.count ?? 0}
            onPageChange={setPage}
          />
        </div>
      )}

      <CategorySheet
        key={editing?.id ?? "new"}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editing={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={`Delete ${deleting?.name ?? "category"}?`}
        description="Deleting is permanent. Categories referenced by markets cannot be removed — deactivate them instead."
        confirmLabel="Delete category"
        destructive
        loading={deleteCategory.isPending}
        onConfirm={() => {
          if (!deleting) return;
          deleteCategory.mutate(deleting.slug, {
            onSuccess: () => {
              toast.success("Category deleted");
              setDeleting(null);
            },
            onError: (error) => toast.error(getApiErrorMessage(error)),
          });
        }}
      />
    </div>
  );
}

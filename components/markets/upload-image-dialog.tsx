"use client";

import { useEffect, useRef, useState } from "react";
import { ImageSquare, UploadSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useUploadMarketImage } from "@/hooks/use-markets";
import { getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Market } from "@/lib/types";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export function UploadImageDialog({
  market,
  open,
  onOpenChange,
}: {
  market: Market;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useUploadMarketImage(market.slug);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = (nextFile: File | null) => {
    if (!nextFile) return;
    if (!ACCEPTED.includes(nextFile.type)) {
      toast.error("Choose a JPEG, PNG, or WEBP image.");
      return;
    }
    if (nextFile.size > MAX_BYTES) {
      toast.error("Image must be 5 MB or smaller.");
      return;
    }
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const submit = () => {
    if (!file) return;
    mutation.mutate(file, {
      onSuccess: () => {
        toast.success("Market image updated");
        reset();
        onOpenChange(false);
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Market image</DialogTitle>
          <DialogDescription>
            JPEG, PNG, or WEBP up to 5 MB. Images are stored on Cloudinary.
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden border border-border bg-muted/40">
          {preview ?? market.image_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview ?? market.image_url}
                alt="Market image preview"
                className="size-full object-cover"
              />
            </>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
              <ImageSquare size={26} />
              <span className="text-[11px]">No image yet</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="market-image">Choose image</Label>
          <input
            ref={inputRef}
            id="market-image"
            type="file"
            accept={ACCEPTED.join(",")}
            onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
            className="block w-full cursor-pointer text-xs text-muted-foreground file:me-3 file:cursor-pointer file:border-0 file:bg-muted file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-foreground"
          />
          {file && (
            <p className="text-[10px] text-muted-foreground">
              {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
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
            disabled={!file || mutation.isPending}
          >
            <UploadSimple size={13} />
            {mutation.isPending ? "Uploading…" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

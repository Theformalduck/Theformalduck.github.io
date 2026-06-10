"use client";

import { useRef, useState } from "react";
import { Plus, X, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  className?: string;
}

/**
 * Upload and manage a gallery of images. Reuses the same /api/upload endpoint
 * as MediaUpload, but supports multiple files and a thumbnail grid with remove.
 * The first image acts as the lead gallery image.
 */
export function MultiImageUpload({ value, onChange, max = 8, className }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const remaining = Math.max(0, max - value.length);

  const uploadFiles = async (files: FileList) => {
    const list = Array.from(files).slice(0, remaining);
    if (list.length === 0) return;
    setUploading(true);
    setError(null);
    const added: string[] = [];
    try {
      for (const file of list) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        added.push(data.url);
      }
      onChange([...value, ...added]);
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
      if (added.length) onChange([...value, ...added]); // keep whatever succeeded
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (i: number) => onChange(value.filter((_, j) => j !== i));

  return (
    <div className={className}>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        {value.map((url, i) => (
          <div key={`${url}-${i}`} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
              aria-label="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            {i === 0 && (
              <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/55 text-white text-[9px] font-medium">Lead</span>
            )}
          </div>
        ))}

        {remaining > 0 && (
          <button
            type="button"
            onClick={() => !uploading && inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all",
              uploading ? "opacity-60 pointer-events-none border-gray-200 bg-gray-50" : "border-gray-200 bg-gray-50 hover:border-[#2e9cfe] hover:bg-sky-50 text-gray-400 hover:text-[#2e9cfe]"
            )}
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            <span className="text-[10px] font-medium">{uploading ? "Uploading…" : "Add image"}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <p className="text-gray-400 text-[11px] mt-2">{value.length}/{max} images · PNG, JPG, GIF, WebP up to 10 MB each</p>
      {error && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
          <p className="text-red-500 text-[11px]">{error}</p>
        </div>
      )}
    </div>
  );
}

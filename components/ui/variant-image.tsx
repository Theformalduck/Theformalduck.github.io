"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";

/**
 * Compact 36px image picker for a single product variant. Uploads via the same
 * /api/upload endpoint as MediaUpload and reports the resulting URL.
 */
export function VariantImage({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) onChange(data.url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        title={value ? "Change variant image" : "Add variant image"}
        className="w-9 h-9 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden hover:border-[#2e9cfe] transition-colors"
      >
        {uploading ? (
          <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
        ) : value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImagePlus className="w-3.5 h-3.5 text-gray-400" />
        )}
      </button>
      {value && !uploading && (
        <button
          type="button"
          onClick={() => onChange("")}
          title="Remove image"
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-red-500"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
      />
    </div>
  );
}

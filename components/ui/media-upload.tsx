"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Video, Loader2, AlertCircle, Play, PlayCircle, FileText } from "lucide-react";
import { cn, youtubeVideoId } from "@/lib/utils";

interface MediaUploadProps {
  value?: string;
  onChange: (url: string) => void;
  accept?: "image" | "video" | "both" | "any";
  className?: string;
  compact?: boolean;
  label?: string;
  allowYoutube?: boolean;
  placeholder?: string;
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(url);
}

function YoutubeThumbnail({ videoId, className }: { videoId: string; className?: string }) {
  return (
    <div className={cn("relative bg-black", className)}>
      <img
        src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
        alt="YouTube video"
        className="w-full h-full object-cover opacity-80"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
        </div>
      </div>
    </div>
  );
}

export function MediaUpload({
  value,
  onChange,
  accept = "both",
  className,
  compact = false,
  label,
  allowYoutube = true,
  placeholder,
}: MediaUploadProps) {
  const [mode, setMode] = useState<"upload" | "youtube">("upload");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ytDraft, setYtDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptAttr =
    accept === "image" ? "image/*" :
    accept === "video" ? "video/*" :
    accept === "any"   ? "*"       :
    "image/*,video/*";

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onChange(data.url);
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const confirmYoutube = () => {
    const id = youtubeVideoId(ytDraft.trim());
    if (!id) {
      setError("Paste a valid YouTube URL (youtube.com/watch?v=… or youtu.be/…)");
      return;
    }
    setError(null);
    setYtDraft("");
    onChange(ytDraft.trim());
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  };

  // ── Render existing value ──────────────────────────────────────────────────
  if (value) {
    const ytId = youtubeVideoId(value);
    const isImage = !ytId && !isVideoUrl(value) && accept !== "any" && /\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(value);
    const isFile = !ytId && !isVideoUrl(value) && !isImage;
    const fileName = isFile ? decodeURIComponent(value.split("/").pop()?.split("?")[0] ?? "File") : "";

    return (
      <div className={className}>
        {label && <label className="block text-gray-600 text-xs font-medium mb-1.5">{label}</label>}
        {isFile ? (
          <div className={cn("relative flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 group px-4", compact ? "py-3" : "py-4")}>
            <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-gray-400" />
            </div>
            <span className="flex-1 text-xs text-gray-700 truncate">{fileName}</span>
            <button
              type="button"
              onClick={() => onChange("")}
              className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className={cn("relative rounded-xl overflow-hidden group bg-gray-100", compact ? "h-28" : "max-h-52")}>
            {ytId ? (
              <YoutubeThumbnail videoId={ytId} className="w-full h-full" />
            ) : isVideoUrl(value) ? (
              <video src={value} className="w-full h-full object-cover" controls preload="metadata" />
            ) : (
              <img src={value} alt="" className="w-full h-full object-cover" />
            )}
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Empty state (upload or YouTube) ───────────────────────────────────────
  const canYoutube = allowYoutube && (accept === "video" || accept === "both");

  return (
    <div className={className}>
      {label && <label className="block text-gray-600 text-xs font-medium mb-1.5">{label}</label>}

      {/* Mode tabs */}
      {canYoutube && (
        <div className="flex gap-0.5 mb-2 p-0.5 bg-gray-100 rounded-lg w-fit">
          <button
            type="button"
            onClick={() => { setMode("upload"); setError(null); }}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
              mode === "upload" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Upload className="w-3 h-3" />
            Upload
          </button>
          <button
            type="button"
            onClick={() => { setMode("youtube"); setError(null); }}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
              mode === "youtube" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <PlayCircle className="w-3 h-3 text-red-500" />
            YouTube
          </button>
        </div>
      )}

      {/* Upload mode */}
      {mode === "upload" && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all",
            compact ? "py-4 gap-1.5" : "py-8 gap-2.5",
            uploading && "pointer-events-none opacity-60",
            dragOver ? "border-[#2e9cfe] bg-sky-50" : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
          )}
        >
          <input ref={inputRef} type="file" accept={acceptAttr} onChange={handleChange} className="hidden" />
          {uploading ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : (
            <>
              <div className={cn("rounded-xl flex items-center justify-center gap-1.5", compact ? "w-8 h-8 bg-gray-100" : "w-10 h-10 bg-white shadow-sm border border-gray-200")}>
                {accept === "image" && <ImageIcon className={cn("text-gray-400", compact ? "w-4 h-4" : "w-5 h-5")} />}
                {accept === "video" && <Video      className={cn("text-gray-400", compact ? "w-4 h-4" : "w-5 h-5")} />}
                {accept === "any"   && <FileText   className={cn("text-gray-400", compact ? "w-4 h-4" : "w-5 h-5")} />}
                {accept === "both" && (
                  <>
                    <ImageIcon className={cn("text-gray-400", compact ? "w-3 h-3" : "w-4 h-4")} />
                    <Video     className={cn("text-gray-400", compact ? "w-3 h-3" : "w-4 h-4")} />
                  </>
                )}
              </div>
              <div className="text-center">
                <p className={cn("text-gray-500 font-medium", compact ? "text-[11px]" : "text-xs")}>
                  {placeholder ?? "Click or drag to upload"}
                </p>
                <p className={cn("text-gray-400 mt-0.5", compact ? "text-[10px]" : "text-[11px]")}>
                  {accept === "image" ? "PNG, JPG, GIF, WebP — up to 10 MB" :
                   accept === "video" ? "MP4, WebM, MOV — up to 500 MB" :
                   accept === "any"   ? "PDF, ZIP, MP4, and more — up to 500 MB" :
                   "Images up to 10 MB · Videos up to 500 MB"}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* YouTube mode */}
      {mode === "youtube" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white focus-within:border-[#2e9cfe] focus-within:ring-1 focus-within:ring-[#2e9cfe]/20 transition-all">
              <PlayCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <input
                className="flex-1 text-xs outline-none bg-transparent text-gray-800 placeholder:text-gray-400"
                placeholder="Paste YouTube URL…"
                value={ytDraft}
                onChange={e => { setYtDraft(e.target.value); setError(null); }}
                onKeyDown={e => e.key === "Enter" && confirmYoutube()}
              />
            </div>
            <button
              type="button"
              onClick={confirmYoutube}
              className="px-3 py-1.5 rounded-xl bg-[#2e9cfe] text-white text-xs font-medium hover:bg-[#1a8cf0] transition-colors"
            >
              Add
            </button>
          </div>

          {/* Live thumbnail preview */}
          {ytDraft && youtubeVideoId(ytDraft) && (
            <div className="rounded-xl overflow-hidden h-24 relative">
              <YoutubeThumbnail videoId={youtubeVideoId(ytDraft)!} className="h-24" />
            </div>
          )}

          <p className="text-gray-400 text-[10.5px]">
            Supports youtube.com/watch?v=… and youtu.be/… links
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
          <p className="text-red-500 text-[11px]">{error}</p>
        </div>
      )}
    </div>
  );
}

// ── Standalone YouTube embed (for public page / preview) ───────────────────
export function YouTubeEmbed({ videoId, className }: { videoId: string; className?: string }) {
  return (
    <div className={cn("relative w-full overflow-hidden rounded-xl bg-black", className)} style={{ paddingBottom: "56.25%" }}>
      <iframe
        className="absolute inset-0 w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube video"
        loading="lazy"
      />
    </div>
  );
}

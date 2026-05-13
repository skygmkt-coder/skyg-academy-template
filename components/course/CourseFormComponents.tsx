"use client";

import { useState } from "react";
import { Icons } from "@/components/ui/Icons";

function getEmbedUrl(url: string) {
  if (!url) return null;
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const id = url.includes("v=")
      ? url.split("v=")[1]?.split("&")[0]
      : url.split("/").pop();
    return { type: "youtube", embed: `https://www.youtube.com/embed/${id}?rel=0`, id };
  }
  if (url.includes("vimeo.com")) {
    const id = url.split("/").pop();
    return { type: "vimeo", embed: `https://player.vimeo.com/video/${id}?title=0`, id };
  }
  return null;
}

export function VideoUrlInput({
  name,
  label,
  placeholder,
}: {
  name: string;
  label: string;
  placeholder?: string;
}) {
  const [url, setUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const parsed = getEmbedUrl(url);

  return (
    <div>
      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          name={name}
          type="url"
          value={url}
          onChange={e => { setUrl(e.target.value); setShowPreview(false); }}
          placeholder={placeholder || "https://youtube.com/watch?v=... o https://vimeo.com/..."}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm
            placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors"
        />
        {parsed && (
          <button
            type="button"
            onClick={() => setShowPreview(v => !v)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all shrink-0"
            style={{
              background: showPreview ? "rgba(53,137,242,0.2)" : "rgba(53,137,242,0.1)",
              border: "1px solid rgba(53,137,242,0.3)",
              color: "var(--color-primary, #3589F2)",
            }}
          >
            <Icons.play size={14} />
            {showPreview ? "Ocultar" : "Preview"}
          </button>
        )}
      </div>

      {/* Type indicator */}
      {url && (
        <p className="text-xs mt-1.5" style={{
          color: parsed ? "#4ade80" : "var(--color-accent, #E8004A)"
        }}>
          {parsed
            ? `✓ ${parsed.type === "youtube" ? "YouTube" : "Vimeo"} detectado`
            : "⚠ URL no reconocida — usa YouTube o Vimeo"}
        </p>
      )}

      {/* Preview */}
      {showPreview && parsed && (
        <div className="mt-3 rounded-xl overflow-hidden border border-white/10"
          style={{ aspectRatio: "16/9", background: "#000" }}>
          <iframe
            src={parsed.embed}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}

export function FileUploadInput({
  name,
  label,
  accept,
  hint,
}: {
  name: string;
  label: string;
  accept?: string;
  hint?: string;
}) {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div>
      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
        {label}
      </label>
      <label
        className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px dashed rgba(255,255,255,0.15)",
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(53,137,242,0.4)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
      >
        <Icons.download size={18} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/60">
            {fileName || "Seleccionar archivo"}
          </p>
          {hint && <p className="text-xs text-white/25 mt-0.5">{hint}</p>}
        </div>
        <input
          name={name}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={e => setFileName(e.target.files?.[0]?.name || null)}
        />
      </label>
    </div>
  );
}

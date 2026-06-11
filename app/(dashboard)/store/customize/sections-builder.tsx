"use client";

import { useState } from "react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical, Trash2, Plus, ChevronDown, ChevronUp, X, Lock, EyeOff,
  Megaphone, Sparkles, Images, Type, Quote, HelpCircle, Play, Mail,
  LayoutGrid, Heading, AlignLeft, MousePointerClick, Image as ImageIcon, Minus, MoveVertical, MoveHorizontal,
} from "lucide-react";
import { MediaUpload } from "@/components/ui/media-upload";
import {
  type StoreSection, type StoreSectionType, type LayoutItem, type BlocksSection, type Block, type BlockType,
  SECTION_META, SECTION_NATURAL, defaultSection, sectionTitle, isCoreItem, CORE_META, layoutItemTitle,
  defaultBlock, BLOCK_META, blockSummary,
} from "@/lib/store-sections";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Megaphone, Sparkles, Images, Type, Quote, HelpCircle, Play, Mail, LayoutGrid,
  Heading, AlignLeft, MousePointerClick, Image: ImageIcon, Minus, MoveVertical, MoveHorizontal,
};

interface BuilderPage {
  key: string;
  label: string;
  sections: LayoutItem[];
  onChange: (next: LayoutItem[]) => void;
  /** When true, the page mixes built-in core sections with custom blocks. */
  hasCore?: boolean;
  /** A user-created page (renamable / deletable, lives at /store/p/{slug}). */
  custom?: boolean;
  slug?: string;
  onRename?: (title: string) => void;
  onSlugChange?: (slug: string) => void;
  onDelete?: () => void;
}

export function SectionsBuilder({ pages, onEditCore, hiddenCores, onAddPage }: { pages: BuilderPage[]; onEditCore?: (panel: string) => void; hiddenCores?: Set<string>; onAddPage?: () => void }) {
  const [activePage, setActivePage] = useState(pages[0]?.key ?? "");
  const [openId, setOpenId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const current = pages.find((p) => p.key === activePage) ?? pages[0];
  const onChange = current.onChange;
  const list: LayoutItem[] = Array.isArray(current.sections) ? current.sections : [];

  const addBlock = (type: StoreSectionType) => {
    const block = defaultSection(type);
    onChange([...list, block]);
    setOpenId(block.id);
    setAddOpen(false);
  };
  const removeBlock = (id: string) => onChange(list.filter((s) => s.id !== id));
  const patchBlock = (id: string, patch: Partial<StoreSection>) =>
    onChange(list.map((s) => (s.id === id && !isCoreItem(s) ? ({ ...s, ...patch } as StoreSection) : s)));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const from = list.findIndex((s) => s.id === active.id);
      const to = list.findIndex((s) => s.id === over.id);
      if (from !== -1 && to !== -1) onChange(arrayMove(list, from, to));
    }
  };

  return (
    <div className="p-4 space-y-3">
      {(pages.length > 1 || onAddPage) && (
        <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-gray-100">
          {pages.map((pg) => (
            <button
              key={pg.key}
              onClick={() => { setActivePage(pg.key); setOpenId(null); }}
              title={pg.label}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors max-w-[120px] truncate ${activePage === pg.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
            >
              {pg.label}{pg.sections?.length ? ` (${pg.sections.length})` : ""}
            </button>
          ))}
          {onAddPage && (
            <button onClick={onAddPage} title="Create a new page" className="px-2.5 py-1.5 text-xs font-semibold rounded-lg text-gray-500 hover:text-[#2e9cfe] hover:bg-white transition-colors flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Page
            </button>
          )}
        </div>
      )}

      {current.custom && (
        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-2.5 space-y-2">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Page title</label>
            <input value={current.label} onChange={(e) => current.onRename?.(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 focus:border-blue-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">URL</label>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-400 whitespace-nowrap">/store/p/</span>
              <input value={current.slug ?? ""} onChange={(e) => current.onSlugChange?.(e.target.value)} placeholder="about"
                className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 focus:border-blue-400 focus:outline-none" />
            </div>
          </div>
          <button onClick={() => current.onDelete?.()} className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600">
            <Trash2 className="w-3.5 h-3.5" /> Delete page
          </button>
        </div>
      )}

      <p className="text-xs text-gray-500 leading-relaxed">
        {current.custom
          ? <>Build the <strong>{current.label || "page"}</strong> page from sections &amp; blocks. Add a Flexible section for full control. It lives at <code className="bg-gray-100 px-1 rounded">/store/p/{current.slug || "…"}</code>.</>
          : current.hasCore
          ? <>Every section of the <strong>{current.label}</strong> page. Drag to reorder, click a custom block to edit, and add new blocks anywhere. Core sections (locked icon) are configured in their own panels; ones marked <span className="text-amber-600 font-medium">Hidden</span> aren&apos;t shown on your store until you enable them.</>
          : <>Reorderable sections for the <strong>{current.label}</strong> page. Drag to reorder, click to edit. They render below the main content on the live store.</>}
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={list.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {list.map((s) => (
              <SortableRow
                key={s.id}
                section={s}
                open={openId === s.id}
                onToggle={() => setOpenId((o) => (o === s.id ? null : s.id))}
                onRemove={() => removeBlock(s.id)}
                onPatch={(patch) => patchBlock(s.id, patch)}
                onEditCore={onEditCore}
                hiddenCores={hiddenCores}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {list.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-xl">
          No sections yet. Add your first block below.
        </p>
      )}

      {/* Add section */}
      <div className="relative">
        <button
          onClick={() => setAddOpen((o) => !o)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-gray-300 text-sm font-medium text-gray-600 hover:border-[#2e9cfe] hover:text-[#2e9cfe] transition-all"
        >
          <Plus className="w-4 h-4" /> Add section
        </button>
        {addOpen && (
          <div className="mt-2 bg-white rounded-xl border border-gray-200 shadow-lg p-1.5 max-h-72 overflow-y-auto">
            {SECTION_META.map((m) => {
              const Icon = ICONS[m.icon] ?? Type;
              return (
                <button
                  key={m.type}
                  onClick={() => addBlock(m.type)}
                  className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-gray-50 text-left transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800">{m.label}</div>
                    <div className="text-[11px] text-gray-400 truncate">{m.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SortableRow({
  section, open, onToggle, onRemove, onPatch, onEditCore, hiddenCores,
}: {
  section: LayoutItem;
  open: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onPatch: (patch: Partial<StoreSection>) => void;
  onEditCore?: (panel: string) => void;
  hiddenCores?: Set<string>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.85 : 1 };

  // ── Core (built-in) section: reorderable, configured in its own panel ──
  if (isCoreItem(section)) {
    const meta = CORE_META[section.core];
    const Icon = ICONS[meta?.icon ?? "Type"] ?? Type;
    // A core section that won't render on the live store (its feature is
    // toggled off / has no content). Shown muted so the builder never implies
    // a section is on the page when it isn't.
    const hidden = hiddenCores?.has(section.core) ?? false;
    return (
      <div ref={setNodeRef} style={style} className={`rounded-xl border overflow-hidden ${hidden ? "border-dashed border-gray-200 bg-gray-50/40" : "border-gray-200 bg-gray-50/60"}`}>
        <div className="flex items-center gap-1 px-2 py-2">
          <button {...attributes} {...listeners} className="p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing" title="Drag to reorder">
            <GripVertical className="w-4 h-4" />
          </button>
          <button onClick={() => onEditCore?.(meta?.panel ?? "")} className="flex-1 flex items-center gap-2 min-w-0 text-left" title={hidden ? "Hidden on your store, click to enable" : "Configure in its panel"}>
            <Icon className={`w-4 h-4 flex-shrink-0 ${hidden ? "text-gray-300" : "text-gray-400"}`} />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wide font-semibold">
                <span className="text-gray-400">Core section</span>
                {hidden && <span className="text-amber-500 normal-case tracking-normal"> · Hidden</span>}
              </div>
              <div className={`text-xs font-medium truncate ${hidden ? "text-gray-400" : "text-gray-800"}`}>{meta?.label ?? section.core}</div>
            </div>
          </button>
          {hidden
            ? <EyeOff className="w-3.5 h-3.5 text-amber-400 mr-1" />
            : <Lock className="w-3.5 h-3.5 text-gray-300 mr-1" />}
        </div>
      </div>
    );
  }

  // ── Custom block: editable + removable ──
  const meta = SECTION_META.find((m) => m.type === section.type);
  const Icon = ICONS[meta?.icon ?? "Type"] ?? Type;

  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center gap-1 px-2 py-2">
        <button {...attributes} {...listeners} className="p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing" title="Drag to reorder">
          <GripVertical className="w-4 h-4" />
        </button>
        <button onClick={onToggle} className="flex-1 flex items-center gap-2 min-w-0 text-left">
          <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">{meta?.label ?? section.type}</div>
            <div className="text-xs font-medium text-gray-800 truncate">{layoutItemTitle(section)}</div>
          </div>
        </button>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        <button onClick={onRemove} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors" title="Delete section">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {open && <div className="px-3 pb-3 pt-1 border-t border-gray-100">{<Editor section={section} onPatch={onPatch} />}</div>}
    </div>
  );
}

// ── Field primitives ──────────────────────────────────────────────────────────
const labelCls = "block text-[11px] font-medium text-gray-500 mb-1";
const inputCls = "w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-400 focus:outline-none";

function Text({ label, value, onChange, placeholder, textarea }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean }) {
  return (
    <div className="mb-2.5">
      <label className={labelCls}>{label}</label>
      {textarea
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={`${inputCls} resize-none`} />
        : <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />}
    </div>
  );
}

function Seg<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="mb-2.5">
      <label className={labelCls}>{label}</label>
      <div className="flex gap-1">
        {options.map((o) => (
          <button key={String(o.value)} onClick={() => onChange(o.value)}
            className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${value === o.value ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function AlignToggle({ value, onChange }: { value: "left" | "center"; onChange: (v: "left" | "center") => void }) {
  return (
    <div className="mb-2.5">
      <label className={labelCls}>Alignment</label>
      <div className="flex gap-1">
        {(["left", "center"] as const).map((a) => (
          <button key={a} onClick={() => onChange(a)}
            className={`flex-1 py-1.5 text-xs rounded-lg border capitalize transition-colors ${value === a ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Section editor: type-specific content + shared design controls ──────────────
function Editor({ section, onPatch }: { section: StoreSection; onPatch: (patch: Partial<StoreSection>) => void }) {
  return (
    <>
      <TypeFields section={section} onPatch={onPatch} />
      <DesignControls section={section} onPatch={onPatch} />
    </>
  );
}

// Shared design controls available on every section: width, spacing & background.
function DesignControls({ section, onPatch }: { section: StoreSection; onPatch: (patch: Partial<StoreSection>) => void }) {
  const s = section;
  const nat = SECTION_NATURAL[s.type];
  const padOpts = [
    { value: "none", label: "None" }, { value: "sm", label: "S" }, { value: "md", label: "M" },
    { value: "lg", label: "L" }, { value: "xl", label: "XL" },
  ];
  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Design</p>
      <Seg label="Content width" value={s.width ?? nat.width}
        options={[{ value: "narrow", label: "Narrow" }, { value: "normal", label: "Normal" }, { value: "wide", label: "Wide" }, { value: "full", label: "Full" }]}
        onChange={(v) => onPatch({ width: v as "narrow" | "normal" | "wide" | "full" })} />
      <Seg label="Top spacing" value={s.padTop ?? "md"} options={padOpts}
        onChange={(v) => onPatch({ padTop: v as "none" | "sm" | "md" | "lg" | "xl" })} />
      <Seg label="Bottom spacing" value={s.padBottom ?? "md"} options={padOpts}
        onChange={(v) => onPatch({ padBottom: v as "none" | "sm" | "md" | "lg" | "xl" })} />
      <Seg label="Background" value={s.bg ?? nat.bg}
        options={[{ value: "default", label: "Page" }, { value: "surface", label: "Surface" }, { value: "custom", label: "Custom" }]}
        onChange={(v) => onPatch({ bg: v as "default" | "surface" | "custom" })} />
      {s.bg === "custom" && (
        <div className="mb-2.5">
          <label className={labelCls}>Background color</label>
          <div className="flex items-center gap-2">
            <input type="color" value={s.bgColor || "#ffffff"} onChange={(e) => onPatch({ bgColor: e.target.value })} className="w-10 h-8 rounded border border-gray-200 p-0.5 cursor-pointer" />
            <input value={s.bgColor || ""} onChange={(e) => onPatch({ bgColor: e.target.value })} placeholder="#ffffff" className={inputCls} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Per-type content fields ─────────────────────────────────────────────────────
function TypeFields({ section, onPatch }: { section: StoreSection; onPatch: (patch: Partial<StoreSection>) => void }) {
  const s = section;
  switch (s.type) {
    case "banner":
      return (
        <>
          <Text label="Heading" value={s.heading} onChange={(v) => onPatch({ heading: v })} />
          <Text label="Subtext" value={s.subtext} onChange={(v) => onPatch({ subtext: v })} textarea />
          <Text label="Button label" value={s.ctaLabel} onChange={(v) => onPatch({ ctaLabel: v })} />
          <Text label="Button link" value={s.ctaUrl} onChange={(v) => onPatch({ ctaUrl: v })} placeholder="#products or https://…" />
          <div className="mb-2.5">
            <label className={labelCls}>Background image (optional)</label>
            <MediaUpload value={s.image} onChange={(url) => onPatch({ image: url || "" })} accept="image" compact />
          </div>
          <AlignToggle value={s.align} onChange={(v) => onPatch({ align: v })} />
        </>
      );
    case "richtext":
      return (
        <>
          <Text label="Heading" value={s.heading} onChange={(v) => onPatch({ heading: v })} />
          <Text label="Body" value={s.body} onChange={(v) => onPatch({ body: v })} textarea />
          <AlignToggle value={s.align} onChange={(v) => onPatch({ align: v })} />
          <Text label="Button label (optional)" value={s.ctaLabel ?? ""} onChange={(v) => onPatch({ ctaLabel: v })} placeholder="Learn more" />
          {s.ctaLabel ? <Text label="Button link" value={s.ctaUrl ?? ""} onChange={(v) => onPatch({ ctaUrl: v })} placeholder="#products or https://…" /> : null}
        </>
      );
    case "featured":
      return (
        <>
          <Text label="Heading" value={s.heading} onChange={(v) => onPatch({ heading: v })} />
          <div className="mb-2.5">
            <label className={labelCls}>Number of products to show</label>
            <input type="number" min={1} max={8} value={s.count}
              onChange={(e) => onPatch({ count: Math.max(1, Math.min(8, parseInt(e.target.value) || 1)) })}
              className={inputCls} />
          </div>
          <Text label="Button label (optional)" value={s.ctaLabel ?? ""} onChange={(v) => onPatch({ ctaLabel: v })} placeholder="Learn more" />
          {s.ctaLabel ? <Text label="Button link" value={s.ctaUrl ?? ""} onChange={(v) => onPatch({ ctaUrl: v })} placeholder="#products or https://…" /> : null}
        </>
      );
    case "gallery": {
      const gLayout = s.layout ?? "grid";
      const moveImg = (from: number, to: number) => {
        if (to < 0 || to >= s.images.length) return;
        const arr = [...s.images];
        const [m] = arr.splice(from, 1);
        arr.splice(to, 0, m);
        onPatch({ images: arr });
      };
      return (
        <>
          <Text label="Heading" value={s.heading} onChange={(v) => onPatch({ heading: v })} />
          <Seg label="Layout" value={gLayout} options={[{ value: "grid", label: "Grid" }, { value: "masonry", label: "Masonry" }]} onChange={(v) => onPatch({ layout: v as "grid" | "masonry" })} />
          <Seg label="Columns" value={s.columns ?? 3} options={[{ value: 2, label: "2" }, { value: 3, label: "3" }, { value: 4, label: "4" }]} onChange={(v) => onPatch({ columns: v as 2 | 3 | 4 })} />
          {gLayout === "grid" && (
            <Seg label="Image shape" value={s.aspect ?? "square"} options={[{ value: "square", label: "Square" }, { value: "portrait", label: "Tall" }, { value: "landscape", label: "Wide" }, { value: "auto", label: "Original" }]} onChange={(v) => onPatch({ aspect: v as "square" | "portrait" | "landscape" | "auto" })} />
          )}
          <Seg label="Spacing" value={s.gap ?? "md"} options={[{ value: "sm", label: "Small" }, { value: "md", label: "Medium" }, { value: "lg", label: "Large" }]} onChange={(v) => onPatch({ gap: v as "sm" | "md" | "lg" })} />
          <label className={labelCls}>Images <span className="text-gray-400 font-normal">· reorder with the arrows</span></label>
          <div className="space-y-2">
            {s.images.map((img, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="flex flex-col">
                  <button onClick={() => moveImg(i, i - 1)} disabled={i === 0} className="text-gray-300 enabled:hover:text-gray-600 disabled:opacity-30" title="Move up"><ChevronUp className="w-4 h-4" /></button>
                  <button onClick={() => moveImg(i, i + 1)} disabled={i === s.images.length - 1} className="text-gray-300 enabled:hover:text-gray-600 disabled:opacity-30" title="Move down"><ChevronDown className="w-4 h-4" /></button>
                </div>
                <div className="flex-1"><MediaUpload value={img} onChange={(url) => onPatch({ images: s.images.map((x, j) => (j === i ? url : x)) })} accept="image" compact /></div>
                <button onClick={() => onPatch({ images: s.images.filter((_, j) => j !== i) })} className="p-1.5 text-gray-300 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <button onClick={() => onPatch({ images: [...s.images, ""] })} className="text-xs text-blue-600 font-medium hover:underline">+ Add image</button>
          </div>
        </>
      );
    }
    case "testimonials":
      return (
        <>
          <Text label="Heading" value={s.heading} onChange={(v) => onPatch({ heading: v })} />
          <label className={labelCls}>Reviews</label>
          <div className="space-y-2">
            {s.items.map((t, i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <input value={t.name} onChange={(e) => onPatch({ items: s.items.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} placeholder="Name" className={inputCls} />
                  <button onClick={() => onPatch({ items: s.items.filter((_, j) => j !== i) })} className="p-1 ml-1 text-gray-300 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                </div>
                <textarea value={t.quote} onChange={(e) => onPatch({ items: s.items.map((x, j) => (j === i ? { ...x, quote: e.target.value } : x)) })} placeholder="Quote" rows={2} className={`${inputCls} resize-none`} />
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-gray-400">Stars</span>
                  <input type="number" min={1} max={5} value={t.rating} onChange={(e) => onPatch({ items: s.items.map((x, j) => (j === i ? { ...x, rating: Math.max(1, Math.min(5, parseInt(e.target.value) || 5)) } : x)) })} className="w-14 text-xs px-2 py-1 border border-gray-200 rounded-lg bg-gray-50 text-gray-900" />
                </div>
              </div>
            ))}
            <button onClick={() => onPatch({ items: [...s.items, { name: "", quote: "", rating: 5 }] })} className="text-xs text-blue-600 font-medium hover:underline">+ Add review</button>
          </div>
        </>
      );
    case "faq":
      return (
        <>
          <Text label="Heading" value={s.heading} onChange={(v) => onPatch({ heading: v })} />
          <label className={labelCls}>Questions</label>
          <div className="space-y-2">
            {s.items.map((it, i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <input value={it.q} onChange={(e) => onPatch({ items: s.items.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)) })} placeholder="Question" className={inputCls} />
                  <button onClick={() => onPatch({ items: s.items.filter((_, j) => j !== i) })} className="p-1 ml-1 text-gray-300 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                </div>
                <textarea value={it.a} onChange={(e) => onPatch({ items: s.items.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) })} placeholder="Answer" rows={2} className={`${inputCls} resize-none`} />
              </div>
            ))}
            <button onClick={() => onPatch({ items: [...s.items, { q: "", a: "" }] })} className="text-xs text-blue-600 font-medium hover:underline">+ Add question</button>
          </div>
        </>
      );
    case "video":
      return (
        <>
          <Text label="Heading" value={s.heading} onChange={(v) => onPatch({ heading: v })} />
          <Text label="YouTube video ID" value={s.youtubeId} onChange={(v) => onPatch({ youtubeId: v.trim() })} placeholder="dQw4w9WgXcQ" />
          <p className="text-[11px] text-gray-400">The ID from the URL after <code className="bg-gray-100 px-1 rounded">v=</code></p>
        </>
      );
    case "newsletter":
      return (
        <>
          <Text label="Heading" value={s.heading} onChange={(v) => onPatch({ heading: v })} />
          <Text label="Subtext" value={s.subtext} onChange={(v) => onPatch({ subtext: v })} textarea />
          <Text label="Button label" value={s.buttonLabel} onChange={(v) => onPatch({ buttonLabel: v })} />
        </>
      );
    case "blocks":
      return <BlockBuilder section={s} onPatch={onPatch} />;
  }
}

// ── Flexible section: a reorderable list of sub-blocks ──────────────────────────
const ALIGN_OPTS = [{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }];

function BlockBuilder({ section, onPatch }: { section: BlocksSection; onPatch: (patch: Partial<StoreSection>) => void }) {
  const blocks = section.blocks ?? [];
  const [openId, setOpenId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const set = (next: Block[]) => onPatch({ blocks: next });
  const add = (type: BlockType) => { const b = defaultBlock(type); set([...blocks, b]); setOpenId(b.id); setAddOpen(false); };
  const remove = (id: string) => set(blocks.filter((b) => b.id !== id));
  const patch = (id: string, p: Partial<Block>) => set(blocks.map((b) => (b.id === id ? ({ ...b, ...p } as Block) : b)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length) return;
    const arr = [...blocks];
    const [m] = arr.splice(from, 1);
    arr.splice(to, 0, m);
    set(arr);
  };

  return (
    <div className="space-y-2">
      <label className={labelCls}>Blocks <span className="text-gray-400 font-normal">· reorder with the arrows</span></label>
      {blocks.map((b, i) => {
        const Icon = ICONS[BLOCK_META.find((m) => m.type === b.type)?.icon ?? "Type"] ?? Type;
        const open = openId === b.id;
        return (
          <div key={b.id} className="rounded-lg border border-gray-200 bg-gray-50/50 overflow-hidden">
            <div className="flex items-center gap-1 px-2 py-1.5">
              <div className="flex flex-col">
                <button onClick={() => move(i, i - 1)} disabled={i === 0} className="text-gray-300 enabled:hover:text-gray-600 disabled:opacity-30" title="Move up"><ChevronUp className="w-3.5 h-3.5" /></button>
                <button onClick={() => move(i, i + 1)} disabled={i === blocks.length - 1} className="text-gray-300 enabled:hover:text-gray-600 disabled:opacity-30" title="Move down"><ChevronDown className="w-3.5 h-3.5" /></button>
              </div>
              <button onClick={() => setOpenId((o) => (o === b.id ? null : b.id))} className="flex-1 flex items-center gap-2 min-w-0 text-left">
                <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-700 truncate">{blockSummary(b)}</span>
              </button>
              <button onClick={() => remove(b.id)} className="p-1 text-gray-300 hover:text-red-500" title="Delete block"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            {open && <div className="px-2.5 pb-2.5 pt-1 border-t border-gray-100"><BlockFields block={b} onPatch={(p) => patch(b.id, p)} /></div>}
          </div>
        );
      })}
      {blocks.length === 0 && <p className="text-xs text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded-lg">No blocks yet.</p>}
      <div className="relative">
        <button onClick={() => setAddOpen((o) => !o)} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-gray-300 text-xs font-medium text-gray-500 hover:border-[#2e9cfe] hover:text-[#2e9cfe] transition-all">
          <Plus className="w-3.5 h-3.5" /> Add block
        </button>
        {addOpen && (
          <div className="mt-1.5 grid grid-cols-2 gap-1 bg-white rounded-lg border border-gray-200 shadow-lg p-1.5">
            {BLOCK_META.map((m) => {
              const Icon = ICONS[m.icon] ?? Type;
              return (
                <button key={m.type} onClick={() => add(m.type)} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 text-left transition-colors">
                  <Icon className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span className="text-xs text-gray-700">{m.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function BlockFields({ block, onPatch }: { block: Block; onPatch: (p: Partial<Block>) => void }) {
  const b = block;
  switch (b.type) {
    case "heading":
      return (
        <>
          <Text label="Text" value={b.text} onChange={(v) => onPatch({ text: v })} />
          <Seg label="Size" value={b.size} options={[{ value: "sm", label: "S" }, { value: "md", label: "M" }, { value: "lg", label: "L" }, { value: "xl", label: "XL" }]} onChange={(v) => onPatch({ size: v as "sm" | "md" | "lg" | "xl" })} />
          <Seg label="Align" value={b.align} options={ALIGN_OPTS} onChange={(v) => onPatch({ align: v as "left" | "center" | "right" })} />
        </>
      );
    case "text":
      return (
        <>
          <Text label="Text" value={b.text} onChange={(v) => onPatch({ text: v })} textarea />
          <Seg label="Align" value={b.align} options={ALIGN_OPTS} onChange={(v) => onPatch({ align: v as "left" | "center" | "right" })} />
        </>
      );
    case "button":
      return (
        <>
          <Text label="Label" value={b.label} onChange={(v) => onPatch({ label: v })} />
          <Text label="Link" value={b.url} onChange={(v) => onPatch({ url: v })} placeholder="#products or https://…" />
          <Seg label="Style" value={b.variant} options={[{ value: "solid", label: "Solid" }, { value: "outline", label: "Outline" }]} onChange={(v) => onPatch({ variant: v as "solid" | "outline" })} />
          <Seg label="Align" value={b.align} options={ALIGN_OPTS} onChange={(v) => onPatch({ align: v as "left" | "center" | "right" })} />
        </>
      );
    case "marquee":
      return (
        <>
          <Text label="Text" value={b.text} onChange={(v) => onPatch({ text: v })} />
          <Seg label="Size" value={b.size} options={[{ value: "md", label: "M" }, { value: "lg", label: "L" }, { value: "xl", label: "XL" }]} onChange={(v) => onPatch({ size: v as "md" | "lg" | "xl" })} />
          <Seg label="Speed" value={b.speed} options={[{ value: "slow", label: "Slow" }, { value: "normal", label: "Normal" }, { value: "fast", label: "Fast" }]} onChange={(v) => onPatch({ speed: v as "slow" | "normal" | "fast" })} />
          <Seg label="Direction" value={b.direction} options={[{ value: "left", label: "← Left" }, { value: "right", label: "Right →" }]} onChange={(v) => onPatch({ direction: v as "left" | "right" })} />
          <Seg label="Style" value={b.curved ? "curved" : "straight"} options={[{ value: "straight", label: "Straight" }, { value: "curved", label: "Curved" }]} onChange={(v) => onPatch({ curved: v === "curved" })} />
          <p className="text-[11px] text-gray-400">Tip: set this section&apos;s width to <strong>Full</strong> for the boldest edge-to-edge effect.</p>
        </>
      );
    case "image":
      return (
        <>
          <div className="mb-2.5"><label className={labelCls}>Image</label><MediaUpload value={b.url} onChange={(url) => onPatch({ url: url || "" })} accept="image" compact /></div>
          <Text label="Alt text" value={b.alt} onChange={(v) => onPatch({ alt: v })} />
          <Seg label="Max width" value={b.maxWidth} options={[{ value: "sm", label: "S" }, { value: "md", label: "M" }, { value: "lg", label: "L" }, { value: "full", label: "Full" }]} onChange={(v) => onPatch({ maxWidth: v as "sm" | "md" | "lg" | "full" })} />
          <Seg label="Align" value={b.align} options={ALIGN_OPTS} onChange={(v) => onPatch({ align: v as "left" | "center" | "right" })} />
          <label className="flex items-center gap-2 text-xs text-gray-600 mt-1"><input type="checkbox" checked={b.rounded} onChange={(e) => onPatch({ rounded: e.target.checked })} /> Rounded corners</label>
        </>
      );
    case "spacer":
      return <Seg label="Height" value={b.size} options={[{ value: "sm", label: "Small" }, { value: "md", label: "Medium" }, { value: "lg", label: "Large" }]} onChange={(v) => onPatch({ size: v as "sm" | "md" | "lg" })} />;
    case "divider":
      return <p className="text-xs text-gray-400">A horizontal divider line, no options.</p>;
  }
}

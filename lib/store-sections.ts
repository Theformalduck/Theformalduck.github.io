// ── Store homepage section builder, shared types, defaults & metadata ────────
// Used by both the customize-page builder and the public store renderer.

export type StoreSectionType =
  | "banner" | "richtext" | "featured" | "gallery"
  | "testimonials" | "faq" | "video" | "newsletter" | "blocks";

// ── Per-section design (Shopify-style), all optional; fall back to per-type
// natural defaults in SECTION_NATURAL so existing sections keep their look. ──
export type SectionWidth = "narrow" | "normal" | "wide" | "full";
export type SectionPad = "none" | "sm" | "md" | "lg" | "xl";
export type SectionBg = "default" | "surface" | "custom";

interface Base {
  id: string;
  type: StoreSectionType;
  width?: SectionWidth;
  padTop?: SectionPad;
  padBottom?: SectionPad;
  bg?: SectionBg;
  bgColor?: string;
}

export interface BannerSection extends Base {
  type: "banner";
  heading: string; subtext: string;
  ctaLabel: string; ctaUrl: string;
  image: string; align: "left" | "center";
}
export interface RichTextSection extends Base {
  type: "richtext";
  heading: string; body: string; align: "left" | "center";
  ctaLabel?: string; ctaUrl?: string;
}
export interface FeaturedSection extends Base {
  type: "featured";
  heading: string; count: number;
  ctaLabel?: string; ctaUrl?: string;
}
export interface GallerySection extends Base {
  type: "gallery";
  heading: string; images: string[];
  layout?: "grid" | "masonry";
  columns?: 2 | 3 | 4;
  aspect?: "square" | "portrait" | "landscape" | "auto";
  gap?: "sm" | "md" | "lg";
}
export interface TestimonialsSection extends Base {
  type: "testimonials";
  heading: string;
  items: { name: string; quote: string; rating: number }[];
}
export interface FaqSection extends Base {
  type: "faq";
  heading: string;
  items: { q: string; a: string }[];
}
export interface VideoSection extends Base {
  type: "video";
  heading: string; youtubeId: string;
}
export interface NewsletterSection extends Base {
  type: "newsletter";
  heading: string; subtext: string; buttonLabel: string;
}

// ── Blocks, composable sub-elements inside a Flexible ("blocks") section ───────
export type BlockType = "heading" | "text" | "button" | "marquee" | "image" | "divider" | "spacer";
export type BlockAlign = "left" | "center" | "right";

interface BlockBase { id: string; type: BlockType }
export interface HeadingBlock extends BlockBase { type: "heading"; text: string; size: "sm" | "md" | "lg" | "xl"; align: BlockAlign }
export interface TextBlock    extends BlockBase { type: "text"; text: string; align: BlockAlign }
export interface ButtonBlock  extends BlockBase { type: "button"; label: string; url: string; variant: "solid" | "outline"; align: BlockAlign }
// Big animated scrolling text, straight ticker or a curved arc (Squarespace-style).
export interface MarqueeBlock extends BlockBase { type: "marquee"; text: string; size: "md" | "lg" | "xl"; speed: "slow" | "normal" | "fast"; direction: "left" | "right"; curved: boolean }
export interface ImageBlock   extends BlockBase { type: "image"; url: string; alt: string; rounded: boolean; maxWidth: "sm" | "md" | "lg" | "full"; align: BlockAlign }
export interface DividerBlock extends BlockBase { type: "divider" }
export interface SpacerBlock  extends BlockBase { type: "spacer"; size: "sm" | "md" | "lg" }
export type Block = HeadingBlock | TextBlock | ButtonBlock | MarqueeBlock | ImageBlock | DividerBlock | SpacerBlock;

export interface BlocksSection extends Base { type: "blocks"; blocks: Block[] }

export function blockUid(): string { return "blk_" + Math.random().toString(36).slice(2, 10); }

export function defaultBlock(type: BlockType): Block {
  const id = blockUid();
  switch (type) {
    case "heading": return { id, type, text: "Heading", size: "lg", align: "left" };
    case "text":    return { id, type, text: "Add your text here, tell your story, describe a product, or share details.", align: "left" };
    case "button":  return { id, type, label: "Shop now", url: "#products", variant: "solid", align: "left" };
    case "marquee": return { id, type, text: "New arrivals · Free shipping · Shop the latest", size: "lg", speed: "normal", direction: "left", curved: false };
    case "image":   return { id, type, url: "", alt: "", rounded: true, maxWidth: "full", align: "center" };
    case "divider": return { id, type };
    case "spacer":  return { id, type, size: "md" };
  }
}

export const BLOCK_META: { type: BlockType; label: string; icon: string }[] = [
  { type: "heading", label: "Heading", icon: "Heading" },
  { type: "text",    label: "Text",    icon: "AlignLeft" },
  { type: "button",  label: "Button",  icon: "MousePointerClick" },
  { type: "marquee", label: "Moving text", icon: "MoveHorizontal" },
  { type: "image",   label: "Image",   icon: "Image" },
  { type: "divider", label: "Divider", icon: "Minus" },
  { type: "spacer",  label: "Spacer",  icon: "MoveVertical" },
];

export function blockSummary(b: Block): string {
  if (b.type === "heading" || b.type === "text" || b.type === "marquee") return b.text || b.type;
  if (b.type === "button") return b.label || "Button";
  if (b.type === "image") return b.alt || "Image";
  return b.type.charAt(0).toUpperCase() + b.type.slice(1);
}

export type StoreSection =
  | BannerSection | RichTextSection | FeaturedSection | GallerySection
  | TestimonialsSection | FaqSection | VideoSection | NewsletterSection | BlocksSection;

export function sectionUid(): string {
  return "sec_" + Math.random().toString(36).slice(2, 10);
}

// Factory of default content for each new block.
export function defaultSection(type: StoreSectionType): StoreSection {
  const id = sectionUid();
  switch (type) {
    case "banner":
      return { id, type, heading: "Big seasonal sale", subtext: "Up to 40% off, limited time only.", ctaLabel: "Shop now", ctaUrl: "#products", image: "", align: "center" };
    case "richtext":
      return { id, type, heading: "Our story", body: "Tell customers what makes your shop special. Share your mission, materials, or what to expect.", align: "center" };
    case "featured":
      return { id, type, heading: "Featured products", count: 4 };
    case "gallery":
      return { id, type, heading: "Gallery", images: [], layout: "grid", columns: 3, aspect: "square", gap: "md" };
    case "testimonials":
      return { id, type, heading: "What customers say", items: [
        { name: "Alex M.", quote: "Amazing quality and fast shipping. Will buy again!", rating: 5 },
        { name: "Jordan P.", quote: "Exactly what I wanted, exceeded expectations.", rating: 5 },
      ] };
    case "faq":
      return { id, type, heading: "Frequently asked questions", items: [
        { q: "How long does shipping take?", a: "Most orders ship within 3–5 business days." },
        { q: "What's your return policy?", a: "Returns accepted within 30 days of delivery." },
      ] };
    case "video":
      return { id, type, heading: "Watch", youtubeId: "" };
    case "newsletter":
      return { id, type, heading: "Join our newsletter", subtext: "Get early access to drops and exclusive discounts.", buttonLabel: "Subscribe" };
    case "blocks":
      return { id, type, blocks: [
        { id: blockUid(), type: "heading", text: "Build it your way", size: "lg", align: "left" },
        { id: blockUid(), type: "text", text: "Add, arrange, and style blocks however you like.", align: "left" },
        { id: blockUid(), type: "button", label: "Shop now", url: "#products", variant: "solid", align: "left" },
      ] };
  }
}

// Metadata for the "add section" menu (icon names map to lucide in the UI).
export const SECTION_META: { type: StoreSectionType; label: string; icon: string; desc: string }[] = [
  { type: "blocks",       label: "Flexible section", icon: "LayoutGrid", desc: "Build from heading, text, button & image blocks" },
  { type: "banner",       label: "Banner",          icon: "Megaphone",   desc: "Headline, text & call-to-action" },
  { type: "featured",     label: "Featured products", icon: "Sparkles",  desc: "Highlight a row of products" },
  { type: "gallery",      label: "Image gallery",   icon: "Images",      desc: "Grid of images" },
  { type: "richtext",     label: "Rich text",       icon: "Type",        desc: "A heading and paragraph" },
  { type: "testimonials", label: "Testimonials",    icon: "Quote",       desc: "Customer reviews" },
  { type: "faq",          label: "FAQ",             icon: "HelpCircle",  desc: "Questions & answers" },
  { type: "video",        label: "Video",           icon: "Play",        desc: "Embed a YouTube video" },
  { type: "newsletter",   label: "Newsletter",      icon: "Mail",        desc: "Email sign-up block" },
];

// Each section type's natural width/background, used as the fallback when the
// user hasn't overridden the per-section design controls.
export const SECTION_NATURAL: Record<StoreSectionType, { width: SectionWidth; bg: "default" | "surface" }> = {
  banner:       { width: "normal", bg: "surface" },
  featured:     { width: "normal", bg: "default" },
  gallery:      { width: "normal", bg: "default" },
  richtext:     { width: "narrow", bg: "default" },
  testimonials: { width: "normal", bg: "surface" },
  faq:          { width: "narrow", bg: "default" },
  video:        { width: "narrow", bg: "default" },
  newsletter:   { width: "narrow", bg: "surface" },
  blocks:       { width: "normal", bg: "default" },
};

export function sectionTitle(s: StoreSection): string {
  return (s as any).heading || SECTION_META.find(m => m.type === s.type)?.label || s.type;
}

// ── Unified page layout (core sections + custom blocks, all reorderable) ───────

export type CoreSectionType =
  | "hero" | "trustbar" | "iconrow" | "products" | "testimonials" | "imagebanner" | "newsletter";

export interface CoreLayoutItem { id: string; core: CoreSectionType }

// An item in the home page layout, either a built-in core section (configured
// in its own panel) or a custom drag-and-drop block.
export type LayoutItem = CoreLayoutItem | StoreSection;

export function isCoreItem(i: LayoutItem): i is CoreLayoutItem {
  return !!i && typeof (i as CoreLayoutItem).core === "string";
}

// Core sections in their default order, plus which panel edits each.
export const CORE_SECTIONS: { core: CoreSectionType; label: string; panel: string; icon: string }[] = [
  { core: "hero",         label: "Hero",            panel: "hero",     icon: "Megaphone" },
  { core: "trustbar",     label: "Trust badges",    panel: "content",  icon: "Sparkles" },
  { core: "iconrow",      label: "Icon row",        panel: "content",  icon: "Sparkles" },
  { core: "products",     label: "Products",        panel: "products", icon: "Images" },
  { core: "testimonials", label: "Testimonials",    panel: "content",  icon: "Quote" },
  { core: "imagebanner",  label: "Image banner",    panel: "content",  icon: "Images" },
  { core: "newsletter",   label: "Newsletter",      panel: "content",  icon: "Mail" },
];

export const CORE_META: Record<CoreSectionType, { label: string; panel: string; icon: string }> =
  Object.fromEntries(CORE_SECTIONS.map(c => [c.core, { label: c.label, panel: c.panel, icon: c.icon }])) as Record<CoreSectionType, { label: string; panel: string; icon: string }>;

// The default home layout: every core section in order, then any existing
// custom blocks appended (so legacy stores keep their look).
export function defaultHomeLayout(custom: StoreSection[] = []): LayoutItem[] {
  return [
    ...CORE_SECTIONS.map((c): CoreLayoutItem => ({ id: "core_" + c.core, core: c.core })),
    ...custom,
  ];
}

export function layoutItemTitle(i: LayoutItem): string {
  return isCoreItem(i) ? (CORE_META[i.core]?.label ?? i.core) : sectionTitle(i);
}

// ── Custom pages, user-created pages built from sections, each at /p/{slug} ─────
export interface CustomPage {
  id: string;
  title: string;
  slug: string;
  sections: StoreSection[];
}

export function pageUid(): string { return "page_" + Math.random().toString(36).slice(2, 8); }

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "page";
}

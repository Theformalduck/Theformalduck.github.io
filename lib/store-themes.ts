import type {
  LayoutItem, CoreLayoutItem, BannerSection, RichTextSection, GallerySection,
  TestimonialsSection, FaqSection, NewsletterSection, BlocksSection,
} from "@/lib/store-sections";

export interface StoreTheme {
  name: string;
  category: string;       // grouping shown in the picker (Professional, Playful, …)
  bg: string;
  surface: string;
  surfaceHover: string;
  border: string;
  text: string;
  muted: string;
  dark: boolean;
  navBg: string;
  heroBg: string;
  accent: string;         // primary / button fill
  accentText: string;     // text colour on the accent fill
  font: string;           // recommended FONT_STYLES key
  button: string;         // recommended BUTTON_STYLES key
  palette: string[];      // swatch row for the preview card
}

// Order of category groups in the theme picker.
export const THEME_CATEGORIES = [
  "Professional", "Sophisticated", "Friendly", "Playful", "Bold", "Quirky", "Innovative",
] as const;

// Themes bundle a colour palette + recommended font + button shape, grouped by
// vibe (Professional, Playful, …). Selecting one in the editor applies the
// palette, font, button shape and accent together. The key `default` is kept as
// the safe fallback for any store referencing an old/unknown theme.
export const STORE_THEMES: Record<string, StoreTheme> = {
  // ── Professional ──────────────────────────────────────────────────────────
  default: {
    name: "Monochrome", category: "Professional",
    bg: "#ffffff", surface: "#f6f6f7", surfaceHover: "#ececee",
    border: "#e2e2e6", text: "#0e0e10", muted: "#6b6b73",
    dark: false, navBg: "rgba(255,255,255,0.92)", heroBg: "#f6f6f7",
    accent: "#111113", accentText: "#ffffff", font: "grotesk", button: "sharp",
    palette: ["#ffffff", "#e2e2e6", "#9a9aa3", "#111113"],
  },
  evergreen: {
    name: "Evergreen", category: "Professional",
    bg: "#ffffff", surface: "#f4f6f4", surfaceHover: "#e8ede9",
    border: "#dbe3dd", text: "#16241c", muted: "#5d6b62",
    dark: false, navBg: "rgba(255,255,255,0.94)", heroBg: "#f4f6f4",
    accent: "#1f9d63", accentText: "#ffffff", font: "serif", button: "sharp",
    palette: ["#ffffff", "#1f9d63", "#1d2a22", "#0f1713"],
  },
  // ── Sophisticated ─────────────────────────────────────────────────────────
  sandstone: {
    name: "Sandstone", category: "Sophisticated",
    bg: "#ece4d8", surface: "#f6f1e8", surfaceHover: "#ebe2d3",
    border: "#d9cdba", text: "#3a322a", muted: "#7a6f60",
    dark: false, navBg: "rgba(236,228,216,0.95)", heroBg: "#f6f1e8",
    accent: "#2a241d", accentText: "#f6f1e8", font: "elegant", button: "pill",
    palette: ["#f6f1e8", "#cbb89e", "#7a6a55", "#2a241d"],
  },
  terracotta: {
    name: "Terracotta", category: "Sophisticated",
    bg: "#f4efe9", surface: "#ffffff", surfaceHover: "#efe7dd",
    border: "#e2d7c9", text: "#2f3a3a", muted: "#6d7878",
    dark: false, navBg: "rgba(244,239,233,0.95)", heroBg: "#ffffff",
    accent: "#c98064", accentText: "#ffffff", font: "serif", button: "pill",
    palette: ["#ffffff", "#c98064", "#3c4a4a", "#1f2727"],
  },
  // ── Friendly ──────────────────────────────────────────────────────────────
  harbor: {
    name: "Harbor", category: "Friendly",
    bg: "#eef3f5", surface: "#ffffff", surfaceHover: "#e3edf1",
    border: "#d3e0e6", text: "#20323d", muted: "#5f7682",
    dark: false, navBg: "rgba(238,243,245,0.95)", heroBg: "#ffffff",
    accent: "#5b7a8c", accentText: "#ffffff", font: "grotesk", button: "pill",
    palette: ["#f3ecd9", "#7d97a6", "#3a5566", "#20323d"],
  },
  meadow: {
    name: "Meadow", category: "Friendly",
    bg: "#e9e2d0", surface: "#ffffff", surfaceHover: "#ddd6c2",
    border: "#cfc6ae", text: "#1f3326", muted: "#5e6b5a",
    dark: false, navBg: "rgba(233,226,208,0.95)", heroBg: "#ffffff",
    accent: "#1f3326", accentText: "#d8e84a", font: "slab", button: "pill",
    palette: ["#f0ece0", "#cfe04a", "#9fb08a", "#1f3326"],
  },
  // ── Playful ───────────────────────────────────────────────────────────────
  grape: {
    name: "Grape Soda", category: "Playful",
    bg: "#efeafc", surface: "#ffffff", surfaceHover: "#e6def9",
    border: "#d9cdf2", text: "#4a1d52", muted: "#7c6a86",
    dark: false, navBg: "rgba(239,234,252,0.95)", heroBg: "#ffffff",
    accent: "#7d1f3f", accentText: "#ffffff", font: "editorial", button: "pill",
    palette: ["#f6eefb", "#b9a7e6", "#7c5fc0", "#8a1f3f"],
  },
  sunnyday: {
    name: "Sunny Day", category: "Playful",
    bg: "#f5d77a", surface: "#fffdf6", surfaceHover: "#f1e7c8",
    border: "#e6cf86", text: "#1c1c1a", muted: "#6f6a57",
    dark: false, navBg: "rgba(245,215,122,0.95)", heroBg: "#fffdf6",
    accent: "#16161a", accentText: "#ffffff", font: "rounded", button: "pill",
    palette: ["#efe9dc", "#3fa3a3", "#2f6fb0", "#16161a"],
  },
  // ── Bold ──────────────────────────────────────────────────────────────────
  tangerine: {
    name: "Tangerine", category: "Bold",
    bg: "#fbe1c7", surface: "#ffffff", surfaceHover: "#f6d3b1",
    border: "#eec59c", text: "#1a1a1a", muted: "#6b5d4e",
    dark: false, navBg: "rgba(251,225,199,0.95)", heroBg: "#ffffff",
    accent: "#f15a24", accentText: "#ffffff", font: "grotesk", button: "sharp",
    palette: ["#ffffff", "#f15a24", "#2a2622", "#1a1a1a"],
  },
  voltage: {
    name: "Voltage", category: "Bold",
    bg: "#e9eaec", surface: "#ffffff", surfaceHover: "#dee0e3",
    border: "#d0d3d8", text: "#16181d", muted: "#5e636d",
    dark: false, navBg: "rgba(233,234,236,0.95)", heroBg: "#ffffff",
    accent: "#2f53d8", accentText: "#ffffff", font: "grotesk", button: "pill",
    palette: ["#ffffff", "#c4c8cf", "#2f53d8", "#16181d"],
  },
  // ── Quirky ────────────────────────────────────────────────────────────────
  citrus: {
    name: "Citrus", category: "Quirky",
    bg: "#e7ef7a", surface: "#fbfcef", surfaceHover: "#dde66a",
    border: "#cdd75a", text: "#1d3a2a", muted: "#566a4e",
    dark: false, navBg: "rgba(231,239,122,0.95)", heroBg: "#fbfcef",
    accent: "#1d3a2a", accentText: "#ffffff", font: "grotesk", button: "pill",
    palette: ["#f1efe0", "#ffffff", "#d4452f", "#1d3a2a"],
  },
  bubblegum: {
    name: "Bubblegum", category: "Quirky",
    bg: "#f3c24b", surface: "#fffdf7", surfaceHover: "#edb733",
    border: "#e0ad3a", text: "#1a1a1a", muted: "#6e6450",
    dark: false, navBg: "rgba(243,194,75,0.95)", heroBg: "#fffdf7",
    accent: "#1a1a1a", accentText: "#ffffff", font: "display", button: "sharp",
    palette: ["#ffffff", "#f3b8c8", "#b06fd6", "#1a1a1a"],
  },
  // ── Innovative ────────────────────────────────────────────────────────────
  flux: {
    name: "Flux", category: "Innovative",
    bg: "#f3f4f6", surface: "#ffffff", surfaceHover: "#e9eaee",
    border: "#dcdee3", text: "#18181b", muted: "#62666f",
    dark: false, navBg: "rgba(243,244,246,0.95)", heroBg: "#ffffff",
    accent: "#ef5a2a", accentText: "#ffffff", font: "modern", button: "sharp",
    palette: ["#ffffff", "#ef5a2a", "#6b7280", "#18181b"],
  },
  monoedge: {
    name: "Mono Edge", category: "Innovative",
    bg: "#f7f7f8", surface: "#ffffff", surfaceHover: "#ededf0",
    border: "#dededf", text: "#0a0a0a", muted: "#5c5c63",
    dark: false, navBg: "rgba(247,247,248,0.95)", heroBg: "#ffffff",
    accent: "#0a0a0a", accentText: "#ffffff", font: "grotesk", button: "soft",
    palette: ["#ffffff", "#d4d4d8", "#3f3f46", "#0a0a0a"],
  },
};

export const FONT_STYLES: Record<string, { name: string; className: string }> = {
  modern:    { name: "Modern · Geist",          className: "font-sans" },
  grotesk:   { name: "Grotesk · Space Grotesk", className: "font-grotesk" },
  serif:     { name: "Serif · Playfair",        className: "font-serif" },
  editorial: { name: "Editorial · DM Serif",    className: "font-editorial" },
  elegant:   { name: "Elegant · Cormorant",     className: "font-elegant" },
  slab:      { name: "Slab · Roboto Slab",      className: "font-slab" },
  rounded:   { name: "Rounded · Quicksand",     className: "font-rounded" },
  playful:   { name: "Playful · Nunito",        className: "font-playful" },
  display:   { name: "Display · Syne",          className: "font-display" },
  mono:      { name: "Mono · Geist Mono",       className: "font-mono" },
};

export const BUTTON_STYLES: Record<string, { name: string; radius: string }> = {
  rounded: { name: "Rounded",  radius: "rounded-xl" },
  soft:    { name: "Soft",     radius: "rounded-2xl" },
  pill:    { name: "Pill",     radius: "rounded-full" },
  sharp:   { name: "Sharp",    radius: "rounded-md" },
  square:  { name: "Square",   radius: "rounded-none" },
};

export const CARD_STYLES: Record<string, { name: string; shadow: string; radius: string }> = {
  shadow:  { name: "Shadow",   shadow: "shadow-md hover:shadow-xl",  radius: "rounded-2xl" },
  border:  { name: "Border",   shadow: "shadow-none",                radius: "rounded-2xl" },
  minimal: { name: "Minimal",  shadow: "shadow-none",                radius: "rounded-xl"  },
  float:   { name: "Float",    shadow: "shadow-lg hover:shadow-2xl", radius: "rounded-3xl" },
  flat:    { name: "Flat",     shadow: "shadow-none",                radius: "rounded-none" },
};

export const LAYOUTS: Record<string, { name: string; cols: string }> = {
  grid:     { name: "Grid 4-col",  cols: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" },
  "6col":   { name: "Grid 6-col",  cols: "grid-cols-2 sm:grid-cols-4 lg:grid-cols-6" },
  "3col":   { name: "Grid 3-col",  cols: "grid-cols-2 sm:grid-cols-3" },
  "2col":   { name: "Grid 2-col",  cols: "grid-cols-1 sm:grid-cols-2" },
  compact:  { name: "Compact",     cols: "grid-cols-2 sm:grid-cols-4 lg:grid-cols-5" },
  list:     { name: "List",        cols: "grid-cols-1" },
  masonry:  { name: "Masonry",     cols: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" },
  featured: { name: "Featured",    cols: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" },
  carousel: { name: "Carousel",    cols: "" },
};

export const HERO_STYLES: Record<string, { name: string; desc: string }> = {
  storefront: { name: "Storefront",   desc: "Bold centered hero – Shopify Dawn style" },
  showcase:   { name: "Showcase",     desc: "Headline & CTA left · image card right" },
  marquee:    { name: "Marquee",      desc: "Full-bleed image with big scrolling text" },
  editorial:  { name: "Editorial",    desc: "Large headline above a wide image" },
  product:    { name: "Product Hero", desc: "Bold text over a full-bleed image" },
  cover:      { name: "Cover Photo",  desc: "Banner with text overlay at the bottom" },
  centered:   { name: "Centered",     desc: "Logo & text center-aligned" },
  split:      { name: "Split",        desc: "Logo left, details right" },
  minimal:    { name: "Minimal Bar",  desc: "Slim header, more product space" },
};

export const NAV_STYLES: Record<string, { name: string; desc: string }> = {
  default:               { name: "Default",               desc: "Standard solid nav" },
  transparent:           { name: "Transparent",           desc: "Blurred glass over hero" },
  colored:               { name: "Colored",               desc: "Accent-colored nav bar" },
  "transparent-colored": { name: "Transparent + Colored", desc: "Clear over hero, accent color on scroll" },
  minimal:               { name: "Minimal",               desc: "No border, ultra-clean" },
};

export const NAV_HEIGHTS: Record<string, { name: string; px: number }> = {
  compact: { name: "Compact", px: 44 },
  default: { name: "Default", px: 56 },
  tall:    { name: "Tall",    px: 72 },
  xl:      { name: "XL",      px: 88 },
};

export const IMAGE_RATIOS: Record<string, { name: string; cls: string }> = {
  square:    { name: "Square 1:1",     cls: "aspect-square" },
  portrait:  { name: "Portrait 3:4",   cls: "aspect-[3/4]" },
  landscape: { name: "Landscape 4:3",  cls: "aspect-[4/3]" },
  wide:      { name: "Wide 16:9",      cls: "aspect-video" },
};

export const BACKGROUND_EFFECTS: Record<string, { name: string }> = {
  none:     { name: "None" },
  dots:     { name: "Dots" },
  lines:    { name: "Grid Lines" },
  gradient: { name: "Radial Glow" },
};

export const FOOTER_STYLES: Record<string, { name: string }> = {
  standard: { name: "Standard" },
  compact:  { name: "Compact" },
  none:     { name: "Hidden" },
};

export interface CustomButton {
  id: string;
  label: string;
  url: string;
  style: "primary" | "outline" | "ghost";
  pageType?: "about" | "contact" | "faq" | "portfolio" | "products";
}

// Extra text / button blocks a creator can add to the hero, in order.
export interface HeroItem {
  id: string;
  type: "text" | "button";
  text: string;                                  // text content, or button label
  url?: string;                                  // button link (type "button")
  style?: "primary" | "outline" | "ghost";       // button style
  size?: "sm" | "md" | "lg";                     // text size
}

export interface StoreSettings {
  name: string | null;
  tagline: string | null;
  bannerImage: string | null;
  logoImage: string | null;
  theme: string;
  primaryColor: string;
  buttonStyle: string;
  fontStyle: string;
  layout: string;
  carouselRows: number;
  carouselAutoplay: boolean;
  cardStyle: string;
  announcementText: string | null;
  announcementColor: string;
  showRatings: boolean;
  featuredIds: string[];
  socialLinks: Record<string, string>;
  policies: { shipping?: string; returns?: string; privacy?: string };
  heroStyle: string;
  heroHeading: string | null;
  heroSubheading: string | null;
  heroMarqueeText: string | null;
  navStyle: string;
  navHeight: string;
  imageRatio: string;
  showProductCount: boolean;
  showFilters: boolean;
  sectionTitle: string | null;
  footerStyle: string;
  backgroundEffect: string;
  heroSize: string;
  heroTextAlign: string;
  ctaText: string | null;
  showNewsletter: boolean;
  heroOverlay: number;
  customButtons: CustomButton[];
  heroItems: HeroItem[];
  heroCtaPos: string;
  elementPositions: Record<string, { x: number; y: number }>;
  storePages: {
    about?:   { title?: string; content?: string };
    contact?: { title?: string; content?: string };
    faq?:     { title?: string; items?: { q: string; a: string }[] };
  };
  // Header & ticker
  stickyHeader: boolean;
  tickerEnabled: boolean;
  tickerText: string | null;
  tickerSpeed: string;
  // Product card
  showSaleBadge: boolean;
  showNewBadge: boolean;
  showQuickAdd: boolean;
  showProductType: boolean;
  showTrustBar: boolean;
  trustBadges: string[];
  // SEO
  seoTitle: string | null;
  seoDescription: string | null;
  favicon: string | null;
  // Advanced
  customCss: string | null;
  typographyScale: string;
  // Integrations / tracking
  googleAnalyticsId: string | null;
  metaPixelId: string | null;
  customHeadCode: string | null;
  customBodyCode: string | null;
  // Cart
  showFreeShippingBar: boolean;
  freeShippingThreshold: number;
  freeShippingText: string;        // the reward wording, e.g. "free shipping", "a free gift"
  localPickupOnly: boolean;        // sell locally only: no shipping, buyers pick up in person
  localPickupNote: string | null;  // pickup location / instructions shown to buyers
  cartNote: boolean;
  cartBehavior: "drawer" | "page";
  lowStockThreshold: number;
  // Product features
  showShareButtons: boolean;
  showWishlist: boolean;
  showProductZoom: boolean;
  stockBadge: boolean;
  stockBadgeThreshold: number;
  // Footer
  showPaymentIcons: boolean;
  // Popup
  popupEnabled: boolean;
  popupTitle: string | null;
  popupDelay: number;
  // Sections
  testimonialsEnabled: boolean;
  testimonialItems: { id: string; text: string; author: string; role: string; rating: number }[];
  imageBannerEnabled: boolean;
  imageBannerHeading: string | null;
  imageBannerText: string | null;
  imageBannerImage: string | null;
  imageBannerCtaText: string | null;
  imageBannerLayout: "left" | "right";
  iconRowEnabled: boolean;
  iconRowItems: { id: string; icon: string; title: string; text: string }[];
  // Drag-and-drop section builder (ordered blocks), per page.
  homeSections: import("@/lib/store-sections").StoreSection[];
  collectionSections: import("@/lib/store-sections").StoreSection[];
  productSections: import("@/lib/store-sections").StoreSection[];
  homeLayout: import("@/lib/store-sections").LayoutItem[];
  customPages: import("@/lib/store-sections").CustomPage[];
  // Product page layout customization.
  productGalleryStyle: "thumbnails" | "stacked" | "grid";
  productInfoLayout: "accordion" | "tabs";
  showRelatedProducts: boolean;
  relatedProductsCount: number;
  // Markets / multi-currency display.
  baseCurrency: string;
  enabledCurrencies: string[];
  showCurrencySwitcher: boolean;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  name: null, tagline: null, bannerImage: null, logoImage: null,
  theme: "default", primaryColor: "#29abe2",
  buttonStyle: "rounded", fontStyle: "modern", layout: "grid", carouselRows: 1, carouselAutoplay: false, cardStyle: "shadow",
  announcementText: null, announcementColor: "#29abe2",
  showRatings: true, featuredIds: [], socialLinks: {}, policies: {},
  heroStyle: "storefront", heroHeading: null, heroSubheading: null, heroMarqueeText: null,
  navStyle: "default", navHeight: "default", imageRatio: "square",
  showProductCount: true, showFilters: true, sectionTitle: null,
  footerStyle: "standard", backgroundEffect: "none",
  heroSize: "large", heroTextAlign: "left", ctaText: null, showNewsletter: false, heroOverlay: 50,
  customButtons: [],
  heroItems: [],
  heroCtaPos: "top-right",
  elementPositions: {},
  storePages: {},
  stickyHeader: true,
  tickerEnabled: false,
  tickerText: null,
  tickerSpeed: "normal",
  showSaleBadge: true,
  showNewBadge: false,
  showQuickAdd: true,
  showProductType: true,
  showTrustBar: true,
  trustBadges: [],
  seoTitle: null,
  seoDescription: null,
  favicon: null,
  customCss: null,
  typographyScale: "normal",
  googleAnalyticsId: null,
  metaPixelId: null,
  customHeadCode: null,
  customBodyCode: null,
  showFreeShippingBar: false,
  freeShippingThreshold: 50,
  freeShippingText: "free shipping",
  localPickupOnly: false,
  localPickupNote: null,
  cartNote: false,
  cartBehavior: "drawer",
  lowStockThreshold: 5,
  showShareButtons: true,
  showWishlist: false,
  showProductZoom: true,
  stockBadge: true,
  stockBadgeThreshold: 5,
  showPaymentIcons: true,
  popupEnabled: false,
  popupTitle: null,
  popupDelay: 5,
  testimonialsEnabled: false,
  testimonialItems: [],
  imageBannerEnabled: false,
  imageBannerHeading: null,
  imageBannerText: null,
  imageBannerImage: null,
  imageBannerCtaText: null,
  imageBannerLayout: "left",
  iconRowEnabled: false,
  iconRowItems: [],
  homeSections: [],
  collectionSections: [],
  productSections: [],
  homeLayout: [],
  customPages: [],
  productGalleryStyle: "thumbnails",
  productInfoLayout: "accordion",
  showRelatedProducts: true,
  relatedProductsCount: 4,
  baseCurrency: "USD",
  enabledCurrencies: [],
  showCurrencySwitcher: false,
};

// h is a CSS height value applied via inline style, avoids Tailwind purging dynamic class strings
// pb is the bottom padding (px) for the hero content div so content fits within the fixed height
export const HERO_SIZES: Record<string, { name: string; h: string; pb: number; previewH: number }> = {
  fullscreen: { name: "Full Screen", h: "100vh", pb: 80, previewH: 160 },
  large:      { name: "Large",       h: "75vh",  pb: 64, previewH: 110 },
  medium:     { name: "Medium",      h: "55vh",  pb: 48, previewH: 80  },
  small:      { name: "Small",       h: "35vh",  pb: 24, previewH: 56  },
  banner:     { name: "Banner",      h: "220px", pb: 16, previewH: 44  },
};

export const HERO_TEXT_ALIGNS: Record<string, { name: string; cls: string }> = {
  left:   { name: "Left",   cls: "items-start text-left"   },
  center: { name: "Center", cls: "items-center text-center" },
  right:  { name: "Right",  cls: "items-end text-right"    },
};

// Style + content presets. A template sets the look (palette, font, hero, grid)
// AND a full starter composition: header chrome (announcement, moving-text
// ticker, trust badges, icon row) plus a tailored homepage layout of sections
// (media banners, galleries, testimonials, FAQ, video, moving text, newsletter).
// Personal fields (name/bio/images/socials/policies) are intentionally never set.
export type StoreTemplate = {
  id: string;
  name: string;
  desc: string;
  tags: string[];
  accent: string;       // preview color (same as primaryColor in settings)
  settings: Partial<StoreSettings>;
};

// ── Template content building blocks ─────────────────────────────────────────
// Demo media used in starter content. These are well-known royalty-free Unsplash
// photos; the store owner replaces them in the editor. If one ever fails to load
// the section still shows its heading/text, so templates degrade gracefully.
const IMG = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&q=80`;
const DEMO = {
  storefront: IMG("1441986300917-64674bd600d8"),
  fashion:    IMG("1483985988355-763728e1935b"),
  audio:      IMG("1505740420928-5e560c06d30e"),
  shoe:       IMG("1542291026-7eec264c27ff"),
  watch:      IMG("1523275335684-37898b6baf30"),
  camera:     IMG("1526170375885-4d8ecf77b99f"),
  apparel:    IMG("1489987707025-afc232f7ea0f"),
  desk:       IMG("1497366216548-37526070297c"),
  plant:      IMG("1485955900006-10f4d324d411"),
};

const core = (c: CoreLayoutItem["core"]): CoreLayoutItem => ({ id: "core_" + c, core: c });

// Each helper bakes in art-directed defaults — width, spacing and background —
// so the templates have a deliberate visual rhythm (full-bleed moving text,
// wide media, airy centered copy, soft "surface" bands for social proof).

// Moving text — a bold, edge-to-edge animated marquee band.
const marquee = (id: string, text: string, opts?: { size?: "md" | "lg" | "xl"; curved?: boolean; speed?: "slow" | "normal" | "fast" }): BlocksSection => ({
  id, type: "blocks", width: "full", bg: "surface", padTop: "lg", padBottom: "lg",
  blocks: [{ id: id + "_m", type: "marquee", text, size: opts?.size ?? "xl", speed: opts?.speed ?? "normal", direction: "left", curved: opts?.curved ?? false }],
});
const banner = (id: string, heading: string, subtext: string, image: string, align: "left" | "center" = "center"): BannerSection =>
  ({ id, type: "banner", width: "wide", padTop: "lg", padBottom: "lg", heading, subtext, ctaLabel: "Shop now", ctaUrl: "#products", image, align });
const gallery = (id: string, heading: string, images: string[], columns: 2 | 3 | 4 = 3): GallerySection =>
  ({ id, type: "gallery", width: "wide", padTop: "lg", padBottom: "lg", heading, images, layout: "grid", columns, aspect: "square", gap: "md" });
const richtext = (id: string, heading: string, body: string): RichTextSection =>
  ({ id, type: "richtext", width: "narrow", padTop: "xl", padBottom: "xl", heading, body, align: "center" });
const testimonials = (id: string, heading: string, items: TestimonialsSection["items"]): TestimonialsSection =>
  ({ id, type: "testimonials", width: "normal", bg: "surface", padTop: "xl", padBottom: "xl", heading, items });
const faq = (id: string, items: FaqSection["items"]): FaqSection =>
  ({ id, type: "faq", width: "narrow", padTop: "lg", padBottom: "lg", heading: "Frequently asked questions", items });
const newsletter = (id: string, heading: string, subtext: string): NewsletterSection =>
  ({ id, type: "newsletter", width: "normal", bg: "surface", padTop: "xl", padBottom: "xl", heading, subtext, buttonLabel: "Subscribe" });

const REVIEWS_A: TestimonialsSection["items"] = [
  { name: "Alex M.", quote: "Incredible quality and the fastest shipping I've had. Already ordered again.", rating: 5 },
  { name: "Jordan P.", quote: "Exactly as pictured and beautifully made. Exceeded my expectations.", rating: 5 },
  { name: "Sam R.", quote: "Customer service was lovely and the packaging felt premium. 10/10.", rating: 5 },
];
const REVIEWS_B: TestimonialsSection["items"] = [
  { name: "Riley T.", quote: "Obsessed. The attention to detail is unreal for the price.", rating: 5 },
  { name: "Casey L.", quote: "Shipped fast, looks even better in person. Highly recommend.", rating: 5 },
];
const FAQ_A: FaqSection["items"] = [
  { q: "How long does shipping take?", a: "Most orders ship within 1–2 business days and arrive in 3–5 days." },
  { q: "What's your return policy?", a: "Free returns within 30 days, no questions asked." },
  { q: "Do you ship internationally?", a: "Yes, we ship worldwide. Rates are calculated at checkout." },
];
const ICON_ROW_DEFAULT: StoreSettings["iconRowItems"] = [
  { id: "ir1", icon: "🚚", title: "Fast, free shipping", text: "On every order over $75" },
  { id: "ir2", icon: "↩️", title: "Easy 30-day returns", text: "Changed your mind? No problem" },
  { id: "ir3", icon: "🔒", title: "Secure checkout", text: "Encrypted & protected" },
  { id: "ir4", icon: "💬", title: "Real human support", text: "We reply within a day" },
];

// Header chrome + commerce extras shared by every template (owners can tweak any
// of it). Each template overrides the text/marquee to match its personality.
const CHROME: Partial<StoreSettings> = {
  stickyHeader: true,
  tickerEnabled: true,
  tickerSpeed: "normal",
  showTrustBar: true,
  trustBadges: ["Fast shipping", "Secure checkout", "30-day returns", "5-star rated"],
  // Icon row is intentionally left off in templates (kept available so owners
  // can switch it on themselves; the starter items stay ready for when they do).
  iconRowEnabled: false,
  iconRowItems: ICON_ROW_DEFAULT,
  // Free-shipping bar is opt-in: templates leave it OFF (the owner enables it and
  // sets their own threshold under Cart settings). A default threshold is still
  // seeded so it's ready when they turn it on.
  showFreeShippingBar: false,
  freeShippingThreshold: 50,
  showNewBadge: true,
  showSaleBadge: true,
  showWishlist: true,
  showShareButtons: true,
  showRatings: true,
  showQuickAdd: true,
};

// Starter templates, each is a full storefront look built on one of the themes.
// Applying a template sets palette, font, button, hero layout and grid together.
export const STORE_TEMPLATES: StoreTemplate[] = [
  {
    id: "reflect",
    name: "Reflect",
    desc: "Bold typographic hero, scrolling marquee, gallery & reviews",
    tags: ["Bold", "Typographic", "Modern"],
    accent: "#111113",
    settings: {
      theme: "default", primaryColor: "#111113", buttonStyle: "sharp", fontStyle: "grotesk",
      layout: "grid", cardStyle: "flat", heroStyle: "editorial", navStyle: "minimal",
      imageRatio: "square", backgroundEffect: "none", heroSize: "large",
      ...CHROME,
      announcementText: "New season just dropped — free shipping over $75",
      tickerText: "NEW DROP ✦ FREE SHIPPING ✦ LIMITED RUN ✦ SHOP NOW",
      bannerImage: DEMO.apparel, heroOverlay: 48,
      heroHeading: "Designed to stand out.",
      heroSubheading: "A tightly-curated collection, made to last.",
      ctaText: "Shop the collection",
      homeLayout: [
        core("hero"),
        marquee("reflect_mq", "DESIGN · BUILD · SHIP · REPEAT", { size: "xl" }),
        core("products"),
        banner("reflect_banner", "The signature drop", "Limited quantities, once they're gone they're gone.", DEMO.fashion, "center"),
        testimonials("reflect_rev", "Loved by thousands", REVIEWS_A),
        faq("reflect_faq", FAQ_A),
        newsletter("reflect_news", "Be first to know", "Join the list for early access to every drop."),
      ] as LayoutItem[],
    },
  },
  {
    id: "gallery",
    name: "Gallery",
    desc: "Full-bleed marquee hero with a photo gallery & story",
    tags: ["Minimal", "Photography", "Gallery"],
    accent: "#0a0a0a",
    settings: {
      theme: "monoedge", primaryColor: "#0a0a0a", buttonStyle: "soft", fontStyle: "grotesk",
      layout: "masonry", cardStyle: "flat", heroStyle: "marquee", navStyle: "transparent",
      imageRatio: "portrait", backgroundEffect: "none", heroSize: "large",
      ...CHROME,
      announcementText: "Worldwide shipping now available",
      tickerText: "PHOTOGRAPHY ✦ PRINTS ✦ ORIGINALS ✦ MADE TO ORDER",
      heroMarqueeText: "THE COLLECTION",
      bannerImage: DEMO.fashion, heroOverlay: 55,
      heroHeading: "The Collection",
      heroSubheading: "Every piece, shot in natural light.",
      ctaText: "Browse prints",
      homeLayout: [
        core("hero"),
        gallery("gallery_g", "Featured work", [DEMO.camera, DEMO.desk, DEMO.plant, DEMO.fashion, DEMO.apparel, DEMO.storefront], 3),
        core("products"),
        richtext("gallery_story", "About the studio", "Each print is produced in small batches on archival paper and shipped flat, ready to frame."),
        testimonials("gallery_rev", "Kind words", REVIEWS_B),
        newsletter("gallery_news", "Stay in frame", "New prints and restocks, straight to your inbox."),
      ] as LayoutItem[],
    },
  },
  {
    id: "atelier",
    name: "Atelier",
    desc: "Refined serif editorial with story, media banner & FAQ",
    tags: ["Editorial", "Serif", "Fine Art"],
    accent: "#1f9d63",
    settings: {
      theme: "evergreen", primaryColor: "#1f9d63", buttonStyle: "sharp", fontStyle: "serif",
      layout: "grid", cardStyle: "minimal", heroStyle: "editorial", navStyle: "default",
      imageRatio: "portrait", backgroundEffect: "none", heroSize: "large",
      ...CHROME,
      announcementText: "Handmade to order — thank you for supporting small",
      tickerText: "HANDCRAFTED ✦ SMALL BATCH ✦ ETHICALLY MADE",
      bannerImage: DEMO.desk, heroOverlay: 42,
      heroHeading: "Quietly considered.",
      heroSubheading: "Heirloom pieces, made by hand.",
      ctaText: "Explore the atelier",
      homeLayout: [
        core("hero"),
        richtext("atelier_story", "Our craft", "We work in small batches with natural materials, so every piece carries the marks of the maker."),
        core("products"),
        banner("atelier_banner", "Made to be kept", "Timeless design, built to outlast trends.", DEMO.apparel, "left"),
        testimonials("atelier_rev", "From our customers", REVIEWS_A),
        faq("atelier_faq", FAQ_A),
        newsletter("atelier_news", "Join the atelier", "Occasional letters on new work and restocks."),
      ] as LayoutItem[],
    },
  },
  {
    id: "boutique",
    name: "Boutique",
    desc: "Warm sandstone with image card, gallery & glowing reviews",
    tags: ["Sophisticated", "Boutique", "Warm"],
    accent: "#2a241d",
    settings: {
      theme: "sandstone", primaryColor: "#2a241d", buttonStyle: "pill", fontStyle: "elegant",
      layout: "grid", cardStyle: "minimal", heroStyle: "showcase", navStyle: "default",
      imageRatio: "portrait", backgroundEffect: "none", heroSize: "large",
      ...CHROME,
      announcementText: "Complimentary gift wrap on every order",
      tickerText: "NEW IN ✦ BESTSELLERS ✦ GIFTING ✦ FREE WRAP",
      bannerImage: DEMO.fashion, heroOverlay: 40,
      heroHeading: "Everyday luxury.",
      heroSubheading: "Pieces that feel as good as they look.",
      ctaText: "Shop bestsellers",
      homeLayout: [
        core("hero"),
        core("products"),
        gallery("boutique_g", "As seen on you", [DEMO.fashion, DEMO.apparel, DEMO.watch], 3),
        banner("boutique_banner", "The gifting edit", "Beautifully wrapped, ready to give.", DEMO.watch, "center"),
        testimonials("boutique_rev", "Why they keep coming back", REVIEWS_A),
        newsletter("boutique_news", "Members get more", "Early access, private sales and 10% off your first order."),
      ] as LayoutItem[],
    },
  },
  {
    id: "studio",
    name: "Studio",
    desc: "Soft terracotta split hero, moving text & lookbook gallery",
    tags: ["Sophisticated", "Calm", "Serif"],
    accent: "#c98064",
    settings: {
      theme: "terracotta", primaryColor: "#c98064", buttonStyle: "pill", fontStyle: "serif",
      layout: "grid", cardStyle: "shadow", heroStyle: "split", navStyle: "default",
      imageRatio: "square", backgroundEffect: "none", heroSize: "medium",
      ...CHROME,
      announcementText: "Spring collection now live",
      tickerText: "SLOW MADE ✦ NATURAL TONES ✦ SMALL STUDIO",
      bannerImage: DEMO.desk, heroOverlay: 38,
      heroHeading: "Made in the studio.",
      heroSubheading: "Calm, tactile, and built to last.",
      ctaText: "Shop the studio",
      homeLayout: [
        core("hero"),
        marquee("studio_mq", "soft · tactile · timeless · made by hand", { size: "lg", curved: true }),
        core("products"),
        gallery("studio_g", "The lookbook", [DEMO.desk, DEMO.plant, DEMO.apparel, DEMO.fashion], 2),
        richtext("studio_story", "Slow by design", "We make a little, well. Everything is produced in our studio in small, seasonal runs."),
        testimonials("studio_rev", "Studio love", REVIEWS_B),
        newsletter("studio_news", "Join the studio list", "Seasonal drops and studio notes."),
      ] as LayoutItem[],
    },
  },
  {
    id: "coastal",
    name: "Coastal",
    desc: "Friendly slate-blue storefront with trust row & FAQ",
    tags: ["Friendly", "Clean", "Blue"],
    accent: "#5b7a8c",
    settings: {
      theme: "harbor", primaryColor: "#5b7a8c", buttonStyle: "pill", fontStyle: "grotesk",
      layout: "grid", cardStyle: "shadow", heroStyle: "storefront", navStyle: "default",
      imageRatio: "square", backgroundEffect: "none", heroSize: "large",
      ...CHROME,
      announcementText: "Free shipping on orders over $75",
      tickerText: "NEW ARRIVALS ✦ FREE SHIPPING ✦ EASY RETURNS",
      bannerImage: DEMO.storefront, heroOverlay: 50,
      heroHeading: "Everything you need, beautifully simple.",
      heroSubheading: "Thoughtfully made goods for everyday.",
      ctaText: "Start shopping",
      homeLayout: [
        core("hero"),
        core("products"),
        banner("coastal_banner", "New this week", "Fresh arrivals, ready to ship today.", DEMO.storefront, "center"),
        testimonials("coastal_rev", "What people say", REVIEWS_A),
        faq("coastal_faq", FAQ_A),
        newsletter("coastal_news", "Get the good stuff", "Deals and new arrivals, no spam."),
      ] as LayoutItem[],
    },
  },
  {
    id: "meadow",
    name: "Meadow",
    desc: "Earthy green slab type, story, gallery & moving text",
    tags: ["Friendly", "Nature", "Organic"],
    accent: "#1f3326",
    settings: {
      theme: "meadow", primaryColor: "#1f3326", buttonStyle: "pill", fontStyle: "slab",
      layout: "grid", cardStyle: "border", heroStyle: "showcase", navStyle: "default",
      imageRatio: "square", backgroundEffect: "none", heroSize: "large",
      ...CHROME,
      announcementText: "Plastic-free packaging on every order 🌱",
      tickerText: "SUSTAINABLE ✦ PLASTIC-FREE ✦ MADE TO LAST",
      bannerImage: DEMO.plant, heroOverlay: 45,
      heroHeading: "Good for you, kinder to the planet.",
      heroSubheading: "Naturally made, responsibly sourced.",
      ctaText: "Shop sustainably",
      homeLayout: [
        core("hero"),
        marquee("meadow_mq", "GROWN · GATHERED · GIVEN BACK", { size: "lg" }),
        core("products"),
        richtext("meadow_story", "Rooted in good", "1% of every order goes back to reforestation. Better products, better planet."),
        gallery("meadow_g", "From our world", [DEMO.plant, DEMO.desk, DEMO.storefront], 3),
        testimonials("meadow_rev", "Growing community", REVIEWS_B),
        newsletter("meadow_news", "Plant a seed with us", "Join for tips, drops and good news."),
      ] as LayoutItem[],
    },
  },
  {
    id: "grape",
    name: "Grape Soda",
    desc: "Playful lavender & maroon with marquee, media & reviews",
    tags: ["Playful", "Bold", "Purple"],
    accent: "#7d1f3f",
    settings: {
      theme: "grape", primaryColor: "#7d1f3f", buttonStyle: "pill", fontStyle: "editorial",
      layout: "grid", cardStyle: "shadow", heroStyle: "showcase", navStyle: "colored",
      imageRatio: "portrait", backgroundEffect: "none", heroSize: "large",
      ...CHROME,
      announcementText: "Buy 2, get 1 free — this week only 🍇",
      tickerText: "FRESH ✦ FIZZY ✦ FUN ✦ SHOP THE DROP",
      bannerImage: DEMO.shoe, heroOverlay: 48,
      heroHeading: "Pop into something fun.",
      heroSubheading: "Bold flavors, brighter days.",
      ctaText: "Grab yours",
      homeLayout: [
        core("hero"),
        marquee("grape_mq", "FRESH · FIZZY · FUN · LIMITED EDITION", { size: "xl", speed: "fast" }),
        core("products"),
        banner("grape_banner", "Mix your own pack", "Build a bundle and save 15%.", DEMO.shoe, "center"),
        testimonials("grape_rev", "The fan club", REVIEWS_A),
        newsletter("grape_news", "Join the fizz club", "First dibs on every new flavor."),
      ] as LayoutItem[],
    },
  },
  {
    id: "sunny",
    name: "Sunny Day",
    desc: "Cheerful rounded type, gallery, moving text & sign-up",
    tags: ["Playful", "Bright", "Friendly"],
    accent: "#16161a",
    settings: {
      theme: "sunnyday", primaryColor: "#16161a", buttonStyle: "pill", fontStyle: "rounded",
      layout: "grid", cardStyle: "shadow", heroStyle: "storefront", navStyle: "colored",
      imageRatio: "square", backgroundEffect: "none", heroSize: "large",
      ...CHROME,
      announcementText: "Spread sunshine — free sticker in every order ☀️",
      tickerText: "GOOD VIBES ✦ FAST SHIPPING ✦ HAPPY RETURNS",
      bannerImage: DEMO.shoe, heroOverlay: 42,
      heroHeading: "Brighten up your day.",
      heroSubheading: "Feel-good goods made to make you smile.",
      ctaText: "Shop happy",
      homeLayout: [
        core("hero"),
        core("products"),
        gallery("sunny_g", "Made you smile", [DEMO.shoe, DEMO.apparel, DEMO.fashion], 3),
        marquee("sunny_mq", "smile · shine · repeat", { size: "lg", curved: true }),
        testimonials("sunny_rev", "Happy customers", REVIEWS_A),
        newsletter("sunny_news", "Get a little sunshine", "Deals and drops with a smile."),
      ] as LayoutItem[],
    },
  },
  {
    id: "tangerine",
    name: "Tangerine",
    desc: "High-impact orange, big marquee, media banner & reviews",
    tags: ["Bold", "Energetic", "Orange"],
    accent: "#f15a24",
    settings: {
      theme: "tangerine", primaryColor: "#f15a24", buttonStyle: "sharp", fontStyle: "grotesk",
      layout: "grid", cardStyle: "flat", heroStyle: "product", navStyle: "colored",
      imageRatio: "square", backgroundEffect: "none", heroSize: "large",
      ...CHROME,
      announcementText: "Drop ends Sunday — don't sleep on it",
      tickerText: "SALE ✦ SALE ✦ SALE ✦ UP TO 40% OFF",
      bannerImage: DEMO.audio, heroOverlay: 50,
      heroHeading: "Turn it up.",
      heroSubheading: "Gear that performs as hard as you do.",
      ctaText: "Shop the drop",
      homeLayout: [
        core("hero"),
        marquee("tang_mq", "UP TO 40% OFF · WHILE STOCKS LAST · NO CODE NEEDED", { size: "xl", speed: "fast" }),
        core("products"),
        banner("tang_banner", "The performance line", "Built for speed, made to last.", DEMO.audio, "left"),
        testimonials("tang_rev", "The hype is real", REVIEWS_A),
        faq("tang_faq", FAQ_A),
        newsletter("tang_news", "Don't miss a drop", "Get every release before it sells out."),
      ] as LayoutItem[],
    },
  },
  {
    id: "voltage",
    name: "Voltage",
    desc: "Electric-blue tech look with marquee hero, specs & gallery",
    tags: ["Bold", "Tech", "Blue"],
    accent: "#2f53d8",
    settings: {
      theme: "voltage", primaryColor: "#2f53d8", buttonStyle: "pill", fontStyle: "grotesk",
      layout: "grid", cardStyle: "border", heroStyle: "marquee", navStyle: "minimal",
      imageRatio: "square", backgroundEffect: "none", heroSize: "large",
      ...CHROME,
      announcementText: "Next-day delivery available at checkout",
      tickerText: "ENGINEERED ✦ TESTED ✦ GUARANTEED ✦ SHIP TODAY",
      heroMarqueeText: "BUILT DIFFERENT",
      bannerImage: DEMO.camera, heroOverlay: 55,
      heroHeading: "Built different.",
      heroSubheading: "Precision gear, engineered to perform.",
      ctaText: "Shop tech",
      homeLayout: [
        core("hero"),
        core("products"),
        banner("voltage_banner", "Inside the build", "Premium components, obsessive quality control.", DEMO.audio, "center"),
        gallery("voltage_g", "In the wild", [DEMO.camera, DEMO.audio, DEMO.desk], 3),
        testimonials("voltage_rev", "Trusted by makers", REVIEWS_B),
        faq("voltage_faq", FAQ_A),
        newsletter("voltage_news", "Join the early-access list", "Be first to get new releases & restocks."),
      ] as LayoutItem[],
    },
  },
  {
    id: "citrus",
    name: "Citrus",
    desc: "Punchy lime editorial with story, moving text & gallery",
    tags: ["Quirky", "Fresh", "Green"],
    accent: "#1d3a2a",
    settings: {
      theme: "citrus", primaryColor: "#1d3a2a", buttonStyle: "pill", fontStyle: "grotesk",
      layout: "grid", cardStyle: "flat", heroStyle: "editorial", navStyle: "colored",
      imageRatio: "square", backgroundEffect: "none", heroSize: "large",
      ...CHROME,
      announcementText: "Fresh batch just dropped 🍋",
      tickerText: "ZESTY ✦ FRESH ✦ SMALL BATCH ✦ SHOP NOW",
      bannerImage: DEMO.plant, heroOverlay: 45,
      heroHeading: "Freshly squeezed.",
      heroSubheading: "Bright, zingy goods made in small batches.",
      ctaText: "Taste the drop",
      homeLayout: [
        core("hero"),
        marquee("citrus_mq", "ZESTY · FRESH · SMALL BATCH · MADE TODAY", { size: "xl" }),
        core("products"),
        richtext("citrus_story", "Squeezed fresh", "We make everything in tiny batches so it's always at peak freshness."),
        gallery("citrus_g", "Fresh picks", [DEMO.plant, DEMO.desk, DEMO.storefront], 3),
        testimonials("citrus_rev", "Word on the street", REVIEWS_B),
        newsletter("citrus_news", "Get the fresh list", "New batches and flash deals."),
      ] as LayoutItem[],
    },
  },
  {
    id: "nocturne",
    name: "Nocturne",
    desc: "Moody dark mode with neon marquee, media & big reviews",
    tags: ["Bold", "Dark", "Premium"],
    accent: "#7c5cff",
    settings: {
      theme: "monoedge", primaryColor: "#7c5cff", buttonStyle: "soft", fontStyle: "grotesk",
      layout: "grid", cardStyle: "shadow", heroStyle: "product", navStyle: "transparent",
      imageRatio: "portrait", backgroundEffect: "none", heroSize: "fullscreen",
      ...CHROME,
      announcementText: "After-dark drop — members get 24h early access",
      tickerText: "AFTER DARK ✦ LIMITED ✦ MEMBERS FIRST ✦ SHOP NOW",
      bannerImage: DEMO.watch, heroOverlay: 60,
      heroHeading: "For the after hours.",
      heroSubheading: "Premium essentials with a dark edge.",
      ctaText: "Enter the drop",
      homeLayout: [
        core("hero"),
        marquee("noct_mq", "AFTER DARK · MEMBERS FIRST · LIMITED RUN", { size: "xl", speed: "slow" }),
        core("products"),
        banner("noct_banner", "The midnight edit", "Limited pieces, dropped at midnight.", DEMO.watch, "center"),
        gallery("noct_g", "Shot after dark", [DEMO.audio, DEMO.camera, DEMO.watch], 3),
        testimonials("noct_rev", "The members club", REVIEWS_A),
        newsletter("noct_news", "Join the members list", "24-hour early access to every drop."),
      ] as LayoutItem[],
    },
  },
  {
    id: "bloom",
    name: "Bloom",
    desc: "Soft pastel boutique with curved moving text & lookbook",
    tags: ["Playful", "Pastel", "Soft"],
    accent: "#e0719c",
    settings: {
      theme: "sandstone", primaryColor: "#e0719c", buttonStyle: "pill", fontStyle: "rounded",
      layout: "grid", cardStyle: "minimal", heroStyle: "showcase", navStyle: "default",
      imageRatio: "portrait", backgroundEffect: "none", heroSize: "large",
      ...CHROME,
      announcementText: "Treat yourself — free mini gift over $50 🎀",
      tickerText: "NEW IN ✦ SELF-CARE ✦ LITTLE LUXURIES ✦ GIFTING",
      bannerImage: DEMO.fashion, heroOverlay: 38,
      heroHeading: "Bloom into it.",
      heroSubheading: "Soft, pretty things made to be loved.",
      ctaText: "Shop the collection",
      homeLayout: [
        core("hero"),
        marquee("bloom_mq", "soft · pretty · made with love", { size: "lg", curved: true }),
        core("products"),
        gallery("bloom_g", "The lookbook", [DEMO.fashion, DEMO.apparel, DEMO.plant, DEMO.desk], 2),
        banner("bloom_banner", "The self-care edit", "Little luxuries for everyday moments.", DEMO.plant, "left"),
        testimonials("bloom_rev", "Spreading the love", REVIEWS_A),
        newsletter("bloom_news", "Join the bloom club", "Sweet deals and new arrivals."),
      ] as LayoutItem[],
    },
  },
];

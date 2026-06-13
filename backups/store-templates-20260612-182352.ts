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
  stickyAddToCart: boolean;   // floating buy bar once the main button scrolls away
  cartCrossSell: boolean;     // "You might also like" recommendations in the cart
  showBuyNow: boolean;        // direct "Buy now" checkout button on product pages
  productTrustBadges: boolean; // secure-checkout/returns/shipping row on product pages
  savedSections: import("@/lib/store-sections").StoreSection[];  // reusable saved sections
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
  stickyAddToCart: false,
  cartCrossSell: false,
  showBuyNow: true,
  productTrustBadges: true,
  savedSections: [],
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
  // Conversion: keep the buy button reachable on long product pages, and
  // suggest one more item in the cart.
  stickyAddToCart: true,
  cartCrossSell: true,
};

// ── Premium starter templates ─────────────────────────────────────────────────
// Ten art-directed storefronts, each designed for a specific kind of store with
// a deliberate conversion rhythm: lead with a strong hero, get to products fast,
// answer objections (reviews/FAQ), and close with a capture (newsletter).
// Typography, button shape, card style, grid and imagery are paired per niche;
// quieter brands disable the ticker, louder ones lean on it. Everything remains
// fully editable after applying.
export const STORE_TEMPLATES: StoreTemplate[] = [
  {
    id: "dover",
    name: "Dover",
    desc: "The clean, trustworthy storefront. Classic hero, products front and center, reviews & FAQ to close.",
    tags: ["Essential", "Clean", "Versatile"],
    accent: "#5b7a8c",
    settings: {
      theme: "harbor", primaryColor: "#5b7a8c", buttonStyle: "pill", fontStyle: "grotesk",
      layout: "grid", cardStyle: "shadow", heroStyle: "storefront", navStyle: "default", navHeight: "default",
      imageRatio: "square", backgroundEffect: "none", heroSize: "large", heroTextAlign: "center",
      ...CHROME,
      announcementText: "Free returns on every order, no questions asked",
      tickerText: "NEW ARRIVALS ✦ FAST DISPATCH ✦ EASY RETURNS",
      bannerImage: DEMO.storefront, heroOverlay: 48,
      heroHeading: "Good things, made simple.",
      heroSubheading: "Quality everyday goods, picked with care and shipped fast.",
      ctaText: "Shop bestsellers",
      homeLayout: [
        core("hero"),
        core("trustbar"),
        core("products"),
        banner("dover_new", "New this week", "Fresh arrivals every Friday, ready to ship same day.", DEMO.storefront, "center"),
        testimonials("dover_rev", "What customers say", REVIEWS_A),
        faq("dover_faq", FAQ_A),
        newsletter("dover_news", "First dibs, every Friday", "One short email a week with new arrivals and member deals."),
      ] as LayoutItem[],
    },
  },
  {
    id: "aurum",
    name: "Aurum",
    desc: "Quiet luxury. A full-screen photographic hero, monumental serif type and generous whitespace.",
    tags: ["Luxury", "Serif", "Refined"],
    accent: "#2a241d",
    settings: {
      theme: "sandstone", primaryColor: "#2a241d", buttonStyle: "square", fontStyle: "elegant",
      layout: "3col", cardStyle: "minimal", heroStyle: "cover", navStyle: "minimal", navHeight: "tall",
      imageRatio: "portrait", backgroundEffect: "none", heroSize: "fullscreen", heroTextAlign: "center",
      typographyScale: "lg",
      ...CHROME,
      tickerEnabled: false,
      announcementText: "Complimentary gift wrapping on every order",
      bannerImage: DEMO.watch, heroOverlay: 35,
      heroHeading: "Crafted to be kept.",
      heroSubheading: "Heirloom-grade pieces, released in small editions.",
      ctaText: "Explore the collection",
      homeLayout: [
        core("hero"),
        core("products"),
        richtext("aurum_craft", "The craft", "Each piece passes through a single pair of hands from start to finish. We make fewer things, better, and stand behind every one of them."),
        banner("aurum_gift", "The gifting edit", "Considered pieces, wrapped and ready to give.", DEMO.fashion, "left"),
        testimonials("aurum_rev", "Quiet praise", REVIEWS_B),
        faq("aurum_faq", FAQ_A),
        newsletter("aurum_news", "Private previews", "Be first to see each edition before it's released."),
      ] as LayoutItem[],
    },
  },
  {
    id: "forma",
    name: "Forma",
    desc: "Editorial monochrome fashion. Oversized headline, slow marquee, masonry lookbook.",
    tags: ["Editorial", "Fashion", "Monochrome"],
    accent: "#111113",
    settings: {
      theme: "default", primaryColor: "#111113", buttonStyle: "square", fontStyle: "editorial",
      layout: "masonry", cardStyle: "flat", heroStyle: "editorial", navStyle: "minimal", navHeight: "default",
      imageRatio: "portrait", backgroundEffect: "none", heroSize: "large", heroTextAlign: "left",
      typographyScale: "lg",
      ...CHROME,
      tickerEnabled: false,
      announcementText: "Collection 02 — now available",
      bannerImage: DEMO.fashion, heroOverlay: 40,
      heroHeading: "Form, first.",
      heroSubheading: "A considered wardrobe in black, white and everything between.",
      ctaText: "View the collection",
      homeLayout: [
        core("hero"),
        marquee("forma_mq", "COLLECTION 02 · IN STORES NOW · COLLECTION 02", { size: "lg", speed: "slow" }),
        core("products"),
        gallery("forma_look", "The lookbook", [DEMO.fashion, DEMO.apparel, DEMO.desk, DEMO.storefront], 2),
        richtext("forma_pov", "A point of view", "We design for the long term: precise cuts, honest fabrics, and silhouettes that outlast the season."),
        testimonials("forma_rev", "Worn and reviewed", REVIEWS_B),
        newsletter("forma_news", "The fitting room", "Collection previews and styling notes, monthly."),
      ] as LayoutItem[],
    },
  },
  {
    id: "meridian",
    name: "Meridian",
    desc: "Precision tech & gear. Spec-driven layout with trust signals, build story and field gallery.",
    tags: ["Tech", "Modern", "Precise"],
    accent: "#2f53d8",
    settings: {
      theme: "voltage", primaryColor: "#2f53d8", buttonStyle: "soft", fontStyle: "modern",
      layout: "grid", cardStyle: "border", heroStyle: "showcase", navStyle: "default", navHeight: "default",
      imageRatio: "square", backgroundEffect: "lines", heroSize: "large", heroTextAlign: "left",
      ...CHROME,
      announcementText: "Next-day delivery available at checkout",
      tickerText: "DESIGNED ✦ TESTED ✦ GUARANTEED ✦ SHIPS TODAY",
      bannerImage: DEMO.audio, heroOverlay: 45,
      heroHeading: "Engineered for every day.",
      heroSubheading: "Precision gear that earns its place in your bag.",
      ctaText: "Shop the lineup",
      homeLayout: [
        core("hero"),
        core("trustbar"),
        core("products"),
        banner("meridian_build", "Inside the build", "Premium components, obsessive tolerances, and a two-year warranty on everything we make.", DEMO.camera, "left"),
        gallery("meridian_field", "In the field", [DEMO.camera, DEMO.audio, DEMO.desk], 3),
        testimonials("meridian_rev", "Trusted by professionals", REVIEWS_A),
        faq("meridian_faq", FAQ_A),
        newsletter("meridian_news", "Early access list", "New releases and restocks before anyone else."),
      ] as LayoutItem[],
    },
  },
  {
    id: "noir",
    name: "Noir",
    desc: "Dark drop culture. Full-screen marquee hero, urgency ticker, built for limited releases.",
    tags: ["Streetwear", "Dark", "Drops"],
    accent: "#0a0a0a",
    settings: {
      theme: "monoedge", primaryColor: "#0a0a0a", buttonStyle: "sharp", fontStyle: "grotesk",
      layout: "grid", cardStyle: "flat", heroStyle: "marquee", navStyle: "transparent", navHeight: "default",
      imageRatio: "square", backgroundEffect: "none", heroSize: "fullscreen", heroTextAlign: "left",
      ...CHROME,
      announcementText: "Drop 004 is live — when it's gone, it's gone",
      tickerText: "DROP 004 ✦ LIMITED RUN ✦ NO RESTOCKS ✦ DROP 004",
      tickerSpeed: "fast",
      heroMarqueeText: "NOIR",
      bannerImage: DEMO.shoe, heroOverlay: 60,
      heroHeading: "Drop 004",
      heroSubheading: "Limited quantities. One run. No restocks.",
      ctaText: "Shop the drop",
      homeLayout: [
        core("hero"),
        marquee("noir_mq", "LIMITED RUN · NO RESTOCKS · LIMITED RUN", { size: "xl", speed: "fast" }),
        core("products"),
        banner("noir_next", "Next drop: Friday, 10AM", "Set a reminder. Last drop sold out in hours.", DEMO.shoe, "center"),
        faq("noir_faq", FAQ_A),
        newsletter("noir_news", "Get the drop alert", "We email once per drop, minutes before it goes live."),
      ] as LayoutItem[],
    },
  },
  {
    id: "verdant",
    name: "Verdant",
    desc: "Calm wellness & botanical. Values-led story, soft serif, ritual-focused merchandising.",
    tags: ["Wellness", "Natural", "Calm"],
    accent: "#1f9d63",
    settings: {
      theme: "evergreen", primaryColor: "#1f9d63", buttonStyle: "pill", fontStyle: "serif",
      layout: "3col", cardStyle: "minimal", heroStyle: "storefront", navStyle: "default", navHeight: "default",
      imageRatio: "square", backgroundEffect: "none", heroSize: "medium", heroTextAlign: "center",
      ...CHROME,
      announcementText: "Plastic-free packaging, carbon-neutral delivery 🌿",
      tickerText: "SMALL BATCH ✦ PLANT BASED ✦ THOUGHTFULLY SOURCED",
      bannerImage: DEMO.plant, heroOverlay: 40,
      heroHeading: "Rituals, simplified.",
      heroSubheading: "Small-batch botanicals for slower, better days.",
      ctaText: "Begin your ritual",
      homeLayout: [
        core("hero"),
        richtext("verdant_why", "Less, but better", "Everything we make starts with whole ingredients and ends with packaging the earth can take back. No fillers, no noise."),
        core("trustbar"),
        core("products"),
        banner("verdant_ritual", "The daily ritual", "Three steps, five minutes, all season long.", DEMO.plant, "left"),
        testimonials("verdant_rev", "From the community", REVIEWS_A),
        faq("verdant_faq", FAQ_A),
        newsletter("verdant_news", "Slow letters", "Seasonal recipes, rituals and early access, monthly."),
      ] as LayoutItem[],
    },
  },
  {
    id: "casa",
    name: "Casa",
    desc: "Warm artisan home goods. Maker's story, process gallery and a hand-drawn curved marquee.",
    tags: ["Artisan", "Home", "Warm"],
    accent: "#c98064",
    settings: {
      theme: "terracotta", primaryColor: "#c98064", buttonStyle: "rounded", fontStyle: "serif",
      layout: "grid", cardStyle: "shadow", heroStyle: "showcase", navStyle: "default", navHeight: "default",
      imageRatio: "square", backgroundEffect: "none", heroSize: "medium", heroTextAlign: "left",
      ...CHROME,
      announcementText: "Each piece is made to order — current lead time 1–2 weeks",
      tickerText: "MADE BY HAND ✦ SMALL BATCHES ✦ BUILT TO LAST",
      bannerImage: DEMO.desk, heroOverlay: 38,
      heroHeading: "Made by hand, made to live with.",
      heroSubheading: "Functional objects with the maker's marks left in.",
      ctaText: "Shop the studio",
      homeLayout: [
        core("hero"),
        core("products"),
        marquee("casa_mq", "made slowly · made well · made for you", { size: "lg", curved: true }),
        banner("casa_maker", "From the workbench", "Every order is made for you, by one maker, start to finish.", DEMO.desk, "left"),
        gallery("casa_process", "The process", [DEMO.desk, DEMO.plant, DEMO.storefront], 3),
        testimonials("casa_rev", "Living with Casa", REVIEWS_B),
        newsletter("casa_news", "Studio notes", "New batches, seconds sales and works in progress."),
      ] as LayoutItem[],
    },
  },
  {
    id: "petal",
    name: "Petal",
    desc: "Soft boutique charm. Floating cards, curved moving text and a gift-ready lookbook.",
    tags: ["Boutique", "Soft", "Gifting"],
    accent: "#7d1f3f",
    settings: {
      theme: "grape", primaryColor: "#7d1f3f", buttonStyle: "pill", fontStyle: "editorial",
      layout: "3col", cardStyle: "float", heroStyle: "centered", navStyle: "default", navHeight: "default",
      imageRatio: "portrait", backgroundEffect: "none", heroSize: "large", heroTextAlign: "center",
      ...CHROME,
      announcementText: "Free mini gift with every order over $50 🎀",
      tickerText: "NEW IN ✦ LITTLE LUXURIES ✦ GIFT-READY ✦ NEW IN",
      bannerImage: DEMO.fashion, heroOverlay: 35,
      heroHeading: "Pretty things, thoughtfully made.",
      heroSubheading: "Small luxuries for yourself and the people you love.",
      ctaText: "Shop new in",
      homeLayout: [
        core("hero"),
        marquee("petal_mq", "soft · pretty · yours", { size: "lg", curved: true }),
        core("products"),
        gallery("petal_look", "The edit", [DEMO.fashion, DEMO.apparel, DEMO.plant, DEMO.watch], 2),
        banner("petal_gift", "The gift shop", "Wrapped, ribboned and ready to give.", DEMO.plant, "center"),
        testimonials("petal_rev", "Loved & gifted", REVIEWS_A),
        newsletter("petal_news", "Join the petal post", "Sweet deals and first looks, twice a month."),
      ] as LayoutItem[],
    },
  },
  {
    id: "pulse",
    name: "Pulse",
    desc: "High-energy performance. Full-bleed hero, fast marquee and a dense, shoppable grid.",
    tags: ["Bold", "Sport", "Energetic"],
    accent: "#f15a24",
    settings: {
      theme: "tangerine", primaryColor: "#f15a24", buttonStyle: "sharp", fontStyle: "grotesk",
      layout: "compact", cardStyle: "flat", heroStyle: "product", navStyle: "colored", navHeight: "default",
      imageRatio: "square", backgroundEffect: "none", heroSize: "fullscreen", heroTextAlign: "left",
      ...CHROME,
      announcementText: "Season sale ends Sunday — up to 40% off",
      tickerText: "UP TO 40% OFF ✦ ENDS SUNDAY ✦ NO CODE NEEDED",
      tickerSpeed: "fast",
      bannerImage: DEMO.shoe, heroOverlay: 52,
      heroHeading: "Push harder.",
      heroSubheading: "Gear that keeps up with your worst-weather, last-rep days.",
      ctaText: "Shop the sale",
      homeLayout: [
        core("hero"),
        marquee("pulse_mq", "TRAIN · RECOVER · REPEAT · TRAIN · RECOVER", { size: "xl", speed: "fast" }),
        core("products"),
        banner("pulse_perf", "The performance line", "Lab-tested, athlete-approved, built to be beaten up.", DEMO.audio, "left"),
        testimonials("pulse_rev", "Athletes say", REVIEWS_A),
        faq("pulse_faq", FAQ_A),
        newsletter("pulse_news", "Never miss a release", "Launches and sale alerts, straight to your inbox."),
      ] as LayoutItem[],
    },
  },
  {
    id: "index",
    name: "Index",
    desc: "Artist & print shop. Gallery-first layout with edition notes and museum-quiet styling.",
    tags: ["Art", "Prints", "Gallery"],
    accent: "#0a0a0a",
    settings: {
      theme: "monoedge", primaryColor: "#0a0a0a", buttonStyle: "sharp", fontStyle: "display",
      layout: "masonry", cardStyle: "flat", heroStyle: "editorial", navStyle: "minimal", navHeight: "default",
      imageRatio: "portrait", backgroundEffect: "none", heroSize: "medium", heroTextAlign: "left",
      ...CHROME,
      tickerEnabled: false,
      announcementText: "Open edition prints ship worldwide",
      bannerImage: DEMO.camera, heroOverlay: 40,
      heroHeading: "Selected works, printed.",
      heroSubheading: "Archival prints of original work, numbered and signed.",
      ctaText: "Browse the prints",
      homeLayout: [
        core("hero"),
        gallery("index_works", "Recent works", [DEMO.camera, DEMO.desk, DEMO.plant, DEMO.fashion, DEMO.apparel, DEMO.storefront], 3),
        core("products"),
        richtext("index_editions", "On editions", "Every print is produced on archival cotton paper, checked by hand, and shipped flat or rolled in a tube, ready to frame."),
        faq("index_faq", FAQ_A),
        newsletter("index_news", "New works first", "One email when a new piece or edition is released."),
      ] as LayoutItem[],
    },
  },
];

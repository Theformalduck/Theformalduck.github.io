"use client";

import { useEffect, useRef, useState } from "react";

// ── Types (mirrored from editor) ───────────────────────────────────────────────

type ElemType = "text" | "image" | "rect" | "circle" | "svg" | "video" | "button" | "progress";
interface Shadow { x:number; y:number; blur:number; color:string; }
interface TextShadow { x:number; y:number; blur:number; color:string; }
type AnimType = "none"|"fadeIn"|"slideUp"|"slideDown"|"slideLeft"|"slideRight"|"zoomIn"|"zoomOut"|"bounce"|"pulse"|"spin"|"shake"|"flip"|"float";
interface AnimConfig { type:AnimType; duration:number; delay:number; easing:"ease"|"ease-in"|"ease-out"|"ease-in-out"|"linear"; repeat:"once"|"loop"; }
interface BaseElem { id:string; type:ElemType; x:number; y:number; w:number; h:number; rot:number; z:number; opacity:number; locked:boolean; shadow?:Shadow|null; flipX?:boolean; flipY?:boolean; blendMode?:string; anim?:AnimConfig|null; link?:string; }
interface TextElem   extends BaseElem { type:"text"; content:string; font:string; size:number; bold:boolean; italic:boolean; underline:boolean; align:"left"|"center"|"right"; color:string; lh:number; ls:number; highlight?:string; textStroke?:string; textStrokeW?:number; fontWeight?:number; textTransform?:"none"|"uppercase"|"lowercase"|"capitalize"; gradientText?:string; textShadow?:TextShadow|null; }
interface ImageElem  extends BaseElem { type:"image"; src:string; fit:"cover"|"contain"|"fill"; radius:number; brightness?:number; contrast?:number; saturation?:number; blur?:number; grayscale?:number; }
interface RectElem   extends BaseElem { type:"rect"; fill:string; stroke:string; strokeW:number; radius:number; strokeStyle?:"solid"|"dashed"|"dotted"; }
interface CircleElem extends BaseElem { type:"circle"; fill:string; stroke:string; strokeW:number; strokeStyle?:"solid"|"dashed"|"dotted"; }
interface SvgElem    extends BaseElem { type:"svg"; svgContent:string; viewBox:string; fill:string; stroke:string; strokeW:number; strokeStyle?:"solid"|"dashed"|"dotted"; }
interface VideoElem  extends BaseElem { type:"video"; youtubeId:string; radius:number; }
interface ButtonElem extends BaseElem { type:"button"; text:string; font:string; fontSize:number; textColor:string; bgColor:string; radius:number; borderColor:string; borderW:number; }
interface ProgressElem extends BaseElem { type:"progress"; value:number; trackColor:string; fillColor:string; radius:number; showLabel:boolean; labelColor:string; }
type Elem = TextElem | ImageElem | RectElem | CircleElem | SvgElem | VideoElem | ButtonElem | ProgressElem;
interface Page { id:string; label:string; bg:string; h:number; elems:Elem[]; bgImage?:string; }
interface CanvasDoc { version:1; pages:Page[]; }

const SYSTEM_FONTS = new Set(["Georgia","Times New Roman","Courier New","Arial","Verdana","Trebuchet MS","Palatino"]);
const ff = (f: string) => SYSTEM_FONTS.has(f) ? f : `'${f}', sans-serif`;

const GF_URL = `https://fonts.googleapis.com/css2?${
  ["Inter","Roboto","Poppins","Montserrat","Lato","Open Sans","Raleway","Oswald",
   "Nunito","Ubuntu","Playfair Display","Merriweather","Lora","Dancing Script",
   "Pacifico","Lobster","Bebas Neue","Righteous","Caveat","Space Mono"]
    .map(f => `family=${f.replace(/ /g,"+")}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,700`)
    .join("&")
}&display=swap`;

// CSS keyframes injected once into the page
const ANIM_CSS = `
@keyframes nx-fadeIn{from{opacity:0}to{opacity:1}}
@keyframes nx-slideUp{from{opacity:0;transform:translateY(50px)}to{opacity:1;transform:translateY(0)}}
@keyframes nx-slideDown{from{opacity:0;transform:translateY(-50px)}to{opacity:1;transform:translateY(0)}}
@keyframes nx-slideLeft{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)}}
@keyframes nx-slideRight{from{opacity:0;transform:translateX(-60px)}to{opacity:1;transform:translateX(0)}}
@keyframes nx-zoomIn{from{opacity:0;transform:scale(0.5)}to{opacity:1;transform:scale(1)}}
@keyframes nx-zoomOut{from{opacity:0;transform:scale(1.5)}to{opacity:1;transform:scale(1)}}
@keyframes nx-bounce{0%,100%{transform:translateY(0)}40%{transform:translateY(-30px)}60%{transform:translateY(-15px)}}
@keyframes nx-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
@keyframes nx-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes nx-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(10px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}
@keyframes nx-flip{from{opacity:0;transform:perspective(600px) rotateY(90deg)}to{opacity:1;transform:perspective(600px) rotateY(0)}}
@keyframes nx-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-15px)}}
`;

function ElemView({ el }: { el: Elem }) {
  const anim = el.anim;
  const hasAnim = anim && anim.type !== "none";

  // Outer div: absolute position + z-index + animation (no rotation — avoids transform conflict)
  const outer: React.CSSProperties = {
    position: "absolute",
    left: el.x, top: el.y, width: el.w, height: el.h,
    zIndex: el.z,
    ...(hasAnim ? {
      animationName: `nx-${anim!.type}`,
      animationDuration: `${anim!.duration ?? 0.6}s`,
      animationDelay: `${anim!.delay ?? 0}s`,
      animationTimingFunction: anim!.easing ?? "ease",
      animationIterationCount: anim!.repeat === "loop" ? "infinite" : 1,
      animationFillMode: "both",
    } : {}),
  };

  const flipT = `${el.flipX ? "scaleX(-1) " : ""}${el.flipY ? "scaleY(-1) " : ""}`;
  const shadowF = el.shadow
    ? `drop-shadow(${el.shadow.x}px ${el.shadow.y}px ${el.shadow.blur}px ${el.shadow.color})`
    : undefined;

  // Inner div: rotation + flip + opacity + shadow filter + blend mode
  const inner: React.CSSProperties = {
    width: "100%", height: "100%",
    transform: (`rotate(${el.rot}deg) ${flipT}`).trim() || undefined,
    transformOrigin: "center center",
    opacity: el.opacity,
    filter: shadowF,
    mixBlendMode: (el.blendMode && el.blendMode !== "normal" ? el.blendMode : undefined) as any,
  };

  let body: React.ReactElement | null = null;

  if (el.type === "text") {
    const strokeStyle = el.textStroke && el.textStrokeW
      ? { WebkitTextStroke: `${el.textStrokeW}px ${el.textStroke}` } as React.CSSProperties : {};
    const gradCSS: React.CSSProperties = el.gradientText ? {
      backgroundImage: el.gradientText,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      color: "transparent",
    } : {};
    const tshadow = el.textShadow
      ? `${el.textShadow.x}px ${el.textShadow.y}px ${el.textShadow.blur}px ${el.textShadow.color}`
      : undefined;
    body = (
      <div style={{
        ...inner,
        fontFamily: ff(el.font),
        fontSize: el.size,
        fontWeight: el.fontWeight ?? (el.bold ? 700 : 400),
        fontStyle: el.italic ? "italic" : "normal",
        textDecoration: el.underline ? "underline" : "none",
        textAlign: el.align,
        color: el.color,
        lineHeight: el.lh,
        letterSpacing: el.ls ? `${el.ls}px` : undefined,
        textTransform: (el.textTransform && el.textTransform !== "none") ? el.textTransform : undefined,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        overflow: "visible",
        padding: 4,
        backgroundColor: el.highlight || undefined,
        textShadow: tshadow,
        ...strokeStyle,
        ...gradCSS,
      }}>
        {el.content}
      </div>
    );
  } else if (el.type === "image") {
    const parts: string[] = [];
    if (el.brightness !== undefined && el.brightness !== 100) parts.push(`brightness(${el.brightness}%)`);
    if (el.contrast   !== undefined && el.contrast   !== 100) parts.push(`contrast(${el.contrast}%)`);
    if (el.saturation !== undefined && el.saturation !== 100) parts.push(`saturate(${el.saturation}%)`);
    if (el.grayscale  !== undefined && el.grayscale  !== 0)   parts.push(`grayscale(${el.grayscale}%)`);
    if (el.blur       !== undefined && el.blur       !== 0)   parts.push(`blur(${el.blur}px)`);
    const imgFilter = parts.length ? parts.join(" ") : undefined;
    body = (
      <div style={{ ...inner, overflow: "hidden", borderRadius: el.radius }}>
        {el.src && <img src={el.src} alt="" style={{ width:"100%", height:"100%", objectFit: el.fit, display:"block", filter: imgFilter }} />}
      </div>
    );
  } else if (el.type === "rect") {
    const bStyle = el.strokeStyle === "dashed" ? "dashed" : el.strokeStyle === "dotted" ? "dotted" : "solid";
    body = (
      <div style={{
        ...inner,
        background: el.fill === "none" || el.fill === "transparent" ? "transparent" : el.fill,
        borderRadius: el.radius,
        border: el.stroke && el.stroke !== "none" ? `${el.strokeW}px ${bStyle} ${el.stroke}` : undefined,
      }} />
    );
  } else if (el.type === "circle") {
    const bStyle = el.strokeStyle === "dashed" ? "dashed" : el.strokeStyle === "dotted" ? "dotted" : "solid";
    body = (
      <div style={{
        ...inner,
        background: el.fill === "none" || el.fill === "transparent" ? "transparent" : el.fill,
        borderRadius: "50%",
        border: el.stroke && el.stroke !== "none" ? `${el.strokeW}px ${bStyle} ${el.stroke}` : undefined,
      }} />
    );
  } else if (el.type === "svg") {
    const dashArr = el.strokeStyle === "dashed" ? "8 4" : el.strokeStyle === "dotted" ? "2 4" : undefined;
    body = (
      <div style={{ ...inner }}>
        <svg
          viewBox={el.viewBox}
          style={{ width: "100%", height: "100%" }}
          fill={el.fill || "none"}
          stroke={el.stroke || "none"}
          strokeWidth={el.strokeW}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={dashArr}
          dangerouslySetInnerHTML={{ __html: el.svgContent }}
        />
      </div>
    );
  } else if (el.type === "video") {
    if (!el.youtubeId) return null;
    body = (
      <div style={{ ...inner, overflow: "hidden", borderRadius: el.radius, background: "#000" }}>
        <iframe
          src={`https://www.youtube.com/embed/${el.youtubeId}`}
          style={{ width: "100%", height: "100%", border: "none" }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  } else if (el.type === "button") {
    body = (
      <div style={{
        ...inner,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: el.bgColor === "transparent" ? "transparent" : el.bgColor,
        borderRadius: el.radius,
        border: el.borderW > 0 && el.borderColor !== "none" ? `${el.borderW}px solid ${el.borderColor}` : "none",
      }}>
        <span style={{
          color: el.textColor,
          fontFamily: ff(el.font),
          fontSize: el.fontSize,
          fontWeight: 600,
          letterSpacing: "0.01em",
        }}>
          {el.text || "Button"}
        </span>
      </div>
    );
  } else if (el.type === "progress") {
    const pct = Math.min(100, Math.max(0, el.value));
    body = (
      <div style={{ ...inner, display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ flex:1, height:"60%", background:el.trackColor, borderRadius:el.radius, overflow:"hidden", position:"relative" }}>
          <div style={{ position:"absolute", left:0, top:0, height:"100%", width:`${pct}%`, background:el.fillColor, borderRadius:el.radius }} />
        </div>
        {el.showLabel && (
          <span style={{ fontSize:14, fontWeight:700, color:el.labelColor, minWidth:36, textAlign:"right", flexShrink:0 }}>
            {pct}%
          </span>
        )}
      </div>
    );
  }

  if (!body) return null;

  if (el.link) {
    const isExternal = !el.link.startsWith("mailto:") && !el.link.startsWith("tel:");
    return (
      <div style={outer}>
        <a href={el.link}
          {...(isExternal ? { target:"_blank", rel:"noopener noreferrer" } : {})}
          style={{ display:"block", width:"100%", height:"100%", textDecoration:"none", color:"inherit", cursor:"pointer" }}>
          {body}
        </a>
      </div>
    );
  }

  return <div style={outer}>{body}</div>;
}

// Detect background panels anchored to the canvas edges and extend them to fill the viewport.
// This lets the right orange panel in the Creator template spill beyond the 1200px canvas.
const CANVAS_W = 1920;

function getPageBg(page: Page, viewportW: number): string {
  if (viewportW <= CANVAS_W || page.bgImage) return page.bg;

  const margin = (viewportW - CANVAS_W) / 2;
  const rects = page.elems.filter(
    (el): el is RectElem =>
      el.type === "rect" && el.h >= page.h * 0.4 &&
      el.fill !== "none" && el.fill !== "transparent" &&
      !el.fill.includes("gradient")
  );

  // Right-anchored panel: starts in right portion and ends exactly at canvas right edge
  const rightPanel = rects.find(
    r => r.x > 240 && Math.abs(r.x + r.w - CANVAS_W) <= 12 && r.fill !== page.bg
  );
  if (rightPanel) {
    const pct = ((margin + rightPanel.x) / viewportW * 100).toFixed(2);
    return `linear-gradient(to right, ${page.bg} ${pct}%, ${rightPanel.fill} ${pct}%)`;
  }

  // Left-anchored panel: starts at x=0, covers a portion (not full width)
  const leftPanel = rects.find(r => r.x === 0 && r.w >= 360 && r.w <= 1080);
  if (leftPanel) {
    const pct = ((margin + leftPanel.w) / viewportW * 100).toFixed(2);
    return `linear-gradient(to right, ${leftPanel.fill} ${pct}%, ${page.bg} ${pct}%)`;
  }

  return page.bg;
}

export function CanvasRenderer({ doc }: { doc: CanvasDoc }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      // Measure the TRUE viewport width (document.documentElement.clientWidth) — NOT a
      // child container, whose width would itself be inflated by the canvas overflowing,
      // creating a feedback loop that never shrinks the canvas to fit.
      const vw = document.documentElement.clientWidth || window.innerWidth;
      // Design canvas is 1920 wide. Scale DOWN to fit narrower screens, but never
      // scale UP past 1× — so text/buttons are never enlarged beyond their native size.
      if (vw > 0) setScale(Math.min(1, vw / CANVAS_W));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ANIM_CSS }} />
      <link rel="stylesheet" href={GF_URL} />
      {doc.pages.map(page => (
        <div key={page.id} style={{
          width: "100%",
          overflowX: "hidden",
          background: page.bg,
          ...(page.bgImage ? { backgroundImage: `url(${page.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" } : {}),
          display: "flex",
          justifyContent: "center",
        }}>
          {/* Clip box is exactly the scaled canvas size — off-canvas decorations are clipped
              at the 1440 edge, identical to the editor artboard. */}
          <div style={{
            position: "relative",
            width: CANVAS_W * scale,
            height: page.h * scale,
            overflow: "hidden",
            flexShrink: 0,
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0,
              width: CANVAS_W, height: page.h,
              transformOrigin: "top left",
              transform: `scale(${scale})`,
            }}>
              {[...page.elems].sort((a, b) => a.z - b.z).map(el => (
                <ElemView key={el.id} el={el} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

// ── Static thumbnail of a canvas portfolio's first page ───────────────────────
// Renders the real elements scaled to fit the container width, clipped to a fixed
// height — used for previews on the Discover page. Animations are stripped so the
// preview is a clean, final-state still.
export function CanvasThumbnail({ doc, height = 160 }: { doc: CanvasDoc; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(height / 960);

  useEffect(() => {
    const update = () => {
      if (ref.current) {
        const w = ref.current.offsetWidth;
        if (w > 0) setScale(w / CANVAS_W);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const page = doc?.pages?.[0];
  if (!page) return <div ref={ref} style={{ width: "100%", height, background: "#f3f4f6" }} />;

  return (
    <div ref={ref} style={{
      width: "100%", height, overflow: "hidden", position: "relative",
      background: page.bg,
      ...(page.bgImage ? { backgroundImage: `url(${page.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" } : {}),
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: CANVAS_W, height: page.h,
        transformOrigin: "top left",
        transform: `scale(${scale})`,
      }}>
        {[...page.elems].sort((a, b) => a.z - b.z).map(el => (
          <ElemView key={el.id} el={{ ...el, anim: null }} />
        ))}
      </div>
    </div>
  );
}

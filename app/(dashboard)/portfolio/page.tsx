﻿﻿"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Type, Image as ImgIcon, Square, Circle, Undo2, Redo2, Eye,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Trash2, Copy, Plus, Loader2, Lock, Unlock,
  RotateCcw, Minus, Upload, Save,
  LayoutTemplate, PanelLeft, Star, Palette, Smile, Play, Film,
  FlipHorizontal2, FlipVertical2, BarChart2, Link2,
  ChevronDown, ChevronRight, Blend, SlidersHorizontal, Share2, X, Users,
  Layers, Grid3x3, Download, AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter, GripVertical,
} from "lucide-react";
import { MediaUpload } from "@/components/ui/media-upload";

// â"€â"€ Types â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

type ElemType = "text" | "image" | "rect" | "circle" | "svg" | "video" | "button" | "progress";
type HandleDir = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

interface Shadow { x: number; y: number; blur: number; color: string; }
interface TextShadow { x: number; y: number; blur: number; color: string; }

type AnimType = "none"|"fadeIn"|"slideUp"|"slideDown"|"slideLeft"|"slideRight"|"zoomIn"|"zoomOut"|"bounce"|"pulse"|"spin"|"shake"|"flip"|"float";
interface AnimConfig { type: AnimType; duration: number; delay: number; easing: "ease"|"ease-in"|"ease-out"|"ease-in-out"|"linear"; repeat: "once"|"loop"; }

interface BaseElem {
  id: string; type: ElemType;
  x: number; y: number; w: number; h: number;
  rot: number; z: number; opacity: number; locked: boolean;
  shadow?: Shadow | null;
  flipX?: boolean;
  flipY?: boolean;
  blendMode?: string;
  anim?: AnimConfig | null;
  link?: string;
}
interface TextElem extends BaseElem {
  type: "text"; content: string; font: string; size: number;
  bold: boolean; italic: boolean; underline: boolean;
  align: "left" | "center" | "right"; color: string; lh: number; ls: number;
  highlight?: string;
  textStroke?: string;
  textStrokeW?: number;
  fontWeight?: number;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  gradientText?: string;
  textShadow?: TextShadow | null;
}
interface ImageElem extends BaseElem {
  type: "image"; src: string; fit: "cover" | "contain" | "fill"; radius: number;
  brightness?: number; contrast?: number; saturation?: number; blur?: number;
  grayscale?: number;
}
interface RectElem extends BaseElem {
  type: "rect"; fill: string; stroke: string; strokeW: number; radius: number;
  strokeStyle?: "solid" | "dashed" | "dotted";
}
interface CircleElem extends BaseElem {
  type: "circle"; fill: string; stroke: string; strokeW: number;
  strokeStyle?: "solid" | "dashed" | "dotted";
}
interface SvgElem extends BaseElem {
  type: "svg"; svgContent: string; viewBox: string;
  fill: string; stroke: string; strokeW: number;
  strokeStyle?: "solid" | "dashed" | "dotted";
}
interface VideoElem extends BaseElem {
  type: "video"; youtubeId: string; radius: number;
}
interface ButtonElem extends BaseElem {
  type: "button"; text: string; font: string; fontSize: number;
  textColor: string; bgColor: string; radius: number; borderColor: string; borderW: number;
}
interface ProgressElem extends BaseElem {
  type: "progress"; value: number; trackColor: string; fillColor: string;
  radius: number; showLabel: boolean; labelColor: string;
}
type Elem = TextElem | ImageElem | RectElem | CircleElem | SvgElem | VideoElem | ButtonElem | ProgressElem;

interface Page { id: string; label: string; bg: string; h: number; elems: Elem[]; bgImage?: string; }
interface CanvasDoc { version: 1; pages: Page[]; }

// â"€â"€ Constants â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const CW = 1920;
const DEFAULT_H = 900;

const FONTS = [
  "Inter","Roboto","Poppins","Montserrat","Lato","Open Sans","Raleway","Oswald",
  "Nunito","Ubuntu","Playfair Display","Merriweather","Lora","Dancing Script",
  "Pacifico","Lobster","Bebas Neue","Righteous","Caveat","Space Mono",
  "Georgia","Times New Roman","Courier New","Arial","Verdana","Trebuchet MS",
];
const GF_URL = `https://fonts.googleapis.com/css2?${
  ["Inter","Roboto","Poppins","Montserrat","Lato","Open Sans","Raleway","Oswald",
   "Nunito","Ubuntu","Playfair Display","Merriweather","Lora","Dancing Script",
   "Pacifico","Lobster","Bebas Neue","Righteous","Caveat","Space Mono"]
    .map(f => `family=${f.replace(/ /g,"+")}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,700`)
    .join("&")
}&display=swap`;

const HANDLE_MAP: Record<HandleDir, [number,number,number,number]> = {
  nw:[1,1,-1,-1], n:[0,1,0,-1], ne:[0,1,1,-1],
  e:[0,0,1,0],  se:[0,0,1,1],  s:[0,0,0,1],
  sw:[1,0,-1,1], w:[1,0,-1,0],
};
const HANDLE_POS: Record<HandleDir, React.CSSProperties> = {
  nw:{top:-5,left:-5},          n:{top:-5,left:"50%",transform:"translateX(-50%)"},
  ne:{top:-5,right:-5},         e:{top:"50%",right:-5,transform:"translateY(-50%)"},
  se:{bottom:-5,right:-5},      s:{bottom:-5,left:"50%",transform:"translateX(-50%)"},
  sw:{bottom:-5,left:-5},       w:{top:"50%",left:-5,transform:"translateY(-50%)"},
};
const HANDLE_CURSOR: Record<HandleDir, string> = {
  nw:"nw-resize",n:"n-resize",ne:"ne-resize",e:"e-resize",
  se:"se-resize",s:"s-resize",sw:"sw-resize",w:"w-resize",
};

// â"€â"€ Shape library â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

interface SvgDef {
  name: string; svgContent: string; viewBox: string;
  defaultFill: string; defaultStroke: string; defaultStrokeW: number;
  w?: number; h?: number;
}

const SHAPES: SvgDef[] = [
  { name:"Rectangle",     svgContent:`<rect x="5" y="20" width="90" height="60" rx="4"/>`,                                   viewBox:"0 0 100 100", defaultFill:"#6366f1", defaultStroke:"none", defaultStrokeW:0 },
  { name:"Circle",        svgContent:`<circle cx="50" cy="50" r="45"/>`,                                                      viewBox:"0 0 100 100", defaultFill:"#6366f1", defaultStroke:"none", defaultStrokeW:0 },
  { name:"Triangle",      svgContent:`<polygon points="50,5 95,95 5,95"/>`,                                                   viewBox:"0 0 100 100", defaultFill:"#6366f1", defaultStroke:"none", defaultStrokeW:0 },
  { name:"Star",          svgContent:`<polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35"/>`,        viewBox:"0 0 100 100", defaultFill:"#fbbf24", defaultStroke:"none", defaultStrokeW:0 },
  { name:"Hexagon",       svgContent:`<polygon points="50,5 93,27 93,73 50,95 7,73 7,27"/>`,                                  viewBox:"0 0 100 100", defaultFill:"#6366f1", defaultStroke:"none", defaultStrokeW:0 },
  { name:"Diamond",       svgContent:`<polygon points="50,5 95,50 50,95 5,50"/>`,                                             viewBox:"0 0 100 100", defaultFill:"#6366f1", defaultStroke:"none", defaultStrokeW:0 },
  { name:"Pentagon",      svgContent:`<polygon points="50,5 93,36 76,86 24,86 7,36"/>`,                                       viewBox:"0 0 100 100", defaultFill:"#6366f1", defaultStroke:"none", defaultStrokeW:0 },
  { name:"Octagon",       svgContent:`<polygon points="33,5 67,5 95,33 95,67 67,95 33,95 5,67 5,33"/>`,                      viewBox:"0 0 100 100", defaultFill:"#6366f1", defaultStroke:"none", defaultStrokeW:0 },
  { name:"Arrow â†’",       svgContent:`<polygon points="5,35 65,35 65,20 95,50 65,80 65,65 5,65"/>`,                           viewBox:"0 0 100 100", defaultFill:"#6366f1", defaultStroke:"none", defaultStrokeW:0 },
  { name:"Arrow â†‘",       svgContent:`<polygon points="35,95 35,35 20,35 50,5 80,35 65,35 65,95"/>`,                          viewBox:"0 0 100 100", defaultFill:"#6366f1", defaultStroke:"none", defaultStrokeW:0 },
  { name:"Plus",          svgContent:`<polygon points="38,5 62,5 62,38 95,38 95,62 62,62 62,95 38,95 38,62 5,62 5,38 38,38"/>`, viewBox:"0 0 100 100", defaultFill:"#6366f1", defaultStroke:"none", defaultStrokeW:0 },
  { name:"Heart",         svgContent:`<path d="M50 80 C20 60,5 40,5 25 C5 12,15 5,27 5 C35 5,44 10,50 18 C56 10,65 5,73 5 C85 5,95 12,95 25 C95 40,80 60,50 80Z"/>`, viewBox:"0 0 100 100", defaultFill:"#ef4444", defaultStroke:"none", defaultStrokeW:0 },
  { name:"Cloud",         svgContent:`<path d="M75 65 C88 65,95 56,90 47 C95 43,95 33,86 29 C88 20,80 10,70 13 C67 7,59 5,52 10 C46 4,37 5,33 12 C24 9,15 19,18 29 C8 30,5 42,12 48 C7 56,14 66,25 65Z"/>`, viewBox:"0 0 100 100", defaultFill:"#e2e8f0", defaultStroke:"none", defaultStrokeW:0 },
  { name:"Speech",        svgContent:`<path d="M10 10 L90 10 L90 68 L55 68 L42 88 L38 68 L10 68Z"/>`,                        viewBox:"0 0 100 100", defaultFill:"#e2e8f0", defaultStroke:"none", defaultStrokeW:0 },
  { name:"Shield",        svgContent:`<path d="M50 5 L88 20 L88 48 C88 70,70 87,50 95 C30 87,12 70,12 48 L12 20Z"/>`,        viewBox:"0 0 100 100", defaultFill:"#3b82f6", defaultStroke:"none", defaultStrokeW:0 },
  { name:"Lightning",     svgContent:`<polygon points="58,5 28,52 52,52 42,95 72,48 48,48"/>`,                                viewBox:"0 0 100 100", defaultFill:"#fbbf24", defaultStroke:"none", defaultStrokeW:0 },
  { name:"Bookmark",      svgContent:`<path d="M20 5 L80 5 L80 95 L50 78 L20 95Z"/>`,                                         viewBox:"0 0 100 100", defaultFill:"#8b5cf6", defaultStroke:"none", defaultStrokeW:0 },
  { name:"Parallelogram", svgContent:`<polygon points="25,10 95,10 75,90 5,90"/>`,                                             viewBox:"0 0 100 100", defaultFill:"#6366f1", defaultStroke:"none", defaultStrokeW:0 },
  { name:"Chevron",       svgContent:`<polygon points="10,25 50,65 90,25 80,15 50,55 20,15"/>`,                               viewBox:"0 0 100 100", defaultFill:"#6366f1", defaultStroke:"none", defaultStrokeW:0 },
  { name:"Ring",          svgContent:`<circle cx="50" cy="50" r="44"/>`,                                                       viewBox:"0 0 100 100", defaultFill:"none", defaultStroke:"#6366f1", defaultStrokeW:10 },
];

// â"€â"€ Icon library â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const ICONS: SvgDef[] = [
  { name:"Home",      svgContent:`<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,                  viewBox:"0 0 24 24", defaultFill:"none", defaultStroke:"#1e293b", defaultStrokeW:2 },
  { name:"Star",      svgContent:`<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,     viewBox:"0 0 24 24", defaultFill:"none", defaultStroke:"#1e293b", defaultStrokeW:2 },
  { name:"Heart",     svgContent:`<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>`, viewBox:"0 0 24 24", defaultFill:"none", defaultStroke:"#ef4444", defaultStrokeW:2 },
  { name:"Mail",      svgContent:`<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>`, viewBox:"0 0 24 24", defaultFill:"none", defaultStroke:"#1e293b", defaultStrokeW:2 },
  { name:"Phone",     svgContent:`<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.13 6.13l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>`, viewBox:"0 0 24 24", defaultFill:"none", defaultStroke:"#1e293b", defaultStrokeW:2 },
  { name:"Globe",     svgContent:`<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>`, viewBox:"0 0 24 24", defaultFill:"none", defaultStroke:"#1e293b", defaultStrokeW:2 },
  { name:"Instagram", svgContent:`<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>`, viewBox:"0 0 24 24", defaultFill:"none", defaultStroke:"#1e293b", defaultStrokeW:2 },
  { name:"Twitter",   svgContent:`<path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>`, viewBox:"0 0 24 24", defaultFill:"none", defaultStroke:"#1e293b", defaultStrokeW:2 },
  { name:"Github",    svgContent:`<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>`, viewBox:"0 0 24 24", defaultFill:"none", defaultStroke:"#1e293b", defaultStrokeW:2 },
  { name:"LinkedIn",  svgContent:`<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>`, viewBox:"0 0 24 24", defaultFill:"none", defaultStroke:"#1e293b", defaultStrokeW:2 },
  { name:"YouTube",   svgContent:`<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.4 19.6C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>`, viewBox:"0 0 24 24", defaultFill:"none", defaultStroke:"#1e293b", defaultStrokeW:2 },
  { name:"Facebook",  svgContent:`<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>`, viewBox:"0 0 24 24", defaultFill:"none", defaultStroke:"#1e293b", defaultStrokeW:2 },
  { name:"User",      svgContent:`<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`, viewBox:"0 0 24 24", defaultFill:"none", defaultStroke:"#1e293b", defaultStrokeW:2 },
  { name:"MapPin",    svgContent:`<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>`, viewBox:"0 0 24 24", defaultFill:"none", defaultStroke:"#1e293b", defaultStrokeW:2 },
  { name:"Camera",    svgContent:`<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>`, viewBox:"0 0 24 24", defaultFill:"none", defaultStroke:"#1e293b", defaultStrokeW:2 },
  { name:"Music",     svgContent:`<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>`, viewBox:"0 0 24 24", defaultFill:"none", defaultStroke:"#1e293b", defaultStrokeW:2 },
  { name:"Code",      svgContent:`<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>`, viewBox:"0 0 24 24", defaultFill:"none", defaultStroke:"#1e293b", defaultStrokeW:2 },
  { name:"Award",     svgContent:`<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>`, viewBox:"0 0 24 24", defaultFill:"none", defaultStroke:"#1e293b", defaultStrokeW:2 },
  { name:"Download",  svgContent:`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>`, viewBox:"0 0 24 24", defaultFill:"none", defaultStroke:"#1e293b", defaultStrokeW:2 },
  { name:"Share",     svgContent:`<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>`, viewBox:"0 0 24 24", defaultFill:"none", defaultStroke:"#1e293b", defaultStrokeW:2 },
  { name:"Zap",       svgContent:`<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`, viewBox:"0 0 24 24", defaultFill:"none", defaultStroke:"#1e293b", defaultStrokeW:2 },
  { name:"Briefcase", svgContent:`<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>`, viewBox:"0 0 24 24", defaultFill:"none", defaultStroke:"#1e293b", defaultStrokeW:2 },
  { name:"Check",     svgContent:`<polyline points="20 6 9 17 4 12"/>`, viewBox:"0 0 24 24", defaultFill:"none", defaultStroke:"#22c55e", defaultStrokeW:3 },
  { name:"Info",      svgContent:`<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`, viewBox:"0 0 24 24", defaultFill:"none", defaultStroke:"#3b82f6", defaultStrokeW:2 },
];

// â"€â"€ Line presets â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const LINES: SvgDef[] = [
  { name:"Solid",   svgContent:`<line x1="5" y1="50" x2="95" y2="50" stroke-linecap="round"/>`,                              viewBox:"0 0 100 100", defaultFill:"none", defaultStroke:"#64748b", defaultStrokeW:6,  w:400, h:20 },
  { name:"Dashed",  svgContent:`<line x1="5" y1="50" x2="95" y2="50" stroke-dasharray="14 6" stroke-linecap="round"/>`,      viewBox:"0 0 100 100", defaultFill:"none", defaultStroke:"#64748b", defaultStrokeW:6,  w:400, h:20 },
  { name:"Dotted",  svgContent:`<line x1="5" y1="50" x2="95" y2="50" stroke-dasharray="2 10" stroke-linecap="round"/>`,      viewBox:"0 0 100 100", defaultFill:"none", defaultStroke:"#64748b", defaultStrokeW:8,  w:400, h:20 },
  { name:"Arrow",   svgContent:`<line x1="5" y1="50" x2="82" y2="50"/><polygon points="78,38 95,50 78,62" stroke="none"/>`,  viewBox:"0 0 100 100", defaultFill:"#64748b", defaultStroke:"#64748b", defaultStrokeW:5, w:300, h:30 },
  { name:"Wavy",    svgContent:`<path d="M5 50 Q17 30,30 50 T55 50 T80 50 T95 50" fill="none"/>`,                             viewBox:"0 0 100 100", defaultFill:"none", defaultStroke:"#64748b", defaultStrokeW:5,  w:400, h:40 },
  { name:"Double",  svgContent:`<line x1="5" y1="38" x2="95" y2="38"/><line x1="5" y1="62" x2="95" y2="62"/>`,              viewBox:"0 0 100 100", defaultFill:"none", defaultStroke:"#64748b", defaultStrokeW:4,  w:400, h:30 },
];

// â"€â"€ Gradient presets â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const GRADIENTS = [
  { name:"Sunset",    fill:"linear-gradient(135deg,#f97316,#ec4899)" },
  { name:"Ocean",     fill:"linear-gradient(135deg,#06b6d4,#3b82f6)" },
  { name:"Forest",    fill:"linear-gradient(135deg,#10b981,#059669)" },
  { name:"Purple",    fill:"linear-gradient(135deg,#8b5cf6,#6366f1)" },
  { name:"Peach",     fill:"linear-gradient(135deg,#fbbf24,#f97316)" },
  { name:"Rose",      fill:"linear-gradient(135deg,#fb7185,#e11d48)" },
  { name:"Sky",       fill:"linear-gradient(135deg,#7dd3fc,#38bdf8)" },
  { name:"Midnight",  fill:"linear-gradient(135deg,#1e293b,#334155)" },
  { name:"Gold",      fill:"linear-gradient(135deg,#fbbf24,#d97706)" },
  { name:"Mint",      fill:"linear-gradient(135deg,#6ee7b7,#34d399)" },
  { name:"Candy",     fill:"linear-gradient(135deg,#f0abfc,#818cf8)" },
  { name:"Flame",     fill:"linear-gradient(135deg,#ef4444,#f97316)" },
  { name:"Deep Blue", fill:"linear-gradient(135deg,#1d4ed8,#7c3aed)" },
  { name:"Matrix",    fill:"linear-gradient(135deg,#022c22,#064e3b)" },
  { name:"Space",     fill:"linear-gradient(135deg,#0f172a,#1e1b4b)" },
  { name:"Chrome",    fill:"linear-gradient(135deg,#9ca3af,#e5e7eb)" },
];

// â"€â"€ Stock photos â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const STOCK_PHOTOS = [
  { name:"Nature",       thumb:"https://picsum.photos/seed/forest/200/140",   full:"https://picsum.photos/seed/forest/1200/800" },
  { name:"City",         thumb:"https://picsum.photos/seed/city99/200/140",   full:"https://picsum.photos/seed/city99/1200/800" },
  { name:"Mountain",     thumb:"https://picsum.photos/seed/mtns/200/140",     full:"https://picsum.photos/seed/mtns/1200/800" },
  { name:"Ocean",        thumb:"https://picsum.photos/seed/ocean5/200/140",   full:"https://picsum.photos/seed/ocean5/1200/800" },
  { name:"Portrait",     thumb:"https://picsum.photos/seed/face1/200/280",    full:"https://picsum.photos/seed/face1/800/1100" },
  { name:"Architecture", thumb:"https://picsum.photos/seed/arch7/200/140",    full:"https://picsum.photos/seed/arch7/1200/800" },
  { name:"Abstract",     thumb:"https://picsum.photos/seed/abstract3/200/140",full:"https://picsum.photos/seed/abstract3/1200/800" },
  { name:"Texture",      thumb:"https://picsum.photos/seed/texture6/200/140", full:"https://picsum.photos/seed/texture6/1200/800" },
  { name:"Office",       thumb:"https://picsum.photos/seed/office2/200/140",  full:"https://picsum.photos/seed/office2/1200/800" },
  { name:"Technology",   thumb:"https://picsum.photos/seed/tech9/200/140",    full:"https://picsum.photos/seed/tech9/1200/800" },
  { name:"Food",         thumb:"https://picsum.photos/seed/food4/200/140",    full:"https://picsum.photos/seed/food4/1200/800" },
  { name:"Travel",       thumb:"https://picsum.photos/seed/travel8/200/140",  full:"https://picsum.photos/seed/travel8/1200/800" },
];

// â"€â"€ Stickers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const STICKERS = [
  "😀","😁","🤩","🔥","💯","⭐","🎉","🚀","❤️","💪",
  "✨","🎯","🌟","🎨","💡","👍","🏆","🌈","💎","🦋",
  "🌸","🎵","🎭","⚡","🌊","🦄","🍀","🎪","🌺","💫",
];

// â"€â"€ Button presets â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

interface BtnPreset { text:string; bgColor:string; textColor:string; radius:number; borderColor:string; borderW:number; }

const BUTTON_PRESETS: BtnPreset[] = [
  { text:"Get Started",   bgColor:"#3b82f6", textColor:"#fff",     radius:8,  borderColor:"none", borderW:0 },
  { text:"Learn More",    bgColor:"transparent", textColor:"#3b82f6", radius:8, borderColor:"#3b82f6", borderW:2 },
  { text:"Contact Us",    bgColor:"#1e293b", textColor:"#fff",     radius:8,  borderColor:"none", borderW:0 },
  { text:"Download",      bgColor:"#10b981", textColor:"#fff",     radius:8,  borderColor:"none", borderW:0 },
  { text:"See Portfolio", bgColor:"#8b5cf6", textColor:"#fff",     radius:24, borderColor:"none", borderW:0 },
  { text:"View Work",     bgColor:"#f97316", textColor:"#fff",     radius:4,  borderColor:"none", borderW:0 },
  { text:"Hire Me",       bgColor:"#ef4444", textColor:"#fff",     radius:8,  borderColor:"none", borderW:0 },
  { text:"Follow Me",     bgColor:"transparent", textColor:"#fff", radius:8,  borderColor:"#fff", borderW:2 },
];

// â"€â"€ Helpers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const uid = () => Math.random().toString(36).slice(2, 9);
const SYSTEM_FONTS = new Set(["Georgia","Times New Roman","Courier New","Arial","Verdana","Trebuchet MS","Palatino"]);
const fontFamily = (f: string) => SYSTEM_FONTS.has(f) ? f : `'${f}', sans-serif`;
const toHexColor = (color: string): string => {
  if (/^#[0-9a-fA-F]{3,6}$/.test(color)) return color;
  const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) return `#${(+m[1]).toString(16).padStart(2,"0")}${(+m[2]).toString(16).padStart(2,"0")}${(+m[3]).toString(16).padStart(2,"0")}`;
  return "#000000";
};

const makeText = (content: string, size: number, x=400, y=300): TextElem => ({
  id:uid(), type:"text", x, y, w:400, h:size*1.4+8,
  rot:0, z:1, opacity:1, locked:false,
  content, font:"Inter", size, bold:false, italic:false, underline:false,
  align:"center", color:"#000000", lh:1.3, ls:0,
});
const makeRect = (x=200, y=200): RectElem => ({
  id:uid(), type:"rect", x, y, w:300, h:180,
  rot:0, z:1, opacity:1, locked:false,
  fill:"#e2e8f0", stroke:"none", strokeW:2, radius:8,
});
const makeCircle = (x=200, y=200): CircleElem => ({
  id:uid(), type:"circle", x, y, w:160, h:160,
  rot:0, z:1, opacity:1, locked:false,
  fill:"#e2e8f0", stroke:"none", strokeW:2,
});
const makeImage = (src:string, x=200, y=200): ImageElem => ({
  id:uid(), type:"image", x, y, w:400, h:280,
  rot:0, z:1, opacity:1, locked:false,
  src, fit:"cover", radius:8,
});
const makeSvg = (def: SvgDef): SvgElem => ({
  id:uid(), type:"svg",
  x:(CW-(def.w??200))/2, y:200,
  w:def.w??200, h:def.h??200,
  rot:0, z:1, opacity:1, locked:false,
  svgContent:def.svgContent, viewBox:def.viewBox,
  fill:def.defaultFill, stroke:def.defaultStroke, strokeW:def.defaultStrokeW,
});
const makeVideo = (youtubeId: string): VideoElem => ({
  id:uid(), type:"video",
  x:(CW-560)/2, y:200,
  w:560, h:315,
  rot:0, z:1, opacity:1, locked:false,
  youtubeId, radius:8,
});
const makeButton = (preset: BtnPreset): ButtonElem => ({
  id:uid(), type:"button",
  x:(CW-200)/2, y:300,
  w:200, h:52,
  rot:0, z:1, opacity:1, locked:false,
  text:preset.text, font:"Inter", fontSize:16,
  textColor:preset.textColor, bgColor:preset.bgColor,
  radius:preset.radius, borderColor:preset.borderColor, borderW:preset.borderW,
});
const makeProgress = (): ProgressElem => ({
  id:uid(), type:"progress",
  x:(CW-400)/2, y:300,
  w:400, h:48,
  rot:0, z:1, opacity:1, locked:false,
  value:65, trackColor:"#e2e8f0", fillColor:"#3b82f6",
  radius:24, showLabel:true, labelColor:"#1e293b",
});

const blank = (): CanvasDoc => ({
  version:1,
  pages:[{ id:uid(), label:"Page 1", bg:"#ffffff", h:DEFAULT_H, elems:[] }],
});

// â"€â"€ Templates â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

// Template builder helpers â€" T.txt auto-calculates height from line count
const T = {
  txt: (content:string, size:number, x:number, y:number, color:string, extra:Partial<TextElem>={}) => {
    const lh = (extra as any).lh ?? 1.3;
    const w  = (extra as any).w ?? 400;
    // Estimate wrapped line count: account for explicit \n breaks AND word-wrap at width w.
    // ~0.52em average glyph advance for proportional fonts; min 1 row per explicit line.
    const charsPerLine = Math.max(1, Math.floor(w / (size * 0.52)));
    const lines = content.split("\n").reduce((sum, line) =>
      sum + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);
    const h = Math.ceil(size * lh * lines) + 16;
    return ({...makeText(content,size,x,y), color, align:"left", h, ...extra} as TextElem);
  },
  rect: (x:number, y:number, w:number, h:number, fill:string, extra:Partial<RectElem>={}) =>
    ({...makeRect(x,y), w, h, fill, ...extra} as RectElem),
  circ: (x:number, y:number, w:number, h:number, fill:string, extra:Partial<CircleElem>={}) =>
    ({...makeCircle(x,y), w, h, fill, ...extra} as CircleElem),
  btn: (text:string, x:number, y:number, w:number, bg:string, tc:string, r:number, bc="none", bw=0, bh=50, fs=13) =>
    ({...makeButton({text,bgColor:bg,textColor:tc,radius:r,borderColor:bc,borderW:bw}), x, y, w, h:bh, fontSize:fs} as ButtonElem),
  bar: (x:number, y:number, w:number, val:number, fill:string, track:string) =>
    ({...makeProgress(), x, y, w, h:10, value:val, fillColor:fill, trackColor:track, radius:5, showLabel:false, labelColor:"#fff", z:2} as ProgressElem),
  svg: (def:SvgDef, x:number, y:number, w:number, h:number, fill?:string, extra:Partial<SvgElem>={}) =>
    ({...makeSvg(def), x, y, w, h, fill:fill??def.defaultFill, ...extra} as SvgElem),
};

// Re-flow a template horizontally to fill the canvas width.
// Templates are authored at 1200px and stretched to the canvas (CW) width.
// X positions and widths scale by `sx` so the layout spreads to fill the width;
// element HEIGHTS and FONT SIZES are never touched (text/buttons keep their size).
// Circles and SVGs scale both dimensions (so they stay round, not stretched) and are
// re-centred vertically, this keeps concentric groups (e.g. the vinyl rings) aligned.
const scaleDocX = (doc: CanvasDoc, sx: number): CanvasDoc => ({
  ...doc,
  pages: doc.pages.map(p => ({
    ...p,
    elems: p.elems.map(el => {
      const x = Math.round(el.x * sx);
      const w = Math.round(el.w * sx);
      if (el.type === "circle" || el.type === "svg") {
        const cy = el.y + el.h / 2;
        const h = Math.round(el.h * sx);
        return { ...el, x, w, h, y: Math.round(cy - h / 2) };
      }
      return { ...el, x, w };
    }),
  })),
});

// ── Template 1: Photographer (Dark Gold / Editorial) ─────────────────────────
const photographerTemplate = (): CanvasDoc => {
  const p1: Page = { id:uid(), label:"Hero", bg:"#0a0a0a", h:960, elems:[
    T.rect(0,0,1200,70,"#0f0f0f",{z:10}),
    T.txt("LENS.CO",15,80,22,"#c9a96e",{font:"Bebas Neue",ls:4,w:140,align:"left",z:11}),
    T.txt("Portfolio    About    Services    Contact",12,680,24,"#555555",{font:"Inter",w:440,align:"right",z:11}),
    T.circ(940,-60,480,480,"#c9a96e",{opacity:0.06,z:1,anim:{type:"pulse",duration:5,delay:0,easing:"ease-in-out",repeat:"loop"}}),
    T.circ(820,620,260,260,"#c9a96e",{opacity:0.04,z:1,anim:{type:"float",duration:6,delay:1,easing:"ease-in-out",repeat:"loop"}}),
    T.txt("AWARD-WINNING PHOTOGRAPHY",11,80,140,"#c9a96e",{font:"Inter",fontWeight:700,ls:3,w:380,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.rect(80,132,40,2,"#c9a96e",{z:2}),
    T.txt("Visual\nStoryteller.",76,80,162,"#f5f5f0",{font:"Playfair Display",fontWeight:700,lh:1.0,w:600,z:2,anim:{type:"slideUp",duration:0.9,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("Capturing the emotion behind every frame.\nEditorial · Commercial · Fine Art · Events.",18,80,378,"#777777",{font:"Inter",lh:1.7,w:480,z:2,anim:{type:"fadeIn",duration:0.8,delay:0.5,easing:"ease-out",repeat:"once"}}),
    {...T.btn("Book a Session",80,464,210,"#c9a96e","#0a0a0a",0,"none",0,54,14),anim:{type:"slideUp",duration:0.6,delay:0.7,easing:"ease-out",repeat:"once"}} as ButtonElem,
    {...T.btn("View Portfolio",308,464,180,"transparent","#f5f5f0",0,"#333333",1,54,13),anim:{type:"slideUp",duration:0.6,delay:0.8,easing:"ease-out",repeat:"once"}} as ButtonElem,
    T.rect(680,88,220,300,"#161616",{radius:6,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.txt("YOUR PHOTO",12,694,224,"#2a2a2a",{font:"Inter",fontWeight:700,ls:2,w:192,align:"center",z:3}),
    T.rect(916,88,172,140,"#141414",{radius:6,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.txt("PHOTO",11,934,150,"#2a2a2a",{font:"Inter",fontWeight:700,ls:2,w:136,align:"center",z:3}),
    T.rect(916,244,172,144,"#121212",{radius:6,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.txt("PHOTO",11,934,308,"#2a2a2a",{font:"Inter",fontWeight:700,ls:2,w:136,align:"center",z:3}),
    T.rect(680,404,408,144,"#141414",{radius:6,z:2,anim:{type:"slideUp",duration:0.7,delay:0.6,easing:"ease-out",repeat:"once"}}),
    T.txt("FEATURED WORK",11,784,468,"#2a2a2a",{font:"Inter",fontWeight:700,ls:2,w:200,align:"center",z:3}),
    T.rect(0,860,1200,1,"#1a1a1a",{z:2}),
    T.txt("300+",26,130,876,"#f5f5f0",{font:"Montserrat",fontWeight:800,w:120,align:"center",z:2}),
    T.txt("SESSIONS",9,130,910,"#444444",{font:"Inter",fontWeight:700,ls:2,w:120,align:"center",z:2}),
    T.txt("60+",26,480,876,"#f5f5f0",{font:"Montserrat",fontWeight:800,w:100,align:"center",z:2}),
    T.txt("BRANDS",9,480,910,"#444444",{font:"Inter",fontWeight:700,ls:2,w:100,align:"center",z:2}),
    T.txt("14",26,840,876,"#f5f5f0",{font:"Montserrat",fontWeight:800,w:100,align:"center",z:2}),
    T.txt("AWARDS",9,840,910,"#444444",{font:"Inter",fontWeight:700,ls:2,w:100,align:"center",z:2}),
  ]};
  const p2: Page = { id:uid(), label:"Portfolio", bg:"#0a0a0a", h:920, elems:[
    T.txt("SELECTED",11,80,80,"#c9a96e",{font:"Inter",fontWeight:700,ls:4,w:200,z:2,anim:{type:"fadeIn",duration:0.6,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.txt("Work",58,80,104,"#f5f5f0",{font:"Playfair Display",fontWeight:700,lh:1.1,w:480,z:2,anim:{type:"slideUp",duration:0.7,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.rect(80,174,54,2,"#c9a96e",{z:2}),
    T.rect(80,196,326,240,"#111111",{radius:8,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.txt("EDITORIAL",9,98,216,"#c9a96e",{font:"Inter",fontWeight:700,ls:2,w:200,z:3}),
    T.txt("Vogue Spring\nEditorial",18,98,378,"#f5f5f0",{font:"Playfair Display",fontWeight:700,lh:1.2,w:280,z:4}),
    T.rect(424,196,326,240,"#111111",{radius:8,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.txt("COMMERCIAL",9,442,216,"#c9a96e",{font:"Inter",fontWeight:700,ls:2,w:200,z:3}),
    T.txt("Nike Campaign\n2025",18,442,378,"#f5f5f0",{font:"Playfair Display",fontWeight:700,lh:1.2,w:280,z:4}),
    T.rect(768,196,352,240,"#111111",{radius:8,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.txt("PORTRAIT",9,786,216,"#c9a96e",{font:"Inter",fontWeight:700,ls:2,w:200,z:3}),
    T.txt("Executive\nPortraits",18,786,378,"#f5f5f0",{font:"Playfair Display",fontWeight:700,lh:1.2,w:300,z:4}),
    T.rect(80,456,520,240,"#111111",{radius:8,z:2,anim:{type:"slideUp",duration:0.7,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.txt("FINE ART",9,98,476,"#c9a96e",{font:"Inter",fontWeight:700,ls:2,w:200,z:3}),
    T.txt("Abstract Series\nVol. IV",18,98,634,"#f5f5f0",{font:"Playfair Display",fontWeight:700,lh:1.2,w:460,z:4}),
    T.rect(618,456,502,240,"#111111",{radius:8,z:2,anim:{type:"slideUp",duration:0.7,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.txt("LANDSCAPE",9,636,476,"#c9a96e",{font:"Inter",fontWeight:700,ls:2,w:200,z:3}),
    T.txt("Golden Hour\nSeries",18,636,634,"#f5f5f0",{font:"Playfair Display",fontWeight:700,lh:1.2,w:420,z:4}),
    T.txt("View full gallery →",14,496,750,"#c9a96e",{font:"Inter",fontWeight:600,w:208,align:"center",z:2}),
  ]};
  const p3: Page = { id:uid(), label:"About", bg:"#0a0a0a", h:860, elems:[
    T.rect(0,0,560,860,"#0f0f0f",{z:1}),
    T.rect(72,80,380,480,"#161616",{radius:10,z:2,anim:{type:"fadeIn",duration:0.8,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.txt("YOUR\nPHOTO\nHERE",18,162,268,"#2a2a2a",{font:"Inter",fontWeight:700,ls:3,lh:1.6,w:200,align:"center",z:3}),
    T.circ(390,520,100,100,"#c9a96e",{opacity:0.15,z:2,anim:{type:"float",duration:4,delay:0,easing:"ease-in-out",repeat:"loop"}}),
    T.txt("BEHIND THE LENS",11,600,90,"#c9a96e",{font:"Inter",fontWeight:700,ls:3,w:380,z:2,anim:{type:"fadeIn",duration:0.6,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("12 Years of\nVisual Art.",52,600,114,"#f5f5f0",{font:"Playfair Display",fontWeight:700,lh:1.1,w:520,z:2,anim:{type:"slideLeft",duration:0.8,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.txt("Based in New York, I partner with brands\nand individuals to craft images that tell\nstories worth remembering.",16,600,286,"#666666",{font:"Inter",lh:1.75,w:500,z:2,anim:{type:"fadeIn",duration:0.8,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.txt("Available for editorial, commercial,\nweddings, and private commissions.",16,600,380,"#666666",{font:"Inter",lh:1.75,w:500,z:2,anim:{type:"fadeIn",duration:0.8,delay:0.6,easing:"ease-out",repeat:"once"}}),
    {...T.btn("Book a Consultation",600,470,240,"#c9a96e","#0a0a0a",0,"none",0,52,13),anim:{type:"fadeIn",duration:0.6,delay:0.8,easing:"ease-out",repeat:"once"}} as ButtonElem,
    T.txt("CLIENTS INCLUDE",10,600,572,"#333333",{font:"Inter",fontWeight:700,ls:3,w:300,z:2}),
    T.txt("Vogue  ·  Nike  ·  Apple  ·  Netflix  ·  Dior",14,600,598,"#555555",{font:"Inter",w:500,z:2}),
  ]};
  const p4: Page = { id:uid(), label:"Contact", bg:"#0a0a0a", h:800, elems:[
    T.rect(0,0,1200,800,"linear-gradient(150deg,#0a0a0a 55%,#150f08)",{z:1}),
    T.circ(880,60,440,440,"#c9a96e",{opacity:0.06,z:1,anim:{type:"pulse",duration:5,delay:0,easing:"ease-in-out",repeat:"loop"}}),
    T.txt("LET'S CREATE TOGETHER",11,80,110,"#c9a96e",{font:"Inter",fontWeight:700,ls:4,w:420,z:2,anim:{type:"fadeIn",duration:0.6,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.txt("Let's make\nsomething\nbeautiful.",68,80,138,"#f5f5f0",{font:"Playfair Display",fontWeight:700,lh:1.05,w:660,z:2,anim:{type:"slideUp",duration:0.9,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("hello@lens.co",20,80,406,"#c9a96e",{font:"Inter",fontWeight:500,w:320,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.txt("+1 (212) 555-0190",15,80,440,"#444444",{font:"Inter",w:280,z:2}),
    T.txt("New York, NY  ·  Available Worldwide",13,80,466,"#333333",{font:"Inter",w:380,z:2}),
    {...T.btn("Send Inquiry",80,524,200,"#c9a96e","#0a0a0a",0,"none",0,54,14),anim:{type:"slideUp",duration:0.6,delay:0.7,easing:"ease-out",repeat:"once"}} as ButtonElem,
    {...T.btn("Download Rate Card",296,524,210,"transparent","#f5f5f0",0,"#333333",1,54,13),anim:{type:"slideUp",duration:0.6,delay:0.8,easing:"ease-out",repeat:"once"}} as ButtonElem,
    T.txt("IG  /  VSCO  /  BEHANCE  /  LINKEDIN",12,80,618,"#333333",{font:"Inter",fontWeight:600,ls:2,w:360,z:2}),
    T.txt("© 2025 Lens.co  All rights reserved.",11,720,618,"#222222",{font:"Inter",w:400,align:"right",z:2}),
  ]};
  return scaleDocX({ version:1, pages:[p1,p2,p3,p4] }, 1920/1200);
};

// ── Template 2: Developer Portfolio (Dark Cyan / Code Aesthetic) ──────────────
const developerTemplate = (): CanvasDoc => {
  const p1: Page = { id:uid(), label:"Hero", bg:"#0d1117", h:960, elems:[
    T.rect(0,0,1200,66,"#161b22",{z:10}),
    T.txt("dev.io",14,80,21,"#58a6ff",{font:"Space Mono",w:120,align:"left",z:11}),
    T.txt("Work    Skills    Blog    Contact",12,700,21,"#484f58",{font:"Space Mono",w:400,align:"right",z:11}),
    T.rect(0,66,1200,1,"#21262d",{z:10}),
    T.circ(960,120,500,500,"#58a6ff",{opacity:0.04,z:1,anim:{type:"pulse",duration:6,delay:0,easing:"ease-in-out",repeat:"loop"}}),
    T.txt("> Hello, World.",13,80,130,"#3fb950",{font:"Space Mono",w:280,z:2,anim:{type:"fadeIn",duration:0.5,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.txt("Full Stack\nDeveloper.",72,80,160,"#e6edf3",{font:"Montserrat",fontWeight:800,lh:1.05,w:640,z:2,anim:{type:"slideUp",duration:0.9,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("I build fast, scalable web apps\nthat solve real problems.",18,80,370,"#8b949e",{font:"Inter",lh:1.7,w:480,z:2,anim:{type:"fadeIn",duration:0.8,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.rect(80,342,48,3,"#58a6ff",{radius:2,z:2}),
    {...T.btn("View My Work",80,446,190,"#238636","#ffffff",6,"none",0,52,14),anim:{type:"slideUp",duration:0.6,delay:0.7,easing:"ease-out",repeat:"once"}} as ButtonElem,
    {...T.btn("Get in Touch",286,446,180,"transparent","#58a6ff",6,"#30363d",1,52,13),anim:{type:"slideUp",duration:0.6,delay:0.8,easing:"ease-out",repeat:"once"}} as ButtonElem,
    T.rect(680,90,460,520,"#161b22",{radius:10,stroke:"#21262d",strokeW:1,z:2,anim:{type:"fadeIn",duration:0.8,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.rect(680,90,460,36,"#21262d",{radius:10,z:3}),
    T.circ(698,103,12,12,"#ff5f57",{z:4}),
    T.circ(718,103,12,12,"#febc2e",{z:4}),
    T.circ(738,103,12,12,"#28c840",{z:4}),
    T.txt("const portfolio = {",13,700,144,"#e6edf3",{font:"Space Mono",w:420,z:4}),
    T.txt("  name: \"Your Name\",",13,700,168,"#e6edf3",{font:"Space Mono",w:420,z:4}),
    T.txt("  role: \"Full Stack Dev\",",13,700,192,"#58a6ff",{font:"Space Mono",w:420,z:4}),
    T.txt("  skills: [\"React\", \"Node\",",13,700,216,"#e6edf3",{font:"Space Mono",w:420,z:4}),
    T.txt("    \"TypeScript\", \"AWS\"],",13,700,240,"#e6edf3",{font:"Space Mono",w:420,z:4}),
    T.txt("  available: true,",13,700,264,"#3fb950",{font:"Space Mono",w:420,z:4}),
    T.txt("  coffee: Infinity,",13,700,288,"#e6edf3",{font:"Space Mono",w:420,z:4}),
    T.txt("};",13,700,312,"#e6edf3",{font:"Space Mono",w:420,z:4}),
    T.txt("// Open to new opportunities",13,700,360,"#484f58",{font:"Space Mono",w:420,z:4}),
    T.rect(0,870,1200,1,"#21262d",{z:2}),
    T.txt("50+ Projects",16,130,886,"#e6edf3",{font:"Inter",fontWeight:700,w:160,align:"center",z:2}),
    T.txt("5 Years Exp",16,470,886,"#e6edf3",{font:"Inter",fontWeight:700,w:140,align:"center",z:2}),
    T.txt("20+ Clients",16,810,886,"#e6edf3",{font:"Inter",fontWeight:700,w:140,align:"center",z:2}),
  ]};
  const p2: Page = { id:uid(), label:"Projects", bg:"#0d1117", h:920, elems:[
    T.txt("Featured",48,80,80,"#e6edf3",{font:"Montserrat",fontWeight:800,lh:1.1,w:500,z:2,anim:{type:"slideUp",duration:0.7,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.txt("Projects",48,80,138,"#58a6ff",{font:"Montserrat",fontWeight:800,lh:1.1,w:500,z:2,anim:{type:"slideUp",duration:0.7,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.rect(80,200,540,240,"#161b22",{radius:10,stroke:"#21262d",strokeW:1,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.rect(80,200,540,6,"#238636",{radius:10,z:3}),
    T.txt("SaaS Dashboard",20,106,226,"#e6edf3",{font:"Inter",fontWeight:700,w:380,z:3}),
    T.txt("React  ·  TypeScript  ·  Node.js  ·  PostgreSQL",12,106,262,"#484f58",{font:"Space Mono",w:460,z:3}),
    T.txt("A full-stack analytics platform serving\n12,000+ active users worldwide.",14,106,292,"#8b949e",{font:"Inter",lh:1.6,w:490,z:3}),
    T.txt("Live Demo  →",13,106,384,"#58a6ff",{font:"Inter",fontWeight:600,w:140,z:3}),
    T.rect(660,200,460,240,"#161b22",{radius:10,stroke:"#21262d",strokeW:1,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.rect(660,200,460,6,"#58a6ff",{radius:10,z:3}),
    T.txt("AI Chat App",20,686,226,"#e6edf3",{font:"Inter",fontWeight:700,w:380,z:3}),
    T.txt("Next.js  ·  OpenAI  ·  Redis  ·  Vercel",12,686,262,"#484f58",{font:"Space Mono",w:400,z:3}),
    T.txt("Real-time AI assistant with RAG,\nused by 5,000+ daily active users.",14,686,292,"#8b949e",{font:"Inter",lh:1.6,w:420,z:3}),
    T.txt("GitHub  →",13,686,384,"#3fb950",{font:"Inter",fontWeight:600,w:120,z:3}),
    T.rect(80,464,540,240,"#161b22",{radius:10,stroke:"#21262d",strokeW:1,z:2,anim:{type:"slideUp",duration:0.7,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.rect(80,464,540,6,"#a371f7",{radius:10,z:3}),
    T.txt("E-Commerce Platform",20,106,490,"#e6edf3",{font:"Inter",fontWeight:700,w:380,z:3}),
    T.txt("Shopify  ·  React  ·  Stripe  ·  AWS",12,106,526,"#484f58",{font:"Space Mono",w:420,z:3}),
    T.txt("Custom storefront processing $2M+\nin annual transactions.",14,106,556,"#8b949e",{font:"Inter",lh:1.6,w:480,z:3}),
    T.txt("Case Study  →",13,106,648,"#a371f7",{font:"Inter",fontWeight:600,w:150,z:3}),
    T.rect(660,464,460,240,"#161b22",{radius:10,stroke:"#21262d",strokeW:1,z:2,anim:{type:"slideUp",duration:0.7,delay:0.6,easing:"ease-out",repeat:"once"}}),
    T.rect(660,464,460,6,"#f78166",{radius:10,z:3}),
    T.txt("DevOps Toolkit",20,686,490,"#e6edf3",{font:"Inter",fontWeight:700,w:380,z:3}),
    T.txt("Docker  ·  K8s  ·  Terraform  ·  CI/CD",12,686,526,"#484f58",{font:"Space Mono",w:400,z:3}),
    T.txt("Open-source toolkit with 2,400+\nGitHub stars.",14,686,556,"#8b949e",{font:"Inter",lh:1.6,w:420,z:3}),
    T.txt("GitHub  →",13,686,648,"#f78166",{font:"Inter",fontWeight:600,w:120,z:3}),
    T.txt("View all on GitHub →",15,510,754,"#58a6ff",{font:"Inter",fontWeight:600,w:252,align:"center",z:2}),
  ]};
  const p3: Page = { id:uid(), label:"Skills", bg:"#0d1117", h:860, elems:[
    T.txt("Tech Stack",48,80,80,"#e6edf3",{font:"Montserrat",fontWeight:800,w:500,z:2,anim:{type:"slideUp",duration:0.7,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.txt("& Skills",48,80,136,"#58a6ff",{font:"Montserrat",fontWeight:800,w:500,z:2,anim:{type:"slideUp",duration:0.7,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("Frontend",16,80,210,"#8b949e",{font:"Inter",fontWeight:600,w:200,z:2,anim:{type:"fadeIn",duration:0.6,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.txt("React / Next.js",14,80,238,"#e6edf3",{font:"Inter",w:300,z:2}),
    T.bar(80,262,500,92,"#58a6ff","#21262d"),
    T.txt("TypeScript",14,80,290,"#e6edf3",{font:"Inter",w:300,z:2}),
    T.bar(80,314,500,88,"#a371f7","#21262d"),
    T.txt("CSS / Tailwind",14,80,342,"#e6edf3",{font:"Inter",w:300,z:2}),
    T.bar(80,366,500,85,"#58a6ff","#21262d"),
    T.txt("Backend",16,80,416,"#8b949e",{font:"Inter",fontWeight:600,w:200,z:2,anim:{type:"fadeIn",duration:0.6,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.txt("Node.js / Express",14,80,444,"#e6edf3",{font:"Inter",w:300,z:2}),
    T.bar(80,468,500,90,"#3fb950","#21262d"),
    T.txt("PostgreSQL / MongoDB",14,80,496,"#e6edf3",{font:"Inter",w:300,z:2}),
    T.bar(80,520,500,82,"#3fb950","#21262d"),
    T.txt("AWS / Cloud",14,80,548,"#e6edf3",{font:"Inter",w:300,z:2}),
    T.bar(80,572,500,75,"#f78166","#21262d"),
    T.rect(640,196,500,560,"#161b22",{radius:10,stroke:"#21262d",strokeW:1,z:2,anim:{type:"slideLeft",duration:0.8,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.txt("Currently Building",16,680,228,"#8b949e",{font:"Inter",fontWeight:600,w:400,z:3}),
    T.txt("Something new\nis coming.",32,680,258,"#e6edf3",{font:"Montserrat",fontWeight:700,lh:1.2,w:400,z:3}),
    T.txt("Working on an open-source developer\ntoolkit. Sign up for early access.",15,680,342,"#8b949e",{font:"Inter",lh:1.7,w:420,z:3}),
    T.rect(680,420,380,44,"#21262d",{radius:6,z:3}),
    T.txt("your@email.com",14,700,430,"#484f58",{font:"Inter",w:280,z:4}),
    {...T.btn("Get Early Access",680,478,380,"#238636","#ffffff",6,"none",0,48,13),z:3} as ButtonElem,
    T.txt("🌟  2,400 devs already waiting",13,700,546,"#3fb950",{font:"Inter",fontWeight:600,w:340,z:3}),
  ]};
  const p4: Page = { id:uid(), label:"Contact", bg:"#0d1117", h:800, elems:[
    T.rect(0,0,1200,800,"#0d1117",{z:1}),
    T.circ(900,80,420,420,"#58a6ff",{opacity:0.04,z:1,anim:{type:"pulse",duration:5,delay:0,easing:"ease-in-out",repeat:"loop"}}),
    T.txt("LET'S WORK TOGETHER",11,80,110,"#3fb950",{font:"Space Mono",fontWeight:700,ls:2,w:440,z:2,anim:{type:"fadeIn",duration:0.6,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.txt("Open to new\nopportunities.",62,80,140,"#e6edf3",{font:"Montserrat",fontWeight:800,lh:1.05,w:720,z:2,anim:{type:"slideUp",duration:0.9,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("hello@dev.io",18,80,360,"#58a6ff",{font:"Space Mono",w:300,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.txt("Remote  ·  Open to Relocation",13,80,394,"#484f58",{font:"Inter",w:340,z:2}),
    {...T.btn("Send a Message",80,450,210,"#238636","#ffffff",6,"none",0,52,14),anim:{type:"slideUp",duration:0.6,delay:0.7,easing:"ease-out",repeat:"once"}} as ButtonElem,
    {...T.btn("Download Resume",308,450,200,"transparent","#58a6ff",6,"#30363d",1,52,13),anim:{type:"slideUp",duration:0.6,delay:0.8,easing:"ease-out",repeat:"once"}} as ButtonElem,
    T.txt("GH  /  LI  /  TW  /  DEV",12,80,546,"#333333",{font:"Space Mono",w:280,z:2}),
    T.txt("© 2025  Available for hire.",11,780,546,"#21262d",{font:"Space Mono",w:340,align:"right",z:2}),
  ]};
  return scaleDocX({ version:1, pages:[p1,p2,p3,p4] }, 1920/1200);
};

// ── Template 4: Brand Designer / Freelancer (Clean Indigo) ────────────────────
const designerTemplate = (): CanvasDoc => {
  const p1: Page = { id:uid(), label:"Hero", bg:"#f8fafc", h:960, elems:[
    T.rect(0,0,1200,72,"#ffffff",{z:10}),
    T.txt("Studio.",18,80,22,"#0f172a",{font:"Poppins",fontWeight:700,w:140,align:"left",z:11}),
    T.txt("Work    Services    Process    Contact",12,670,24,"#94a3b8",{font:"Inter",w:480,align:"right",z:11}),
    T.rect(0,72,1200,1,"#f1f5f9",{z:10}),
    T.circ(1000,-80,560,560,"#6366f1",{opacity:0.06,z:1,anim:{type:"pulse",duration:7,delay:0,easing:"ease-in-out",repeat:"loop"}}),
    T.circ(900,700,300,300,"#a78bfa",{opacity:0.08,z:1,anim:{type:"float",duration:6,delay:2,easing:"ease-in-out",repeat:"loop"}}),
    T.txt("BRANDING & DESIGN",10,80,140,"#6366f1",{font:"Inter",fontWeight:700,ls:4,w:280,z:2,anim:{type:"fadeIn",duration:0.6,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.txt("Design that\nmakes brands\nunforgettable.",64,80,166,"#0f172a",{font:"Poppins",fontWeight:700,lh:1.08,w:620,z:2,anim:{type:"slideUp",duration:0.9,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("Strategic brand identity, web design, and\nvisual systems for ambitious companies.",18,80,436,"#64748b",{font:"Inter",lh:1.7,w:520,z:2,anim:{type:"fadeIn",duration:0.8,delay:0.5,easing:"ease-out",repeat:"once"}}),
    {...T.btn("See My Work",80,514,200,"#6366f1","#ffffff",8,"none",0,54,15),anim:{type:"slideUp",duration:0.6,delay:0.7,easing:"ease-out",repeat:"once"}} as ButtonElem,
    {...T.btn("Let's Talk",298,514,180,"transparent","#0f172a",8,"#e2e8f0",1,54,14),anim:{type:"slideUp",duration:0.6,delay:0.8,easing:"ease-out",repeat:"once"}} as ButtonElem,
    T.rect(680,100,460,560,"#f1f5f9",{radius:20,z:2,anim:{type:"fadeIn",duration:0.8,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.rect(700,120,420,260,"#e0e7ff",{radius:14,z:3}),
    T.txt("YOUR WORK",14,820,234,"#818cf8",{font:"Inter",fontWeight:700,ls:2,w:180,align:"center",z:4}),
    T.rect(700,400,196,236,"#ddd6fe",{radius:14,z:3}),
    T.txt("PROJECT",11,722,508,"#a78bfa",{font:"Inter",fontWeight:700,ls:2,w:152,align:"center",z:4}),
    T.rect(912,400,208,116,"#c7d2fe",{radius:14,z:3}),
    T.txt("BRAND",11,934,450,"#6366f1",{font:"Inter",fontWeight:700,ls:2,w:164,align:"center",z:4}),
    T.rect(912,532,208,104,"#e0e7ff",{radius:14,z:3}),
    T.txt("WEB",11,934,576,"#818cf8",{font:"Inter",fontWeight:700,ls:2,w:164,align:"center",z:4}),
    T.rect(80,832,1040,1,"#e2e8f0",{z:2}),
    T.txt("80+ brands helped",15,100,852,"#0f172a",{font:"Inter",fontWeight:700,w:240,z:2}),
    T.txt("6 years experience",15,450,852,"#0f172a",{font:"Inter",fontWeight:700,w:250,z:2}),
    T.txt("98% client retention",15,810,852,"#0f172a",{font:"Inter",fontWeight:700,w:270,z:2}),
  ]};
  const p2: Page = { id:uid(), label:"Services", bg:"#f8fafc", h:920, elems:[
    T.txt("What I",42,80,80,"#0f172a",{font:"Poppins",fontWeight:700,w:400,z:2,anim:{type:"slideUp",duration:0.7,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.txt("Do Best",42,80,128,"#6366f1",{font:"Poppins",fontWeight:700,w:400,z:2,anim:{type:"slideUp",duration:0.7,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.rect(80,196,340,300,"#ffffff",{radius:16,stroke:"#e2e8f0",strokeW:1,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.rect(80,196,340,4,"#6366f1",{radius:16,z:3}),
    T.txt("01",32,108,228,"#e0e7ff",{font:"Poppins",fontWeight:800,w:100,z:3}),
    T.txt("Brand Identity",20,108,272,"#0f172a",{font:"Poppins",fontWeight:700,w:290,z:3}),
    T.txt("Logo systems, color palettes,\ntypography, brand guidelines\nand full identity packages.",14,108,308,"#64748b",{font:"Inter",lh:1.65,w:290,z:3}),
    T.txt("From $2,400 →",12,108,430,"#6366f1",{font:"Inter",fontWeight:600,w:180,z:3}),
    T.rect(440,196,340,300,"#ffffff",{radius:16,stroke:"#e2e8f0",strokeW:1,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.rect(440,196,340,4,"#a78bfa",{radius:16,z:3}),
    T.txt("02",32,468,228,"#f5f3ff",{font:"Poppins",fontWeight:800,w:100,z:3}),
    T.txt("Web Design",20,468,272,"#0f172a",{font:"Poppins",fontWeight:700,w:290,z:3}),
    T.txt("Figma prototypes, responsive\ndesign systems, and handoff-\nready UI for developers.",14,468,308,"#64748b",{font:"Inter",lh:1.65,w:290,z:3}),
    T.txt("From $3,800 →",12,468,430,"#a78bfa",{font:"Inter",fontWeight:600,w:180,z:3}),
    T.rect(800,196,340,300,"#ffffff",{radius:16,stroke:"#e2e8f0",strokeW:1,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.rect(800,196,340,4,"#06b6d4",{radius:16,z:3}),
    T.txt("03",32,828,228,"#cffafe",{font:"Poppins",fontWeight:800,w:100,z:3}),
    T.txt("Design Systems",20,828,272,"#0f172a",{font:"Poppins",fontWeight:700,w:290,z:3}),
    T.txt("Component libraries, design\ntokens, and scalable systems\nthat grow with your product.",14,828,308,"#64748b",{font:"Inter",lh:1.65,w:290,z:3}),
    T.txt("From $5,500 →",12,828,430,"#06b6d4",{font:"Inter",fontWeight:600,w:180,z:3}),
    T.rect(80,528,1040,270,"#0f172a",{radius:20,z:2,anim:{type:"slideUp",duration:0.8,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.txt("Need something custom?",32,130,568,"#ffffff",{font:"Poppins",fontWeight:700,lh:1.2,w:480,z:3}),
    T.txt("Let's talk about your project and\nbuild something that fits perfectly.",16,130,636,"#94a3b8",{font:"Inter",lh:1.65,w:440,z:3}),
    {...T.btn("Schedule a Call",130,690,220,"#6366f1","#ffffff",8,"none",0,52,14),z:3} as ButtonElem,
    T.txt("Free 30-min consultation",12,130,758,"#475569",{font:"Inter",w:260,z:3}),
  ]};
  const p3: Page = { id:uid(), label:"Work", bg:"#f8fafc", h:860, elems:[
    T.txt("Selected",42,80,80,"#0f172a",{font:"Poppins",fontWeight:700,w:400,z:2,anim:{type:"slideUp",duration:0.7,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.txt("Projects",42,80,128,"#6366f1",{font:"Poppins",fontWeight:700,w:400,z:2,anim:{type:"slideUp",duration:0.7,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.rect(80,196,560,280,"#ffffff",{radius:16,stroke:"#e2e8f0",strokeW:1,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.rect(80,196,560,160,"#e0e7ff",{radius:16,z:3}),
    T.txt("BRAND IDENTITY",10,108,216,"#818cf8",{font:"Inter",fontWeight:700,ls:2,w:300,z:4}),
    T.txt("Aura Wellness",20,108,346,"#0f172a",{font:"Poppins",fontWeight:700,w:380,z:4}),
    T.txt("Full rebrand · Logo · Packaging · Web",12,108,380,"#94a3b8",{font:"Inter",w:380,z:4}),
    T.txt("View Case Study →",12,108,430,"#6366f1",{font:"Inter",fontWeight:600,w:220,z:4}),
    T.rect(660,196,460,280,"#ffffff",{radius:16,stroke:"#e2e8f0",strokeW:1,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.rect(660,196,460,160,"#ddd6fe",{radius:16,z:3}),
    T.txt("WEB DESIGN",10,688,216,"#a78bfa",{font:"Inter",fontWeight:700,ls:2,w:300,z:4}),
    T.txt("Orbit Tech",20,688,346,"#0f172a",{font:"Poppins",fontWeight:700,w:380,z:4}),
    T.txt("SaaS landing page · Design system",12,688,380,"#94a3b8",{font:"Inter",w:380,z:4}),
    T.txt("View Case Study →",12,688,430,"#a78bfa",{font:"Inter",fontWeight:600,w:220,z:4}),
    T.rect(80,504,1040,280,"#ffffff",{radius:16,stroke:"#e2e8f0",strokeW:1,z:2,anim:{type:"slideUp",duration:0.7,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.rect(80,504,1040,160,"#cffafe",{radius:16,z:3}),
    T.txt("DESIGN SYSTEM",10,108,524,"#0891b2",{font:"Inter",fontWeight:700,ls:2,w:300,z:4}),
    T.txt("Nexus Design Language",20,108,654,"#0f172a",{font:"Poppins",fontWeight:700,w:500,z:4}),
    T.txt("400+ components · Figma + React · 6 months",12,108,690,"#94a3b8",{font:"Inter",w:500,z:4}),
    T.txt("View Case Study →",12,108,740,"#06b6d4",{font:"Inter",fontWeight:600,w:220,z:4}),
  ]};
  const p4: Page = { id:uid(), label:"Contact", bg:"#0f172a", h:800, elems:[
    T.circ(900,40,500,500,"#6366f1",{opacity:0.08,z:1,anim:{type:"pulse",duration:6,delay:0,easing:"ease-in-out",repeat:"loop"}}),
    T.txt("READY TO START?",10,80,110,"#818cf8",{font:"Inter",fontWeight:700,ls:4,w:280,z:2,anim:{type:"fadeIn",duration:0.6,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.txt("Let's build your\nbrand together.",62,80,138,"#f8fafc",{font:"Poppins",fontWeight:700,lh:1.08,w:700,z:2,anim:{type:"slideUp",duration:0.9,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("hello@studio.co",18,80,354,"#818cf8",{font:"Inter",fontWeight:500,w:300,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.txt("Currently taking projects for Q3 2025",13,80,390,"#475569",{font:"Inter",w:380,z:2}),
    {...T.btn("Start a Project",80,446,210,"#6366f1","#ffffff",8,"none",0,54,14),anim:{type:"slideUp",duration:0.6,delay:0.7,easing:"ease-out",repeat:"once"}} as ButtonElem,
    {...T.btn("Book a Call",308,446,180,"transparent","#f8fafc",8,"#334155",1,54,13),anim:{type:"slideUp",duration:0.6,delay:0.8,easing:"ease-out",repeat:"once"}} as ButtonElem,
    T.txt("TW  /  LI  /  DR  /  BE",12,80,546,"#334155",{font:"Inter",fontWeight:600,ls:2,w:260,z:2}),
    T.txt("© 2025 Studio.  All rights reserved.",11,770,546,"#1e293b",{font:"Inter",w:360,align:"right",z:2}),
  ]};
  return scaleDocX({ version:1, pages:[p1,p2,p3,p4] }, 1920/1200);
};

// ── Template 5: Influencer / Creator (Bold Dark + Vibrant) ───────────────────
const influencerTemplate = (): CanvasDoc => {
  const p1: Page = { id:uid(), label:"Home", bg:"#0f0f0f", h:960, elems:[
    T.rect(0,0,1200,68,"#151515",{z:10}),
    T.txt("@yourname",14,80,21,"#ffffff",{font:"Poppins",fontWeight:700,w:160,align:"left",z:11}),
    T.txt("Content    Brand Deals    Media Kit    Links",12,640,22,"#555555",{font:"Inter",w:500,align:"right",z:11}),
    T.circ(980,160,460,460,"#ff6b35",{opacity:0.08,z:1,anim:{type:"pulse",duration:5,delay:0,easing:"ease-in-out",repeat:"loop"}}),
    T.circ(200,700,320,320,"#a855f7",{opacity:0.06,z:1,anim:{type:"float",duration:7,delay:1,easing:"ease-in-out",repeat:"loop"}}),
    T.rect(0,68,6,892,"linear-gradient(to bottom,#ff6b35,#a855f7,#06b6d4)",{z:2,anim:{type:"slideDown",duration:1.2,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.txt("CONTENT CREATOR",10,80,130,"#ff6b35",{font:"Inter",fontWeight:700,ls:4,w:280,z:2,anim:{type:"fadeIn",duration:0.6,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.txt("Creating content\nthat actually\nhits different.",70,80,158,"#ffffff",{font:"Poppins",fontWeight:800,lh:1.05,w:640,z:2,anim:{type:"slideUp",duration:0.9,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("Lifestyle · Fashion · Travel · Mindset\n2.4M followers across platforms.",17,80,450,"#888888",{font:"Inter",lh:1.7,w:480,z:2,anim:{type:"fadeIn",duration:0.8,delay:0.5,easing:"ease-out",repeat:"once"}}),
    {...T.btn("Work With Me",80,524,200,"#ff6b35","#ffffff",100,"none",0,54,14),anim:{type:"slideUp",duration:0.6,delay:0.7,easing:"ease-out",repeat:"once"}} as ButtonElem,
    {...T.btn("Media Kit",298,524,170,"transparent","#ffffff",100,"#333333",1,54,13),anim:{type:"slideUp",duration:0.6,delay:0.8,easing:"ease-out",repeat:"once"}} as ButtonElem,
    T.rect(700,90,440,560,"#191919",{radius:16,z:2,anim:{type:"fadeIn",duration:0.8,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.txt("YOUR PHOTO",13,820,340,"#333333",{font:"Inter",fontWeight:700,ls:2,w:200,align:"center",z:3}),
    T.rect(700,90,440,6,"linear-gradient(to right,#ff6b35,#a855f7)",{radius:16,z:3}),
    T.txt("2.4M",26,718,664,"#ffffff",{font:"Poppins",fontWeight:800,w:120,align:"center",z:3}),
    T.txt("FOLLOWERS",9,718,698,"#555555",{font:"Inter",fontWeight:700,ls:2,w:120,align:"center",z:3}),
    T.txt("48M",26,862,664,"#ffffff",{font:"Poppins",fontWeight:800,w:120,align:"center",z:3}),
    T.txt("MONTHLY VIEWS",9,862,698,"#555555",{font:"Inter",fontWeight:700,ls:2,w:120,align:"center",z:3}),
    T.txt("94%",26,1006,664,"#ff6b35",{font:"Poppins",fontWeight:800,w:100,align:"center",z:3}),
    T.txt("ENG. RATE",9,1006,698,"#555555",{font:"Inter",fontWeight:700,ls:2,w:100,align:"center",z:3}),
  ]};
  const p2: Page = { id:uid(), label:"Content", bg:"#0f0f0f", h:920, elems:[
    T.txt("Latest",46,80,80,"#ffffff",{font:"Poppins",fontWeight:800,w:420,z:2,anim:{type:"slideUp",duration:0.7,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.txt("Content",46,80,134,"#ff6b35",{font:"Poppins",fontWeight:800,w:420,z:2,anim:{type:"slideUp",duration:0.7,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.rect(80,200,230,400,"#1a1a1a",{radius:14,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.rect(80,200,230,4,"#ff6b35",{radius:14,z:3}),
    T.txt("🎥  VIDEO",11,104,224,"#ff6b35",{font:"Inter",fontWeight:700,ls:1,w:180,z:3}),
    T.txt("A Day in My\nLife in Bali",17,104,366,"#ffffff",{font:"Poppins",fontWeight:700,lh:1.2,w:190,z:3}),
    T.txt("2.1M views",11,104,440,"#555555",{font:"Inter",w:180,z:3}),
    T.rect(330,200,230,400,"#1a1a1a",{radius:14,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.rect(330,200,230,4,"#a855f7",{radius:14,z:3}),
    T.txt("📸  PHOTO",11,354,224,"#a855f7",{font:"Inter",fontWeight:700,ls:1,w:180,z:3}),
    T.txt("Golden Hour\nShoot",17,354,366,"#ffffff",{font:"Poppins",fontWeight:700,lh:1.2,w:190,z:3}),
    T.txt("890K likes",11,354,440,"#555555",{font:"Inter",w:180,z:3}),
    T.rect(580,200,230,400,"#1a1a1a",{radius:14,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.rect(580,200,230,4,"#06b6d4",{radius:14,z:3}),
    T.txt("✍️  BLOG",11,604,224,"#06b6d4",{font:"Inter",fontWeight:700,ls:1,w:180,z:3}),
    T.txt("Morning\nRoutine Reset",17,604,366,"#ffffff",{font:"Poppins",fontWeight:700,lh:1.2,w:190,z:3}),
    T.txt("420K reads",11,604,440,"#555555",{font:"Inter",w:180,z:3}),
    T.rect(80,634,1040,220,"#151515",{radius:16,z:2,anim:{type:"slideUp",duration:0.8,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.txt("Want content like this\ndelivered weekly?",28,120,668,"#ffffff",{font:"Poppins",fontWeight:700,lh:1.2,w:480,z:3}),
    T.rect(640,672,380,44,"#222222",{radius:100,z:3}),
    T.txt("your@email.com",14,664,682,"#555555",{font:"Inter",w:260,z:4}),
    {...T.btn("Subscribe",640,730,380,"#ff6b35","#ffffff",100,"none",0,48,14),z:3} as ButtonElem,
  ]};
  const p3: Page = { id:uid(), label:"Collabs", bg:"#0f0f0f", h:860, elems:[
    T.txt("Brand",46,80,80,"#ffffff",{font:"Poppins",fontWeight:800,w:400,z:2,anim:{type:"slideUp",duration:0.7,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.txt("Partnerships",46,80,134,"#a855f7",{font:"Poppins",fontWeight:800,w:600,z:2,anim:{type:"slideUp",duration:0.7,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("I partner with brands that align with my values.\nAuthentic. Creative. Results-driven.",17,80,210,"#666666",{font:"Inter",lh:1.7,w:600,z:2,anim:{type:"fadeIn",duration:0.8,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.rect(80,268,280,220,"#191919",{radius:14,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.txt("🎯",36,172,310,"#ffffff",{font:"Inter",w:60,align:"center",z:3,anim:{type:"bounce",duration:0.8,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.txt("Dedicated Post",16,108,372,"#ffffff",{font:"Poppins",fontWeight:700,w:224,align:"center",z:3}),
    T.txt("One piece of\ncontent, full focus",13,108,408,"#555555",{font:"Inter",lh:1.5,w:224,align:"center",z:3}),
    T.rect(382,268,280,220,"#191919",{radius:14,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.txt("✨",36,474,310,"#ffffff",{font:"Inter",w:60,align:"center",z:3,anim:{type:"bounce",duration:0.8,delay:0.6,easing:"ease-out",repeat:"once"}}),
    T.txt("Brand Integration",16,410,372,"#ffffff",{font:"Poppins",fontWeight:700,w:224,align:"center",z:3}),
    T.txt("Woven naturally\ninto my content",13,410,408,"#555555",{font:"Inter",lh:1.5,w:224,align:"center",z:3}),
    T.rect(684,268,280,220,"#191919",{radius:14,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.txt("🚀",36,776,310,"#ffffff",{font:"Inter",w:60,align:"center",z:3,anim:{type:"bounce",duration:0.8,delay:0.7,easing:"ease-out",repeat:"once"}}),
    T.txt("Full Campaign",16,712,372,"#ffffff",{font:"Poppins",fontWeight:700,w:224,align:"center",z:3}),
    T.txt("Multi-platform\ncampaign package",13,712,408,"#555555",{font:"Inter",lh:1.5,w:224,align:"center",z:3}),
    T.rect(80,528,1040,260,"#151515",{radius:18,z:2,anim:{type:"slideUp",duration:0.8,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.rect(80,528,1040,4,"linear-gradient(to right,#ff6b35,#a855f7,#06b6d4)",{radius:18,z:3}),
    T.txt("Trusted by leading brands",13,80,566,"#555555",{font:"Inter",fontWeight:600,ls:2,w:400,z:3}),
    T.txt("Nike  ·  Sephora  ·  Airbnb  ·  Spotify  ·  Lululemon  ·  Apple",18,80,600,"#ffffff",{font:"Poppins",fontWeight:600,w:900,z:3}),
    {...T.btn("Get My Media Kit",80,650,220,"#ff6b35","#ffffff",100,"none",0,54,14),z:3} as ButtonElem,
    {...T.btn("collab@yourname.com",320,650,260,"transparent","#888888",100,"#2a2a2a",1,54,13),z:3} as ButtonElem,
  ]};
  return scaleDocX({ version:1, pages:[p1,p2,p3] }, 1920/1200);
};

// ── TEMPLATES 6-16 ────────────────────────────────────────────────────────────
// ── Template 6: Music Artist ──────────────────────────────────────────────────
const musicArtistTemplate = (): CanvasDoc => {
  const p1: Page = { id:uid(), label:"Hero", bg:"#080812", h:960, elems:[
    T.rect(0,0,1200,66,"#0c0c1a",{z:10}),
    T.txt("ARTIST NAME",15,80,21,"#00e5ff",{font:"Bebas Neue",ls:6,w:200,z:11}),
    T.txt("Music    Shows    Press    Contact",12,690,22,"#4a4a6a",{font:"Inter",w:450,align:"right",z:11}),
    T.rect(0,66,1200,1,"rgba(0,229,255,0.08)",{z:10}),
    // concentric vinyl circles, all centered at (1080, 260)
    T.circ(740,-80,680,680,"#0c0c22",{z:1}),
    T.circ(820,0,520,520,"#0a0a1a",{z:1,stroke:"rgba(0,229,255,0.07)",strokeW:1}),
    T.circ(900,80,360,360,"#0d0d20",{z:1,stroke:"rgba(0,229,255,0.1)",strokeW:1}),
    T.circ(980,160,200,200,"#111130",{z:1,stroke:"rgba(0,229,255,0.14)",strokeW:2}),
    T.circ(1050,230,60,60,"#1a1a40",{z:2}),
    T.circ(1070,250,20,20,"#00e5ff",{opacity:0.8,z:3,anim:{type:"pulse",duration:3,delay:0,easing:"ease-in-out",repeat:"loop"}}),
    // gradient left accent strip
    T.rect(0,66,5,894,"linear-gradient(to bottom,#00e5ff,#9333ea,transparent)",{z:3}),
    T.txt("NEW SINGLE OUT NOW",10,80,132,"#00e5ff",{font:"Inter",fontWeight:700,ls:4,w:300,z:4,anim:{type:"fadeIn",duration:0.6,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.txt("YOUR\nARTIST\nNAME.",90,80,158,"#f0f0ff",{font:"Bebas Neue",ls:2,lh:0.93,w:640,z:4,anim:{type:"slideUp",duration:0.9,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("Electronic · Hip-Hop · Alternative\n2.8M monthly listeners across platforms.",16,80,488,"#444466",{font:"Inter",lh:1.65,w:480,z:4,anim:{type:"fadeIn",duration:0.8,delay:0.5,easing:"ease-out",repeat:"once"}}),
    {...T.btn("▶  Listen Now",80,570,190,"#00e5ff","#080812",100),anim:{type:"slideUp",duration:0.6,delay:0.7,easing:"ease-out",repeat:"once"}} as ButtonElem,
    {...T.btn("Book a Show",290,570,175,"transparent","#f0f0ff",100,"#222244",1),anim:{type:"slideUp",duration:0.6,delay:0.8,easing:"ease-out",repeat:"once"}} as ButtonElem,
    T.rect(0,870,1200,1,"rgba(255,255,255,0.04)",{z:3}),
    T.txt("2.8M",30,90,880,"#00e5ff",{font:"Bebas Neue",w:140,align:"center",z:4}),
    T.txt("MONTHLY LISTENERS",9,90,918,"#4a4a6a",{font:"Inter",fontWeight:700,ls:2,w:140,align:"center",z:4}),
    T.txt("640K",30,390,880,"#9333ea",{font:"Bebas Neue",w:140,align:"center",z:4}),
    T.txt("FOLLOWERS",9,390,918,"#4a4a6a",{font:"Inter",fontWeight:700,ls:2,w:140,align:"center",z:4}),
    T.txt("12",30,690,880,"#f0f0ff",{font:"Bebas Neue",w:100,align:"center",z:4}),
    T.txt("RELEASES",9,690,918,"#4a4a6a",{font:"Inter",fontWeight:700,ls:2,w:100,align:"center",z:4}),
    T.txt("#3",30,940,880,"#f0f0ff",{font:"Bebas Neue",w:80,align:"center",z:4}),
    T.txt("CHART PEAK",9,940,918,"#4a4a6a",{font:"Inter",fontWeight:700,ls:2,w:80,align:"center",z:4}),
  ]};
  const p2: Page = { id:uid(), label:"Discography", bg:"#080812", h:920, elems:[
    T.txt("DISCOGRAPHY",11,80,80,"#00e5ff",{font:"Inter",fontWeight:700,ls:4,w:280,z:2,anim:{type:"fadeIn",duration:0.6,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.txt("Releases",52,80,104,"#f0f0ff",{font:"Bebas Neue",ls:2,lh:1.1,w:500,z:2,anim:{type:"slideUp",duration:0.7,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.rect(80,180,355,320,"#0e0e24",{radius:14,stroke:"rgba(0,229,255,0.1)",strokeW:1,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.rect(80,180,355,180,"#14143a",{radius:14,z:3}),
    T.txt("ALBUM",9,108,200,"#00e5ff",{font:"Inter",fontWeight:700,ls:3,w:180,z:4}),
    T.txt("Neon Dreams",24,108,328,"#f0f0ff",{font:"Bebas Neue",ls:1,w:300,z:4}),
    T.txt("2025  ·  12 tracks",12,108,360,"#555577",{font:"Inter",w:260,z:4}),
    T.txt("Chart peak",11,108,394,"#444466",{font:"Inter",w:100,z:4}), T.bar(200,396,200,95,"#00e5ff","#1a1a38"),
    T.rect(455,180,355,320,"#0e0e24",{radius:14,stroke:"rgba(147,51,234,0.12)",strokeW:1,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.rect(455,180,355,180,"#180d2e",{radius:14,z:3}),
    T.txt("EP",9,483,200,"#9333ea",{font:"Inter",fontWeight:700,ls:3,w:80,z:4}),
    T.txt("Void Signal",24,483,328,"#f0f0ff",{font:"Bebas Neue",ls:1,w:280,z:4}),
    T.txt("2024  ·  6 tracks",12,483,360,"#555577",{font:"Inter",w:260,z:4}),
    T.txt("Chart peak",11,483,394,"#444466",{font:"Inter",w:100,z:4}), T.bar(573,396,200,78,"#9333ea","#1a1a38"),
    T.rect(830,180,290,320,"#0e0e24",{radius:14,stroke:"rgba(244,63,94,0.1)",strokeW:1,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.rect(830,180,290,180,"#1a1010",{radius:14,z:3}),
    T.txt("SINGLE",9,858,200,"#f43f5e",{font:"Inter",fontWeight:700,ls:3,w:180,z:4}),
    T.txt("Red Circuit",24,858,328,"#f0f0ff",{font:"Bebas Neue",ls:1,w:240,z:4}),
    T.txt("2024  ·  1 track",12,858,360,"#555577",{font:"Inter",w:220,z:4}),
    T.txt("Chart peak",11,858,394,"#444466",{font:"Inter",w:100,z:4}), T.bar(948,396,140,88,"#f43f5e","#1a1a38"),
    T.rect(80,536,1040,296,"#0c0c20",{radius:16,stroke:"rgba(0,229,255,0.07)",strokeW:1,z:2,anim:{type:"slideUp",duration:0.8,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.txt("FEATURED TRACK",9,120,566,"#00e5ff",{font:"Inter",fontWeight:700,ls:3,w:260,z:3}),
    T.txt("Neon Dreams",28,120,590,"#f0f0ff",{font:"Bebas Neue",ls:1,w:400,z:3}),
    T.txt("From \"Neon Dreams\" · 3:42 · 28M streams",13,120,628,"#555577",{font:"Inter",w:400,z:3}),
    {...T.btn("▶  Play",120,666,150,"#00e5ff","#080812",100),z:3} as ButtonElem,
    {...T.btn("+ Library",290,666,170,"transparent","#f0f0ff",100,"#222244",1),z:3} as ButtonElem,
    T.bar(600,590,460,100,"rgba(0,229,255,0.5)","rgba(0,229,255,0.08)"),
    T.bar(600,610,460,70,"rgba(0,229,255,0.35)","rgba(0,229,255,0.08)"),
    T.bar(600,630,460,90,"rgba(0,229,255,0.25)","rgba(0,229,255,0.08)"),
    T.bar(600,650,460,55,"rgba(0,229,255,0.15)","rgba(0,229,255,0.08)"),
    T.bar(600,670,460,80,"rgba(0,229,255,0.2)","rgba(0,229,255,0.08)"),
  ]};
  const p3: Page = { id:uid(), label:"Shows", bg:"#080812", h:860, elems:[
    T.txt("UPCOMING",11,80,80,"#00e5ff",{font:"Inter",fontWeight:700,ls:4,w:200,z:2}),
    T.txt("Live Shows",52,80,104,"#f0f0ff",{font:"Bebas Neue",ls:2,lh:1.1,w:500,z:2,anim:{type:"slideUp",duration:0.7,delay:0.1,easing:"ease-out",repeat:"once"}}),
    ...[
      {d:"JUN 14",y:2025,venue:"Brooklyn Mirage",city:"New York, NY",info:"Doors 9PM · All Ages",color:"#00e5ff",sold:true,top:186},
      {d:"JUL 2",y:2025,venue:"The Shrine",city:"Los Angeles, CA",info:"Doors 8PM · 18+",color:"#9333ea",sold:false,top:310},
      {d:"JUL 19",y:2025,venue:"Printworks",city:"London, UK",info:"Doors 10PM · 18+",color:"#f43f5e",sold:false,top:434},
      {d:"AUG 3",y:2025,venue:"Fabric",city:"Berlin, Germany",info:"Doors 11PM · 21+",color:"#f0f0ff",sold:false,top:558},
    ].flatMap(s=>[
      T.rect(80,s.top,1040,104,"#0e0e24",{radius:12,stroke:`rgba(255,255,255,0.04)`,strokeW:1,z:2,anim:{type:"slideUp",duration:0.5,delay:0.1*(s.top/186),easing:"ease-out",repeat:"once"}}),
      T.rect(80,s.top,4,104,s.color,{z:3}),
      T.txt(s.d,20,110,s.top+22,s.color,{font:"Bebas Neue",ls:1,w:120,z:4}),
      T.txt(String(s.y),11,110,s.top+50,"#4a4a6a",{font:"Inter",w:80,z:4}),
      T.txt(s.venue,22,268,s.top+20,"#f0f0ff",{font:"Poppins",fontWeight:700,w:440,z:4}),
      T.txt(`${s.city} · ${s.info}`,13,268,s.top+54,"#555577",{font:"Inter",w:400,z:4}),
      {...T.btn(s.sold?"SOLD OUT":"Get Tickets →",830,s.top+22,220,s.sold?"#1a1a35":"#9333ea",s.sold?"#555577":"#ffffff",8,s.sold?"#222244":"none",s.sold?1:0,60,12),z:4} as ButtonElem,
    ]),
    T.txt("Can't make a show? Book a private event.",15,440,706,"#555577",{font:"Inter",w:320,align:"center",z:2}),
    {...T.btn("Private Booking",440,738,320,"#00e5ff","#080812",100),z:2} as ButtonElem,
  ]};
  const p4: Page = { id:uid(), label:"Connect", bg:"#080812", h:800, elems:[
    T.rect(0,0,1200,800,"linear-gradient(160deg,#080812 55%,#0d0822)",{z:1}),
    T.circ(880,60,420,420,"#9333ea",{opacity:0.07,z:1,anim:{type:"pulse",duration:5,delay:0,easing:"ease-in-out",repeat:"loop"}}),
    T.rect(0,0,5,800,"linear-gradient(to bottom,#9333ea,#00e5ff,transparent)",{z:2}),
    T.txt("BOOKING & PRESS",10,80,110,"#00e5ff",{font:"Inter",fontWeight:700,ls:4,w:300,z:3}),
    T.txt("Let's create\nsomething\nunforgettable.",68,80,138,"#f0f0ff",{font:"Bebas Neue",ls:2,lh:0.93,w:680,z:3,anim:{type:"slideUp",duration:0.9,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("booking@artistname.com",20,80,398,"#00e5ff",{font:"Inter",fontWeight:500,w:340,z:3}),
    T.txt("Management: mgmt@agency.com",14,80,432,"#4a4a6a",{font:"Inter",w:360,z:3}),
    T.txt("Press inquiries: press@artistname.com",14,80,456,"#4a4a6a",{font:"Inter",w:360,z:3}),
    {...T.btn("Send Inquiry",80,514,200,"#00e5ff","#080812",100),anim:{type:"slideUp",duration:0.6,delay:0.7,easing:"ease-out",repeat:"once"}} as ButtonElem,
    {...T.btn("Press Kit",298,514,175,"transparent","#f0f0ff",100,"#222244",1),anim:{type:"slideUp",duration:0.6,delay:0.8,easing:"ease-out",repeat:"once"}} as ButtonElem,
    T.txt("IG  /  TW  /  SP  /  SC  /  YT",12,80,614,"#444466",{font:"Inter",fontWeight:600,ls:2,w:340,z:3}),
  ]};
  return scaleDocX({ version:1, pages:[p1,p2,p3,p4] }, 1920/1200);
};

// ── Template 7: Creative Agency (Bold Split Layout) ───────────────────────────
const agencyTemplate = (): CanvasDoc => {
  const p1: Page = { id:uid(), label:"Hero", bg:"#ffffff", h:960, elems:[
    T.rect(0,0,400,960,"#0a0a0a",{z:1}),
    // bold stacked word composition on dark panel
    T.txt("WE\nBUILD\nBRANDS\nTHAT\nLAST.",56,40,120,"#ffffff",{font:"Montserrat",fontWeight:800,lh:1.02,w:320,z:3,anim:{type:"slideRight",duration:0.9,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.circ(-80,700,300,300,"#1a1a1a",{z:2,anim:{type:"float",duration:9,delay:0,easing:"ease-in-out",repeat:"loop"}}),
    T.circ(180,810,120,120,"#f43f5e",{opacity:0.12,z:2,anim:{type:"pulse",duration:4,delay:1,easing:"ease-in-out",repeat:"loop"}}),
    T.txt("CREATIVE AGENCY",8,40,882,"#222222",{font:"Inter",fontWeight:700,ls:4,w:240,z:3}),
    T.txt("Est. 2019  ·  120+ brands",11,40,906,"#333333",{font:"Inter",w:220,z:3}),
    // right side content
    T.txt("We craft strategic brand identities, digital experiences, and visual systems for ambitious companies ready to lead.",20,460,160,"#0a0a0a",{font:"Inter",lh:1.7,w:620,z:2,anim:{type:"fadeIn",duration:0.8,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.rect(460,322,620,1,"#f1f5f9",{z:2}),
    T.txt("120+",52,460,350,"#0a0a0a",{font:"Montserrat",fontWeight:800,w:160,z:2,anim:{type:"zoomIn",duration:0.6,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.txt("Brands Launched",12,460,412,"#94a3b8",{font:"Inter",w:160,z:2}),
    T.txt("8",52,660,350,"#f43f5e",{font:"Montserrat",fontWeight:800,w:80,z:2,anim:{type:"zoomIn",duration:0.6,delay:0.6,easing:"ease-out",repeat:"once"}}),
    T.txt("Design Awards",12,660,412,"#94a3b8",{font:"Inter",w:140,z:2}),
    T.txt("$2M+",52,840,350,"#0a0a0a",{font:"Montserrat",fontWeight:800,w:160,z:2,anim:{type:"zoomIn",duration:0.6,delay:0.7,easing:"ease-out",repeat:"once"}}),
    T.txt("Client Revenue",12,840,412,"#94a3b8",{font:"Inter",w:150,z:2}),
    T.rect(460,448,620,1,"#f1f5f9",{z:2}),
    T.txt("RECENT WORK",9,460,476,"#94a3b8",{font:"Inter",fontWeight:700,ls:3,w:200,z:2}),
    T.rect(460,504,185,212,"#f1f5f9",{radius:12,z:2,anim:{type:"slideUp",duration:0.6,delay:0.6,easing:"ease-out",repeat:"once"}}),
    T.txt("BRAND",11,508,598,"#94a3b8",{font:"Inter",fontWeight:700,ls:2,w:89,align:"center",z:3}),
    T.rect(660,504,185,212,"#0a0a0a",{radius:12,z:2,anim:{type:"slideUp",duration:0.6,delay:0.7,easing:"ease-out",repeat:"once"}}),
    T.txt("WEB",11,708,598,"#555555",{font:"Inter",fontWeight:700,ls:2,w:89,align:"center",z:3}),
    T.rect(860,504,185,212,"linear-gradient(135deg,#f43f5e22,#f43f5e44)",{radius:12,stroke:"#f43f5e33",strokeW:1,z:2,anim:{type:"slideUp",duration:0.6,delay:0.8,easing:"ease-out",repeat:"once"}}),
    T.txt("IDENTITY",11,908,598,"#f43f5e",{font:"Inter",fontWeight:700,ls:2,w:89,align:"center",z:3}),
    {...T.btn("See All Work →",460,764,220,"#0a0a0a","#ffffff",8),anim:{type:"fadeIn",duration:0.6,delay:0.9,easing:"ease-out",repeat:"once"}} as ButtonElem,
    {...T.btn("Start a Project",700,764,200,"transparent","#0a0a0a",8,"#e2e8f0",1),anim:{type:"fadeIn",duration:0.6,delay:1.0,easing:"ease-out",repeat:"once"}} as ButtonElem,
  ]};
  const p2: Page = { id:uid(), label:"Services", bg:"#ffffff", h:920, elems:[
    T.rect(0,0,400,920,"#0a0a0a",{z:1}),
    T.txt("OUR\nSERVICES",44,40,90,"#ffffff",{font:"Montserrat",fontWeight:800,lh:1.1,w:320,z:3,anim:{type:"slideRight",duration:0.7,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.txt("Full-spectrum creative for modern businesses.",15,40,230,"#444444",{font:"Inter",lh:1.7,w:320,z:3}),
    T.circ(200,680,200,200,"#1a1a1a",{z:2,anim:{type:"float",duration:7,delay:0,easing:"ease-in-out",repeat:"loop"}}),
    T.circ(40,830,110,110,"#f43f5e",{opacity:0.1,z:2,anim:{type:"pulse",duration:5,delay:2,easing:"ease-in-out",repeat:"loop"}}),
    {...T.btn("Get a Quote",40,830,300,"#f43f5e","#ffffff",8),z:3} as ButtonElem,
    T.rect(460,70,680,158,"#f8fafc",{radius:14,stroke:"#f1f5f9",strokeW:1,z:2,anim:{type:"slideLeft",duration:0.6,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.rect(460,70,680,4,"#f43f5e",{radius:14,z:3}),
    T.txt("01 – Brand Identity",20,498,96,"#0a0a0a",{font:"Montserrat",fontWeight:700,w:500,z:3}),
    T.txt("Logo, color palette, typography, brand guidelines, and full visual identity systems.",14,498,132,"#64748b",{font:"Inter",lh:1.6,w:580,z:3}),
    T.rect(460,248,680,158,"#f8fafc",{radius:14,stroke:"#f1f5f9",strokeW:1,z:2,anim:{type:"slideLeft",duration:0.6,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.rect(460,248,680,4,"#6366f1",{radius:14,z:3}),
    T.txt("02 – Web Design & Dev",20,498,274,"#0a0a0a",{font:"Montserrat",fontWeight:700,w:520,z:3}),
    T.txt("Beautiful, conversion-focused websites and landing pages built to perform.",14,498,310,"#64748b",{font:"Inter",lh:1.6,w:580,z:3}),
    T.rect(460,426,680,158,"#0a0a0a",{radius:14,z:2,anim:{type:"slideLeft",duration:0.6,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.rect(460,426,4,158,"#f43f5e",{z:3}),
    T.txt("03 – Campaigns",20,498,452,"#ffffff",{font:"Montserrat",fontWeight:700,w:500,z:3}),
    T.txt("End-to-end strategy, creative assets, and performance creative that converts.",14,498,488,"#666666",{font:"Inter",lh:1.6,w:580,z:3}),
    T.rect(460,604,680,158,"#f8fafc",{radius:14,stroke:"#f1f5f9",strokeW:1,z:2,anim:{type:"slideLeft",duration:0.6,delay:0.6,easing:"ease-out",repeat:"once"}}),
    T.rect(460,604,680,4,"#06b6d4",{radius:14,z:3}),
    T.txt("04 – Strategy & Consulting",20,498,630,"#0a0a0a",{font:"Montserrat",fontWeight:700,w:560,z:3}),
    T.txt("Market positioning, competitor analysis, and go-to-market planning.",14,498,666,"#64748b",{font:"Inter",lh:1.6,w:580,z:3}),
    T.txt("Free 30-min strategy call with every project →",14,498,786,"#f43f5e",{font:"Inter",fontWeight:600,w:460,z:3}),
  ]};
  const p3: Page = { id:uid(), label:"Case Studies", bg:"#ffffff", h:900, elems:[
    T.txt("CASE STUDIES",9,80,80,"#94a3b8",{font:"Inter",fontWeight:700,ls:4,w:240,z:2}),
    T.txt("Work That\nMoved Brands.",52,80,106,"#0a0a0a",{font:"Montserrat",fontWeight:800,lh:1.1,w:640,z:2,anim:{type:"slideUp",duration:0.8,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.rect(80,208,1040,274,"#0a0a0a",{radius:18,z:2,anim:{type:"fadeIn",duration:0.8,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.rect(80,208,4,274,"#f43f5e",{z:3}),
    T.txt("FEATURED PROJECT",9,116,232,"#f43f5e",{font:"Inter",fontWeight:700,ls:3,w:240,z:3}),
    T.txt("Luxe Skincare",30,116,256,"#ffffff",{font:"Montserrat",fontWeight:800,w:480,z:3}),
    T.txt("Full rebrand + web design + launch campaign",15,116,298,"#555555",{font:"Inter",w:520,z:3}),
    T.txt("340% conversion increase  ·  $1.2M first-year revenue",13,116,328,"#888888",{font:"Inter",lh:1.7,w:540,z:3}),
    T.bar(116,362,480,340,"#f43f5e","#1a1a1a"),
    T.bar(116,382,480,85,"rgba(244,63,94,0.5)","#1a1a1a"),
    {...T.btn("View Case Study →",116,430,220,"#f43f5e","#ffffff",8),z:3} as ButtonElem,
    T.rect(760,240,320,210,"#1a1a1a",{radius:12,z:3}),
    T.txt("Luxe Brand Preview",13,820,334,"#333333",{font:"Inter",fontWeight:700,ls:1,w:200,align:"center",z:4}),
    T.rect(80,510,500,306,"#f8fafc",{radius:16,stroke:"#f1f5f9",strokeW:1,z:2,anim:{type:"slideUp",duration:0.7,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.rect(80,510,500,4,"#6366f1",{radius:16,z:3}),
    T.txt("Orbit SaaS",20,108,534,"#0a0a0a",{font:"Montserrat",fontWeight:700,w:380,z:3}),
    T.txt("Brand Identity + Web Design",12,108,566,"#94a3b8",{font:"Inter",w:360,z:3}),
    T.txt("150% growth in signups after launch",13,108,596,"#64748b",{font:"Inter",w:380,z:3}),
    T.bar(108,630,400,150,"#6366f1","#e2e8f0"),
    T.txt("Signups",10,108,652,"#94a3b8",{font:"Inter",w:80,z:3}), T.txt("Growth",10,440,652,"#6366f1",{font:"Inter",fontWeight:600,w:60,z:3}),
    T.txt("View Case Study →",12,108,764,"#6366f1",{font:"Inter",fontWeight:600,w:220,z:3}),
    T.rect(620,510,500,306,"#0a0a0a",{radius:16,z:2,anim:{type:"slideUp",duration:0.7,delay:0.6,easing:"ease-out",repeat:"once"}}),
    T.rect(620,510,500,4,"#06b6d4",{radius:16,z:3}),
    T.txt("Wave Music",20,648,534,"#ffffff",{font:"Montserrat",fontWeight:700,w:380,z:3}),
    T.txt("Brand Identity + Merch",12,648,566,"#444444",{font:"Inter",w:360,z:3}),
    T.txt("3x more press mentions",13,648,596,"#888888",{font:"Inter",w:380,z:3}),
    T.bar(648,630,400,80,"#06b6d4","#1a1a1a"),
    T.txt("Press",10,648,652,"#555555",{font:"Inter",w:60,z:3}), T.txt("Growth",10,980,652,"#06b6d4",{font:"Inter",fontWeight:600,w:60,z:3}),
    T.txt("View Case Study →",12,648,764,"#06b6d4",{font:"Inter",fontWeight:600,w:220,z:3}),
  ]};
  const p4: Page = { id:uid(), label:"Contact", bg:"#0a0a0a", h:800, elems:[
    T.rect(400,0,800,800,"#ffffff",{z:1}),
    T.txt("Ready to\nbuild\nsomething?",52,40,120,"#ffffff",{font:"Montserrat",fontWeight:800,lh:1.1,w:340,z:2,anim:{type:"slideRight",duration:0.8,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("hello@agency.co",17,40,368,"#f43f5e",{font:"Inter",fontWeight:500,w:280,z:2}),
    T.txt("+1 (415) 555-0190",13,40,400,"#333333",{font:"Inter",w:260,z:2}),
    T.txt("SF · NYC · Remote",12,40,426,"#222222",{font:"Inter",w:220,z:2}),
    T.circ(-80,600,320,320,"#1a1a1a",{z:1}),
    T.circ(180,830,140,140,"#f43f5e",{opacity:0.1,z:1,anim:{type:"pulse",duration:4,delay:1,easing:"ease-in-out",repeat:"loop"}}),
    T.txt("IG  /  LI  /  BE  /  DM",12,40,710,"#222222",{font:"Inter",fontWeight:600,ls:2,w:260,z:2}),
    T.txt("Let's Talk",44,460,90,"#0a0a0a",{font:"Montserrat",fontWeight:800,w:480,z:2}),
    T.txt("Tell us about your project and we'll get back\nwithin one business day.",15,460,152,"#64748b",{font:"Inter",lh:1.65,w:540,z:2}),
    T.rect(460,216,540,52,"#f8fafc",{radius:10,stroke:"#e2e8f0",strokeW:1,z:2}),
    T.txt("Your name",14,480,233,"#94a3b8",{font:"Inter",w:360,z:3}),
    T.rect(460,286,540,52,"#f8fafc",{radius:10,stroke:"#e2e8f0",strokeW:1,z:2}),
    T.txt("your@email.com",14,480,303,"#94a3b8",{font:"Inter",w:360,z:3}),
    T.rect(460,356,540,52,"#f8fafc",{radius:10,stroke:"#e2e8f0",strokeW:1,z:2}),
    T.txt("Project type...",14,480,373,"#94a3b8",{font:"Inter",w:360,z:3}),
    T.rect(460,426,540,100,"#f8fafc",{radius:10,stroke:"#e2e8f0",strokeW:1,z:2}),
    T.txt("Tell us about your project...",14,480,448,"#94a3b8",{font:"Inter",w:400,z:3}),
    {...T.btn("Send Message →",460,544,540,"#0a0a0a","#ffffff",10,undefined,0,56,15),z:2} as ButtonElem,
    T.txt("Usually replies within 4 hours on business days",12,460,616,"#94a3b8",{font:"Inter",w:460,z:2}),
  ]};
  return scaleDocX({ version:1, pages:[p1,p2,p3,p4] }, 1920/1200);
};

// ── Template 9: Startup / Product Launch (Dark Gradient / Futuristic) ────────
const startupTemplate = (): CanvasDoc => {
  const p1: Page = { id:uid(), label:"Hero", bg:"#050d1f", h:960, elems:[
    T.rect(0,0,1200,66,"#060e22",{z:10}),
    T.txt("LaunchOS",16,80,20,"#60a5fa",{font:"Poppins",fontWeight:700,w:160,z:11}),
    T.txt("Features    Pricing    Docs    Sign In",12,680,22,"#1e3a5f",{font:"Inter",w:460,align:"right",z:11}),
    T.rect(0,66,1200,1,"rgba(96,165,250,0.1)",{z:10}),
    // gradient orbs
    T.circ(920,-20,560,560,"#1e3a7f",{opacity:0.25,z:1,anim:{type:"pulse",duration:7,delay:0,easing:"ease-in-out",repeat:"loop"}}),
    T.circ(200,700,360,360,"#6d28d9",{opacity:0.12,z:1,anim:{type:"float",duration:8,delay:1,easing:"ease-in-out",repeat:"loop"}}),
    T.circ(980,700,200,200,"#0ea5e9",{opacity:0.08,z:1}),
    // hexagon decoration (using SVG shape)
    T.svg(SHAPES[4],860,80,200,200,"#60a5fa",{opacity:0.06,z:1,rot:15,anim:{type:"spin",duration:30,delay:0,easing:"linear",repeat:"loop"}}),
    T.svg(SHAPES[4],920,420,120,120,"#a78bfa",{opacity:0.07,z:1,rot:-10,anim:{type:"spin",duration:20,delay:5,easing:"linear",repeat:"loop"}}),
    T.txt("NOW IN EARLY ACCESS",10,80,130,"#60a5fa",{font:"Inter",fontWeight:700,ls:4,w:300,z:3,anim:{type:"fadeIn",duration:0.6,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.txt("Ship products\n10× faster.",82,80,158,"#f0f8ff",{font:"Poppins",fontWeight:800,lh:1.0,w:700,z:3,anim:{type:"slideUp",duration:0.9,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("The all-in-one platform for modern product\nteams. Plan, build, launch, and grow.",18,80,400,"#4a7ab5",{font:"Inter",lh:1.7,w:540,z:3,anim:{type:"fadeIn",duration:0.8,delay:0.5,easing:"ease-out",repeat:"once"}}),
    {...T.btn("Start Free Trial",80,480,200,"#3b82f6","#ffffff",8),anim:{type:"slideUp",duration:0.6,delay:0.7,easing:"ease-out",repeat:"once"}} as ButtonElem,
    {...T.btn("Watch Demo →",300,480,175,"transparent","#60a5fa",8,"#1e3a5f",1),anim:{type:"slideUp",duration:0.6,delay:0.8,easing:"ease-out",repeat:"once"}} as ButtonElem,
    T.txt("No credit card required  ·  Free 14-day trial  ·  Cancel anytime",12,80,550,"#1e3a5f",{font:"Inter",w:440,z:3}),
    // dashboard mockup
    T.rect(620,90,540,560,"#0a1628",{radius:14,stroke:"#1e3a5f",strokeW:1,z:3,anim:{type:"fadeIn",duration:0.8,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.rect(620,90,540,36,"#0f1f3d",{radius:14,z:4}),
    T.circ(638,103,12,12,"#ff5f57",{z:5}), T.circ(658,103,12,12,"#febc2e",{z:5}), T.circ(678,103,12,12,"#28c840",{z:5}),
    T.rect(640,146,200,24,"#0f1f3d",{radius:4,z:4}),
    T.rect(640,182,500,8,"#1e3a5f",{radius:4,z:4}),
    T.bar(640,208,500,78,"#3b82f6","#1e3a5f"),
    T.rect(640,232,500,8,"#1e3a5f",{radius:4,z:4}),
    T.bar(640,258,500,55,"#6d28d9","#1e3a5f"),
    T.rect(640,282,240,56,"#0f1f3d",{radius:8,z:4}),
    T.rect(900,282,240,56,"#0f1f3d",{radius:8,z:4}),
    T.rect(640,354,120,28,"#3b82f6",{radius:6,z:4}),
    T.rect(780,354,120,28,"#1e3a5f",{radius:6,z:4}),
    T.rect(640,400,500,96,"#0f1f3d",{radius:8,z:4}),
    T.bar(660,432,460,90,"#0ea5e9","#1e3a5f"),
    T.rect(640,514,500,120,"#0f1f3d",{radius:8,z:4}),
    T.rect(660,534,80,80,"#1e3a5f",{radius:8,z:5}), T.rect(760,546,340,16,"#1e3a5f",{radius:4,z:5}), T.rect(760,572,240,12,"#0d1a30",{radius:4,z:5}),
    // trust bar
    T.rect(0,870,1200,1,"rgba(255,255,255,0.04)",{z:3}),
    T.txt("Trusted by teams at",12,80,886,"#1e3a5f",{font:"Inter",w:200,z:3}),
    T.txt("Stripe  ·  Vercel  ·  Linear  ·  Loom  ·  Notion  ·  Figma",14,300,884,"#2a4a7a",{font:"Inter",fontWeight:600,w:780,z:3}),
  ]};
  const p2: Page = { id:uid(), label:"Features", bg:"#050d1f", h:920, elems:[
    T.txt("EVERYTHING YOU NEED",9,80,80,"#60a5fa",{font:"Inter",fontWeight:700,ls:4,w:340,z:2}),
    T.txt("Built for speed.\nBuilt to scale.",52,80,106,"#f0f8ff",{font:"Poppins",fontWeight:800,lh:1.1,w:600,z:2,anim:{type:"slideUp",duration:0.8,delay:0.2,easing:"ease-out",repeat:"once"}}),
    ...[
      {icon:SHAPES[15],color:"#f59e0b",title:"Blazing Fast",body:"Sub-second deploys and real-time sync. Ship 10× faster with intelligent CI/CD.",x:80,y:220},
      {icon:SHAPES[14],color:"#22c55e",title:"Enterprise Security",body:"SOC 2 Type II, SSO, RBAC, audit logs, and end-to-end encryption built in.",x:436,y:220},
      {icon:SHAPES[4],color:"#60a5fa",title:"Infinite Scale",body:"Auto-scaling infrastructure that handles 1 user or 10 million without config.",x:792,y:220},
      {icon:SHAPES[3],color:"#a78bfa",title:"AI-Powered",body:"Smart suggestions, automated testing, and AI-generated documentation.",x:80,y:494},
      {icon:SHAPES[11],color:"#f43f5e",title:"Team First",body:"Real-time collaboration, comments, reviews, and role-based permissions.",x:436,y:494},
      {icon:SHAPES[19],color:"#06b6d4",title:"Open Platform",body:"400+ integrations and a full public API. Works with the tools you already use.",x:792,y:494},
    ].flatMap(f=>[
      T.rect(f.x,f.y,316,240,"#0a1628",{radius:14,stroke:"#1e3a5f",strokeW:1,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.1*(f.x/80)+0.1*(f.y/220),easing:"ease-out",repeat:"once"}}),
      T.svg(f.icon,f.x+24,f.y+24,44,44,f.color,{z:3}),
      T.txt(f.title,18,f.x+28,f.y+88,"#f0f8ff",{font:"Poppins",fontWeight:700,w:260,z:3}),
      T.txt(f.body,13,f.x+28,f.y+122,"#4a7ab5",{font:"Inter",lh:1.6,w:264,z:3}),
    ]),
    {...T.btn("See All Features",480,778,240,"#3b82f6","#ffffff",8),z:2} as ButtonElem,
  ]};
  const p3: Page = { id:uid(), label:"Pricing", bg:"#050d1f", h:880, elems:[
    T.txt("PRICING",9,80,80,"#60a5fa",{font:"Inter",fontWeight:700,ls:4,w:160,z:2}),
    T.txt("Simple, transparent\npricing.",48,80,106,"#f0f8ff",{font:"Poppins",fontWeight:800,lh:1.1,w:620,z:2,anim:{type:"slideUp",duration:0.8,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("Start free. Scale as you grow. No surprises.",16,80,218,"#4a7ab5",{font:"Inter",w:480,z:2}),
    // Starter card
    T.rect(80,260,334,480,"#0a1628",{radius:18,stroke:"#1e3a5f",strokeW:1,z:2,anim:{type:"slideUp",duration:0.7,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.txt("Starter",22,120,296,"#f0f8ff",{font:"Poppins",fontWeight:700,w:260,z:3}),
    T.txt("Free",40,120,336,"#f0f8ff",{font:"Poppins",fontWeight:800,w:120,z:3}),
    T.txt("forever",13,196,352,"#4a7ab5",{font:"Inter",w:80,z:3}),
    T.rect(120,396,254,1,"#1e3a5f",{z:3}),
    ...["3 projects","5GB storage","Community support","Basic analytics"].map((t,i)=>
      T.txt(`✓  ${t}`,13,120,416+i*32,"#4a7ab5",{font:"Inter",w:260,z:3})
    ),
    {...T.btn("Get Started Free",120,668,254,"transparent","#60a5fa",8,"#1e3a5f",1),z:3} as ButtonElem,
    // Pro card (featured)
    T.rect(434,240,374,520,"#1e3a7f",{radius:18,z:2,anim:{type:"slideUp",duration:0.7,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.rect(434,240,374,4,"linear-gradient(to right,#3b82f6,#6d28d9)",{radius:18,z:3}),
    T.txt("MOST POPULAR",9,474,262,"#60a5fa",{font:"Inter",fontWeight:700,ls:3,w:250,z:3}),
    T.txt("Pro",22,474,288,"#ffffff",{font:"Poppins",fontWeight:700,w:200,z:3}),
    T.txt("$49",40,474,328,"#ffffff",{font:"Poppins",fontWeight:800,w:100,z:3}),
    T.txt("/ month",13,562,344,"#60a5fa",{font:"Inter",w:100,z:3}),
    T.rect(474,392,294,1,"rgba(255,255,255,0.1)",{z:3}),
    ...["Unlimited projects","100GB storage","Priority support","Advanced analytics","Custom domains","Team collaboration"].map((t,i)=>
      T.txt(`✓  ${t}`,13,474,412+i*32,"#c7d9f5",{font:"Inter",w:300,z:3})
    ),
    {...T.btn("Start Free Trial",474,680,294,"#3b82f6","#ffffff",8),z:3} as ButtonElem,
    // Enterprise card
    T.rect(828,260,294,480,"#0a1628",{radius:18,stroke:"#1e3a5f",strokeW:1,z:2,anim:{type:"slideUp",duration:0.7,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.txt("Enterprise",22,868,296,"#f0f8ff",{font:"Poppins",fontWeight:700,w:220,z:3}),
    T.txt("Custom",28,868,336,"#60a5fa",{font:"Poppins",fontWeight:800,w:160,z:3}),
    T.rect(868,388,214,1,"#1e3a5f",{z:3}),
    ...["Unlimited everything","SLA & SSO","Dedicated support","Custom contracts","HIPAA / SOC 2"].map((t,i)=>
      T.txt(`✓  ${t}`,13,868,408+i*32,"#4a7ab5",{font:"Inter",w:220,z:3})
    ),
    {...T.btn("Contact Sales",868,668,214,"transparent","#60a5fa",8,"#1e3a5f",1),z:3} as ButtonElem,
    T.txt("All plans include a 14-day free trial. No credit card required.",12,350,808,"#1e3a5f",{font:"Inter",w:500,align:"center",z:2}),
  ]};
  return scaleDocX({ version:1, pages:[p1,p2,p3] }, 1920/1200);
};

// ── Template 10: Minimal CV / Resume (Clean Professional) ─────────────────────
const cvTemplate = (): CanvasDoc => {
  const p1: Page = { id:uid(), label:"Profile", bg:"#ffffff", h:960, elems:[
    T.rect(0,0,360,960,"#0f172a",{z:1}),
    // profile photo placeholder
    T.circ(120,100,120,120,"#1e293b",{z:2}),
    T.txt("YOUR\nPHOTO",12,144,148,"#334155",{font:"Inter",fontWeight:700,ls:2,lh:1.5,w:72,align:"center",z:3}),
    // contact info on sidebar
    T.txt("Your Name",22,40,248,"#ffffff",{font:"Poppins",fontWeight:700,w:280,z:2,anim:{type:"slideRight",duration:0.7,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("Senior Product Designer",13,40,280,"#60a5fa",{font:"Inter",fontWeight:500,w:280,z:2}),
    T.rect(40,308,280,1,"#1e293b",{z:2}),
    T.txt("CONTACT",8,40,326,"#334155",{font:"Inter",fontWeight:700,ls:4,w:200,z:2}),
    T.txt("✉  your@email.com",12,40,352,"#94a3b8",{font:"Inter",w:260,z:2}),
    T.txt("📞  +1 (555) 000-0000",12,40,374,"#94a3b8",{font:"Inter",w:260,z:2}),
    T.txt("🌐  yourportfolio.com",12,40,396,"#94a3b8",{font:"Inter",w:260,z:2}),
    T.txt("📍  San Francisco, CA",12,40,418,"#94a3b8",{font:"Inter",w:260,z:2}),
    T.rect(40,446,280,1,"#1e293b",{z:2}),
    T.txt("SKILLS",8,40,464,"#334155",{font:"Inter",fontWeight:700,ls:4,w:200,z:2}),
    ...["Figma & Design Systems","User Research","Prototyping","React / HTML / CSS","Leadership"].map((s,i)=>[
      T.txt(s,11,40,490+i*50,"#94a3b8",{font:"Inter",w:260,z:2}),
      T.bar(40,510+i*50,280,[95,88,90,72,82][i],"#60a5fa","#1e293b"),
    ]).flat(),
    T.rect(40,718,280,1,"#1e293b",{z:2}),
    T.txt("LANGUAGES",8,40,736,"#334155",{font:"Inter",fontWeight:700,ls:4,w:200,z:2}),
    T.txt("English (Native)",11,40,758,"#94a3b8",{font:"Inter",w:200,z:2}),
    T.bar(40,776,280,100,"#60a5fa","#1e293b"),
    T.txt("Spanish (Conversational)",11,40,802,"#94a3b8",{font:"Inter",w:240,z:2}),
    T.bar(40,820,280,65,"#60a5fa","#1e293b"),
    // main content area
    T.txt("Senior Product\nDesigner",46,400,80,"#0f172a",{font:"Poppins",fontWeight:800,lh:1.1,w:680,z:2,anim:{type:"slideUp",duration:0.8,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.rect(400,186,680,2,"#e2e8f0",{z:2}),
    T.txt("SUMMARY",8,400,202,"#94a3b8",{font:"Inter",fontWeight:700,ls:4,w:200,z:2}),
    T.txt("8+ years crafting intuitive digital products for startups and Fortune 500 companies. Passionate about the intersection of design, engineering, and human behavior.",15,400,226,"#475569",{font:"Inter",lh:1.7,w:680,z:2}),
    T.rect(400,310,680,2,"#e2e8f0",{z:2}),
    T.txt("EXPERIENCE",8,400,326,"#94a3b8",{font:"Inter",fontWeight:700,ls:4,w:200,z:2}),
    // experience entries with circle timeline dots
    T.circ(392,354,16,16,"#3b82f6",{z:3}), T.rect(399,362,2,64,"#e2e8f0",{z:2}),
    T.txt("Senior Product Designer",18,426,350,"#0f172a",{font:"Poppins",fontWeight:700,w:480,z:3}),
    T.txt("Stripe  ·  2022–Present",12,426,376,"#60a5fa",{font:"Inter",fontWeight:600,w:280,z:3}),
    T.txt("Led redesign of checkout flow, increasing conversion by 23%.",13,426,400,"#64748b",{font:"Inter",lh:1.6,w:600,z:3}),
    T.circ(392,438,16,16,"#94a3b8",{z:3}), T.rect(399,446,2,64,"#e2e8f0",{z:2}),
    T.txt("Product Designer",18,426,434,"#0f172a",{font:"Poppins",fontWeight:700,w:480,z:3}),
    T.txt("Figma  ·  2019–2022",12,426,460,"#94a3b8",{font:"Inter",fontWeight:600,w:280,z:3}),
    T.txt("Designed core editor features used by 4M+ designers worldwide.",13,426,484,"#64748b",{font:"Inter",lh:1.6,w:600,z:3}),
    T.circ(392,522,16,16,"#94a3b8",{z:3}),
    T.txt("UI/UX Designer",18,426,518,"#0f172a",{font:"Poppins",fontWeight:700,w:480,z:3}),
    T.txt("Airbnb  ·  2016–2019",12,426,544,"#94a3b8",{font:"Inter",fontWeight:600,w:280,z:3}),
    T.txt("Redesigned the host onboarding experience for 8M+ hosts.",13,426,568,"#64748b",{font:"Inter",lh:1.6,w:600,z:3}),
    T.rect(400,618,680,2,"#e2e8f0",{z:2}),
    T.txt("EDUCATION",8,400,634,"#94a3b8",{font:"Inter",fontWeight:700,ls:4,w:200,z:2}),
    T.circ(392,660,16,16,"#3b82f6",{z:3}),
    T.txt("B.F.A. Interaction Design",18,426,656,"#0f172a",{font:"Poppins",fontWeight:700,w:540,z:3}),
    T.txt("Carnegie Mellon University  ·  2016",12,426,682,"#60a5fa",{font:"Inter",fontWeight:600,w:400,z:3}),
    T.rect(400,724,680,2,"#e2e8f0",{z:2}),
    T.txt("AWARDS & RECOGNITION",8,400,740,"#94a3b8",{font:"Inter",fontWeight:700,ls:4,w:300,z:2}),
    T.svg(SHAPES[3],400,762,24,24,"#fbbf24",{z:3}),
    T.txt("Awwwards Site of the Year 2023",14,434,764,"#475569",{font:"Inter",w:440,z:3}),
    T.svg(SHAPES[3],400,800,24,24,"#fbbf24",{z:3}),
    T.txt("AIGA 50 Books/50 Covers 2022",14,434,802,"#475569",{font:"Inter",w:440,z:3}),
    T.svg(SHAPES[3],400,838,24,24,"#94a3b8",{z:3}),
    T.txt("Fast Company Innovation by Design Finalist",14,434,840,"#475569",{font:"Inter",w:480,z:3}),
  ]};
  const p2: Page = { id:uid(), label:"Portfolio", bg:"#ffffff", h:900, elems:[
    T.txt("SELECTED WORK",9,80,80,"#94a3b8",{font:"Inter",fontWeight:700,ls:4,w:260,z:2}),
    T.txt("Projects",46,80,106,"#0f172a",{font:"Poppins",fontWeight:800,w:480,z:2,anim:{type:"slideUp",duration:0.7,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.rect(80,180,680,320,"#f8fafc",{radius:16,stroke:"#e2e8f0",strokeW:1,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.rect(80,180,680,180,"#e0e7ff",{radius:16,z:3}),
    T.txt("PRODUCT DESIGN",9,108,200,"#6366f1",{font:"Inter",fontWeight:700,ls:2,w:280,z:4}),
    T.txt("Stripe Checkout Redesign",22,108,342,"#0f172a",{font:"Poppins",fontWeight:700,w:540,z:4}),
    T.txt("Research · UX · UI · Prototyping",12,108,378,"#94a3b8",{font:"Inter",w:400,z:4}),
    T.txt("+23% conversion rate  ·  View Case Study →",13,108,430,"#6366f1",{font:"Inter",fontWeight:600,w:440,z:4}),
    T.rect(780,180,340,320,"#0f172a",{radius:16,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.txt("DESIGN SYSTEM",9,808,200,"#60a5fa",{font:"Inter",fontWeight:700,ls:2,w:260,z:3}),
    T.txt("Figma Design Language",22,808,342,"#ffffff",{font:"Poppins",fontWeight:700,w:300,z:3}),
    T.txt("600+ components · View →",12,808,378,"#60a5fa",{font:"Inter",fontWeight:600,w:280,z:3}),
    T.rect(80,526,510,300,"#f8fafc",{radius:16,stroke:"#e2e8f0",strokeW:1,z:2,anim:{type:"slideUp",duration:0.7,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.rect(80,526,510,150,"#fef3c7",{radius:16,z:3}),
    T.txt("MOBILE",9,108,546,"#d97706",{font:"Inter",fontWeight:700,ls:2,w:180,z:4}),
    T.txt("Airbnb Host App",22,108,686,"#0f172a",{font:"Poppins",fontWeight:700,w:400,z:4}),
    T.txt("iOS & Android · View →",12,108,722,"#d97706",{font:"Inter",fontWeight:600,w:280,z:4}),
    T.rect(614,526,506,300,"#f8fafc",{radius:16,stroke:"#e2e8f0",strokeW:1,z:2,anim:{type:"slideUp",duration:0.7,delay:0.6,easing:"ease-out",repeat:"once"}}),
    T.rect(614,526,506,150,"#d1fae5",{radius:16,z:3}),
    T.txt("BRANDING",9,642,546,"#059669",{font:"Inter",fontWeight:700,ls:2,w:180,z:4}),
    T.txt("Linear Identity System",22,642,686,"#0f172a",{font:"Poppins",fontWeight:700,w:420,z:4}),
    T.txt("Full brand rollout · View →",12,642,722,"#059669",{font:"Inter",fontWeight:600,w:300,z:4}),
  ]};
  return scaleDocX({ version:1, pages:[p1,p2] }, 1920/1200);
};

// ── Template 11: Fitness Coach (Dark Energy / High Contrast) ─────────────────
const fitnessTemplate = (): CanvasDoc => {
  const p1: Page = { id:uid(), label:"Hero", bg:"#080a08", h:960, elems:[
    T.rect(0,0,1200,66,"#0d0f0d",{z:10}),
    T.txt("FORGE",18,80,18,"#f97316",{font:"Bebas Neue",ls:8,w:120,z:11}),
    T.txt("Programs    Results    About    Join Now",12,680,22,"#2a3a2a",{font:"Inter",w:480,align:"right",z:11}),
    // large circle bg decoration
    T.circ(880,-100,700,700,"#0f1a0f",{z:1}),
    T.circ(880,-100,520,520,"#111a11",{z:1,stroke:"rgba(249,115,22,0.07)",strokeW:2}),
    T.circ(880,-100,320,320,"#0f1a0f",{z:1,stroke:"rgba(249,115,22,0.1)",strokeW:2}),
    // lightning bolt SVG
    T.svg(SHAPES[15],820,300,180,180,"#f97316",{opacity:0.08,z:1,anim:{type:"pulse",duration:4,delay:0,easing:"ease-in-out",repeat:"loop"}}),
    T.svg(SHAPES[15],80,400,60,60,"#84cc16",{opacity:0.3,z:2,anim:{type:"bounce",duration:1.5,delay:0.5,easing:"ease-out",repeat:"loop"}}),
    // gradient top accent strip
    T.rect(0,66,1200,3,"linear-gradient(to right,#f97316,#84cc16,transparent)",{z:3}),
    T.txt("ONLINE FITNESS COACHING",10,80,130,"#f97316",{font:"Inter",fontWeight:700,ls:4,w:340,z:3,anim:{type:"fadeIn",duration:0.6,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.txt("NO EXCUSES.\nJUST RESULTS.",88,80,158,"#f5f5f0",{font:"Bebas Neue",ls:2,lh:0.95,w:740,z:3,anim:{type:"slideUp",duration:0.9,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("Transform your body and mindset with\npersonalized 1:1 coaching programs.\n500+ clients. Real results. Guaranteed.",17,80,436,"#4a6a4a",{font:"Inter",lh:1.65,w:500,z:3,anim:{type:"fadeIn",duration:0.8,delay:0.5,easing:"ease-out",repeat:"once"}}),
    {...T.btn("Start My Transformation",80,524,270,"#f97316","#080a08",6),anim:{type:"slideUp",duration:0.6,delay:0.7,easing:"ease-out",repeat:"once"}} as ButtonElem,
    {...T.btn("View Results",370,524,180,"transparent","#f5f5f0",6,"#2a3a2a",1),anim:{type:"slideUp",duration:0.6,delay:0.8,easing:"ease-out",repeat:"once"}} as ButtonElem,
    T.txt("✓ No gym required  ✓ Nutrition plan included  ✓ 24/7 support",13,80,592,"#2a3a2a",{font:"Inter",w:420,z:3}),
    T.rect(0,872,1200,1,"rgba(255,255,255,0.04)",{z:3}),
    T.txt("500+",32,90,880,"#f97316",{font:"Bebas Neue",w:120,align:"center",z:3}),
    T.txt("CLIENTS COACHED",9,90,920,"#2a3a2a",{font:"Inter",fontWeight:700,ls:2,w:120,align:"center",z:3}),
    T.txt("4.9★",32,380,880,"#84cc16",{font:"Bebas Neue",w:100,align:"center",z:3}),
    T.txt("AVERAGE RATING",9,380,920,"#2a3a2a",{font:"Inter",fontWeight:700,ls:2,w:100,align:"center",z:3}),
    T.txt("8 Yr",32,660,880,"#f5f5f0",{font:"Bebas Neue",w:80,align:"center",z:3}),
    T.txt("EXPERIENCE",9,660,920,"#2a3a2a",{font:"Inter",fontWeight:700,ls:2,w:80,align:"center",z:3}),
    T.txt("100%",32,900,880,"#f97316",{font:"Bebas Neue",w:100,align:"center",z:3}),
    T.txt("MONEY BACK",9,900,920,"#2a3a2a",{font:"Inter",fontWeight:700,ls:2,w:100,align:"center",z:3}),
  ]};
  const p2: Page = { id:uid(), label:"Programs", bg:"#080a08", h:920, elems:[
    T.txt("TRAINING PROGRAMS",10,80,80,"#f97316",{font:"Inter",fontWeight:700,ls:4,w:320,z:2}),
    T.txt("Choose Your\nProgram.",52,80,106,"#f5f5f0",{font:"Bebas Neue",ls:2,lh:1.05,w:600,z:2,anim:{type:"slideUp",duration:0.7,delay:0.1,easing:"ease-out",repeat:"once"}}),
    // Program cards
    T.rect(80,214,340,480,"#0d1a0d",{radius:16,stroke:"rgba(249,115,22,0.15)",strokeW:1,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.rect(80,214,340,4,"#f97316",{radius:16,z:3}),
    T.txt("STARTER",11,120,238,"#f97316",{font:"Inter",fontWeight:700,ls:3,w:200,z:3}),
    T.txt("8-Week\nFoundations",26,120,268,"#f5f5f0",{font:"Bebas Neue",ls:1,lh:1.1,w:280,z:3}),
    T.txt("Build the base. Master fundamentals.\nNutrition + training plan.",14,120,340,"#4a6a4a",{font:"Inter",lh:1.65,w:280,z:3}),
    T.txt("INTENSITY",10,120,416,"#f97316",{font:"Inter",fontWeight:700,ls:2,w:120,z:3}),
    T.bar(120,436,272,60,"#f97316","#1a2a1a"),
    T.txt("CARDIO FOCUS",10,120,460,"#84cc16",{font:"Inter",fontWeight:700,ls:2,w:180,z:3}),
    T.bar(120,480,272,75,"#84cc16","#1a2a1a"),
    T.txt("$197 / month",16,120,524,"#f5f5f0",{font:"Inter",fontWeight:700,w:200,z:3}),
    {...T.btn("Enroll Now",120,562,272,"#f97316","#080a08",6),z:3} as ButtonElem,
    T.rect(440,214,340,480,"#f97316",{radius:16,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.txt("MOST POPULAR",11,480,234,"#080a08",{font:"Inter",fontWeight:700,ls:3,w:200,z:3}),
    T.txt("12-Week\nTransform",26,480,258,"#080a08",{font:"Bebas Neue",ls:1,lh:1.1,w:280,z:3}),
    T.txt("Complete body recomposition.\n1:1 check-ins + custom macros.",14,480,330,"rgba(0,0,0,0.6)",{font:"Inter",lh:1.65,w:280,z:3}),
    T.txt("INTENSITY",10,480,406,"rgba(0,0,0,0.5)",{font:"Inter",fontWeight:700,ls:2,w:120,z:3}),
    T.bar(480,426,272,90,"#080a08","rgba(0,0,0,0.2)"),
    T.txt("STRENGTH FOCUS",10,480,450,"rgba(0,0,0,0.5)",{font:"Inter",fontWeight:700,ls:2,w:200,z:3}),
    T.bar(480,470,272,85,"#080a08","rgba(0,0,0,0.2)"),
    T.txt("$297 / month",16,480,514,"#080a08",{font:"Inter",fontWeight:700,w:200,z:3}),
    {...T.btn("Enroll Now",480,552,272,"#080a08","#f97316",6),z:3} as ButtonElem,
    T.rect(800,214,340,480,"#0d1a0d",{radius:16,stroke:"rgba(132,204,22,0.15)",strokeW:1,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.rect(800,214,340,4,"#84cc16",{radius:16,z:3}),
    T.txt("ELITE",11,840,238,"#84cc16",{font:"Inter",fontWeight:700,ls:3,w:120,z:3}),
    T.txt("16-Week\nElite Athlete",26,840,268,"#f5f5f0",{font:"Bebas Neue",ls:1,lh:1.1,w:280,z:3}),
    T.txt("Peak performance training.\nAdvanced periodization + sport nutrition.",14,840,340,"#4a6a4a",{font:"Inter",lh:1.65,w:280,z:3}),
    T.txt("INTENSITY",10,840,416,"#84cc16",{font:"Inter",fontWeight:700,ls:2,w:120,z:3}),
    T.bar(840,436,272,100,"#84cc16","#1a2a1a"),
    T.txt("PERFORMANCE",10,840,460,"#f97316",{font:"Inter",fontWeight:700,ls:2,w:160,z:3}),
    T.bar(840,480,272,96,"#f97316","#1a2a1a"),
    T.txt("$497 / month",16,840,524,"#f5f5f0",{font:"Inter",fontWeight:700,w:200,z:3}),
    {...T.btn("Apply Now",840,562,272,"#84cc16","#080a08",6),z:3} as ButtonElem,
    T.txt("All programs include 30-day money-back guarantee.",13,340,738,"#2a3a2a",{font:"Inter",w:520,align:"center",z:2}),
  ]};
  const p3: Page = { id:uid(), label:"Results", bg:"#080a08", h:860, elems:[
    T.txt("CLIENT RESULTS",10,80,80,"#f97316",{font:"Inter",fontWeight:700,ls:4,w:280,z:2}),
    T.txt("Real People.\nReal Results.",52,80,106,"#f5f5f0",{font:"Bebas Neue",ls:2,lh:0.95,w:600,z:2,anim:{type:"slideUp",duration:0.7,delay:0.1,easing:"ease-out",repeat:"once"}}),
    // Result cards
    T.rect(80,224,340,260,"#0d1a0d",{radius:14,stroke:"rgba(249,115,22,0.12)",strokeW:1,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.circ(104,248,60,60,"#1a2a1a",{z:3}), T.txt("M",22,130,250,"#f97316",{font:"Bebas Neue",w:12,align:"center",z:4}),
    T.txt("Mike T.",16,174,248,"#f5f5f0",{font:"Poppins",fontWeight:700,w:200,z:3}),
    T.txt("Lost 32 lbs in 12 weeks",12,174,272,"#4a6a4a",{font:"Inter",w:220,z:3}),
    T.txt("\"Coach changed my entire relationship\nwith fitness. Down 32lbs and have\nnever felt stronger.\"",13,104,328,"#4a6a4a",{font:"Inter",lh:1.6,w:280,z:3}),
    T.txt("★★★★★",14,104,416,"#f97316",{font:"Inter",w:90,z:3}),
    T.rect(440,224,340,260,"#0d1a0d",{radius:14,stroke:"rgba(132,204,22,0.12)",strokeW:1,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.circ(464,248,60,60,"#1a2a1a",{z:3}), T.txt("J",22,490,250,"#84cc16",{font:"Bebas Neue",w:12,align:"center",z:4}),
    T.txt("Jess K.",16,534,248,"#f5f5f0",{font:"Poppins",fontWeight:700,w:200,z:3}),
    T.txt("First marathon at 42",12,534,272,"#4a6a4a",{font:"Inter",w:200,z:3}),
    T.txt("\"Built up from zero running\nexperience to completing my\nfirst full marathon in 6 months.\"",13,464,328,"#4a6a4a",{font:"Inter",lh:1.6,w:280,z:3}),
    T.txt("★★★★★",14,464,416,"#f97316",{font:"Inter",w:90,z:3}),
    T.rect(800,224,340,260,"#0d1a0d",{radius:14,stroke:"rgba(249,115,22,0.12)",strokeW:1,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.circ(824,248,60,60,"#1a2a1a",{z:3}), T.txt("A",22,850,250,"#f97316",{font:"Bebas Neue",w:12,align:"center",z:4}),
    T.txt("Alex R.",16,894,248,"#f5f5f0",{font:"Poppins",fontWeight:700,w:200,z:3}),
    T.txt("Gained 18 lbs muscle",12,894,272,"#4a6a4a",{font:"Inter",w:220,z:3}),
    T.txt("\"Elite program is insane.\nGained 18lbs of lean muscle and\nmy lifts doubled in 16 weeks.\"",13,824,328,"#4a6a4a",{font:"Inter",lh:1.6,w:280,z:3}),
    T.txt("★★★★★",14,824,416,"#f97316",{font:"Inter",w:90,z:3}),
    // aggregate results
    T.rect(80,520,1040,260,"#0d1a0d",{radius:18,z:2,anim:{type:"slideUp",duration:0.8,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.rect(80,520,1040,4,"linear-gradient(to right,#f97316,#84cc16)",{radius:18,z:3}),
    T.txt("Average results across 500+ clients:",13,120,550,"#2a3a2a",{font:"Inter",fontWeight:600,ls:1,w:400,z:3}),
    T.txt("Weight Loss",12,120,588,"#f5f5f0",{font:"Inter",w:130,z:3}), T.bar(258,590,420,82,"#f97316","#1a2a1a"),
    T.txt("Muscle Gain",12,120,614,"#f5f5f0",{font:"Inter",w:130,z:3}), T.bar(258,616,420,70,"#84cc16","#1a2a1a"),
    T.txt("Energy Levels",12,120,640,"#f5f5f0",{font:"Inter",w:130,z:3}), T.bar(258,642,420,95,"#f97316","#1a2a1a"),
    T.txt("Overall Wellbeing",12,120,666,"#f5f5f0",{font:"Inter",w:160,z:3}), T.bar(258,668,420,94,"#84cc16","#1a2a1a"),
    {...T.btn("Start My Transformation",740,622,320,"#f97316","#080a08",6),z:3} as ButtonElem,
    T.txt("30-day money-back guarantee",12,740,692,"#2a3a2a",{font:"Inter",w:280,align:"center",z:3}),
    T.txt("\"The best investment I've made in myself\" – 500+ satisfied clients",14,240,736,"#2a3a2a",{font:"Inter",fontWeight:500,w:720,align:"center",z:2}),
  ]};
  return scaleDocX({ version:1, pages:[p1,p2,p3] }, 1920/1200);
};

// ── Template 12: Chef / Food Creator ─────────────────────────────────────────
const chefTemplate = (): CanvasDoc => {
  const p1: Page = { id:uid(), label:"Home", bg:"#faf5ef", h:960, elems:[
    T.rect(0,0,1200,68,"#faf5ef",{z:10}),
    T.txt("Chef Laurent",18,80,20,"#1c1409",{font:"Playfair Display",fontWeight:700,w:220,z:11}),
    T.txt("Menu    Events    About    Contact",12,650,22,"#b5a090",{font:"Inter",w:490,align:"right",z:11}),
    T.rect(0,68,1200,1,"#ede4d8",{z:10}),
    T.rect(660,0,540,960,"#f3ede2",{z:1}),
    T.rect(720,90,420,600,"#e8dccc",{radius:20,z:2,anim:{type:"fadeIn",duration:0.8,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.txt("YOUR\nPHOTO\nHERE",18,810,348,"#c8b89a",{font:"Inter",fontWeight:700,ls:3,lh:1.6,w:240,align:"center",z:3}),
    T.circ(1060,640,120,120,"#d4961a",{opacity:0.15,z:2,anim:{type:"float",duration:6,delay:0,easing:"ease-in-out",repeat:"loop"}}),
    T.circ(700,120,80,80,"#b83a2a",{opacity:0.1,z:2,anim:{type:"float",duration:8,delay:2,easing:"ease-in-out",repeat:"loop"}}),
    T.txt("MICHELIN-TRAINED CHEF",9,80,168,"#b83a2a",{font:"Inter",fontWeight:700,ls:4,w:280,z:3,anim:{type:"fadeIn",duration:0.6,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.txt("Where every\ndish tells a\nstory.",70,80,194,"#1c1409",{font:"Playfair Display",fontWeight:700,lh:1.05,w:550,z:3,anim:{type:"slideUp",duration:0.9,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("French-trained chef with 18 years of experience crafting unforgettable dining experiences. Private events, pop-ups, and media.",16,80,444,"#7a6455",{font:"Inter",lh:1.75,w:520,z:3,anim:{type:"fadeIn",duration:0.8,delay:0.5,easing:"ease-out",repeat:"once"}}),
    {...T.btn("Book an Event",80,524,200,"#b83a2a","#faf5ef",6),anim:{type:"slideUp",duration:0.6,delay:0.7,easing:"ease-out",repeat:"once"}} as ButtonElem,
    {...T.btn("View Menu",300,524,175,"transparent","#1c1409",6,"#d5c8ba",1),anim:{type:"slideUp",duration:0.6,delay:0.8,easing:"ease-out",repeat:"once"}} as ButtonElem,
    T.rect(80,640,1,80,"#ddd0c0",{z:3}),
    T.txt("18",26,108,642,"#1c1409",{font:"Playfair Display",fontWeight:700,w:60,z:3}),
    T.txt("Years",10,108,674,"#b5a090",{font:"Inter",fontWeight:600,ls:2,w:60,z:3}),
    T.txt("3",26,220,642,"#b83a2a",{font:"Playfair Display",fontWeight:700,w:40,z:3}),
    T.txt("Stars",10,220,674,"#b5a090",{font:"Inter",fontWeight:600,ls:2,w:60,z:3}),
    T.txt("400+",26,320,642,"#1c1409",{font:"Playfair Display",fontWeight:700,w:80,z:3}),
    T.txt("Events",10,320,674,"#b5a090",{font:"Inter",fontWeight:600,ls:2,w:80,z:3}),
  ]};
  const p2: Page = { id:uid(), label:"Signature Dishes", bg:"#faf5ef", h:900, elems:[
    T.txt("SIGNATURE DISHES",9,80,80,"#b83a2a",{font:"Inter",fontWeight:700,ls:4,w:280,z:2}),
    T.txt("A taste of my kitchen.",48,80,106,"#1c1409",{font:"Playfair Display",fontWeight:700,lh:1.1,w:640,z:2,anim:{type:"slideUp",duration:0.7,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.rect(80,198,320,420,"#ffffff",{radius:18,stroke:"#ede4d8",strokeW:1,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.rect(80,198,320,230,"#f3ede2",{radius:18,z:3}),
    T.txt("STARTER",9,108,416,"#b83a2a",{font:"Inter",fontWeight:700,ls:2,w:200,z:4}),
    T.txt("Truffle\nConsommé",22,108,444,"#1c1409",{font:"Playfair Display",fontWeight:700,lh:1.2,w:280,z:4}),
    T.txt("Aged black truffle, gold leaf,\nchervil oil, edible flowers.",13,108,498,"#7a6455",{font:"Inter",lh:1.6,w:280,z:4}),
    T.txt("$32 per person →",12,108,562,"#b83a2a",{font:"Inter",fontWeight:600,w:200,z:4}),
    T.rect(430,198,320,420,"#1c1409",{radius:18,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.rect(430,198,320,4,"#b83a2a",{radius:18,z:3}),
    T.txt("MAIN",9,458,416,"#d4961a",{font:"Inter",fontWeight:700,ls:2,w:200,z:4}),
    T.txt("Duck Confit\nwith Cherry",22,458,444,"#ffffff",{font:"Playfair Display",fontWeight:700,lh:1.2,w:280,z:4}),
    T.txt("48-hour confit, morello cherry jus,\nfondant potato, haricots verts.",13,458,498,"#888888",{font:"Inter",lh:1.6,w:280,z:4}),
    T.txt("$68 per person →",12,458,562,"#d4961a",{font:"Inter",fontWeight:600,w:200,z:4}),
    T.rect(780,198,320,420,"#ffffff",{radius:18,stroke:"#ede4d8",strokeW:1,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.rect(780,198,320,230,"#f3ede2",{radius:18,z:3}),
    T.txt("DESSERT",9,808,416,"#b83a2a",{font:"Inter",fontWeight:700,ls:2,w:200,z:4}),
    T.txt("Tarte Tatin\nFlambée",22,808,444,"#1c1409",{font:"Playfair Display",fontWeight:700,lh:1.2,w:280,z:4}),
    T.txt("Caramelised apple, calvados cream,\nhand-churned vanilla ice cream.",13,808,498,"#7a6455",{font:"Inter",lh:1.6,w:280,z:4}),
    T.txt("$28 per person →",12,808,562,"#b83a2a",{font:"Inter",fontWeight:600,w:200,z:4}),
    T.rect(80,658,1040,178,"#1c1409",{radius:18,z:2,anim:{type:"slideUp",duration:0.8,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.txt("Private dining from $150 per person.",26,130,694,"#faf5ef",{font:"Playfair Display",fontWeight:700,lh:1.2,w:500,z:3}),
    T.txt("Seasonal menus, wine pairings, bespoke experiences.",14,130,744,"#888888",{font:"Inter",lh:1.65,w:500,z:3}),
    {...T.btn("Enquire Now",700,700,330,"#b83a2a","#faf5ef",8),z:3} as ButtonElem,
  ]};
  const p3: Page = { id:uid(), label:"About", bg:"#faf5ef", h:860, elems:[
    T.rect(0,0,580,860,"#f3ede2",{z:1}),
    T.rect(60,80,400,480,"#e8dccc",{radius:20,z:2,anim:{type:"fadeIn",duration:0.8,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.txt("YOUR\nPHOTO\nHERE",18,160,278,"#c8b89a",{font:"Inter",fontWeight:700,ls:3,lh:1.6,w:200,align:"center",z:3}),
    T.circ(380,510,120,120,"#d4961a",{opacity:0.2,z:2,anim:{type:"float",duration:5,delay:0,easing:"ease-in-out",repeat:"loop"}}),
    T.txt("MY STORY",9,630,90,"#b83a2a",{font:"Inter",fontWeight:700,ls:4,w:200,z:2}),
    T.txt("Cooking is my\nlanguage.",48,630,114,"#1c1409",{font:"Playfair Display",fontWeight:700,lh:1.1,w:480,z:2,anim:{type:"slideLeft",duration:0.8,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("Trained at Le Cordon Bleu Paris, I've cooked in Michelin-starred kitchens from Lyon to Tokyo. Now based in New York, I bring refined technique to intimate private dining and exclusive pop-ups.",15,630,248,"#7a6455",{font:"Inter",lh:1.75,w:480,z:2,anim:{type:"fadeIn",duration:0.8,delay:0.4,easing:"ease-out",repeat:"once"}}),
    {...T.btn("Book a Private Dinner",630,440,265,"#b83a2a","#faf5ef",6),anim:{type:"fadeIn",duration:0.6,delay:0.7,easing:"ease-out",repeat:"once"}} as ButtonElem,
    T.txt("EXPERTISE",9,630,544,"#b83a2a",{font:"Inter",fontWeight:700,ls:3,w:180,z:2}),
    T.txt("French Cuisine",12,630,570,"#1c1409",{font:"Inter",fontWeight:500,w:160,z:2}), T.bar(790,572,350,95,"#b83a2a","#e8dccc"),
    T.txt("Pastry & Desserts",12,630,598,"#1c1409",{font:"Inter",fontWeight:500,w:160,z:2}), T.bar(790,600,350,90,"#d4961a","#e8dccc"),
    T.txt("Wine Pairing",12,630,626,"#1c1409",{font:"Inter",fontWeight:500,w:160,z:2}), T.bar(790,628,350,87,"#b83a2a","#e8dccc"),
    T.txt("Fermentation",12,630,654,"#1c1409",{font:"Inter",fontWeight:500,w:160,z:2}), T.bar(790,656,350,78,"#d4961a","#e8dccc"),
    T.txt("As seen in  ·  NYT Dining  ·  Food & Wine  ·  Bon Appétit",12,630,740,"#b5a090",{font:"Inter",w:480,z:2}),
  ]};
  return scaleDocX({ version:1, pages:[p1,p2,p3] }, 1920/1200);
};

// ── Template 13: Podcast Host ─────────────────────────────────────────────────
const podcastTemplate = (): CanvasDoc => {
  const p1: Page = { id:uid(), label:"Home", bg:"#0d0c18", h:960, elems:[
    T.rect(0,0,1200,66,"#100f1e",{z:10}),
    T.txt("THE SHOW",16,80,20,"#9333ea",{font:"Poppins",fontWeight:700,w:180,z:11}),
    T.txt("Episodes    Guests    Newsletter    Listen",12,670,22,"#3a3850",{font:"Inter",w:490,align:"right",z:11}),
    T.rect(0,66,1200,1,"rgba(147,51,234,0.12)",{z:10}),
    T.circ(900,-40,500,500,"#2d1060",{opacity:0.35,z:1,anim:{type:"pulse",duration:6,delay:0,easing:"ease-in-out",repeat:"loop"}}),
    T.circ(200,700,320,320,"#0a3040",{opacity:0.3,z:1,anim:{type:"float",duration:8,delay:1,easing:"ease-in-out",repeat:"loop"}}),
    // Podcast artwork
    T.rect(700,100,420,420,"linear-gradient(135deg,#2d1060,#0a3040)",{radius:20,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.txt("SHOW\nARTWORK",22,780,290,"#1a1040",{font:"Poppins",fontWeight:700,ls:3,lh:1.5,w:260,align:"center",z:3}),
    // Latest episode pill
    T.rect(700,540,420,160,"#131226",{radius:14,stroke:"rgba(147,51,234,0.2)",strokeW:1,z:2,anim:{type:"slideUp",duration:0.6,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.txt("LATEST · EP 248",9,724,562,"#9333ea",{font:"Inter",fontWeight:700,ls:3,w:280,z:3}),
    T.txt("Rethinking Creativity",17,724,584,"#e8e8ff",{font:"Poppins",fontWeight:700,w:360,z:3}),
    T.txt("1h 14m  ·  Released May 20, 2025",12,724,616,"#222240",{font:"Inter",w:300,z:3}),
    T.rect(724,636,340,6,"#3a3850",{radius:3,z:3}),
    T.rect(724,636,240,6,"#9333ea",{radius:3,z:4}),
    // Left hero
    T.txt("WEEKLY CONVERSATIONS",10,80,128,"#9333ea",{font:"Inter",fontWeight:700,ls:4,w:320,z:3,anim:{type:"fadeIn",duration:0.6,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.txt("The podcast\nthat changes\nhow you think.",78,80,156,"#e8e8ff",{font:"Poppins",fontWeight:800,lh:0.98,w:590,z:3,anim:{type:"slideUp",duration:0.9,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("Deep conversations with the world's most interesting thinkers, creators, and builders. Every Wednesday.",16,80,436,"#6a6880",{font:"Inter",lh:1.7,w:520,z:3,anim:{type:"fadeIn",duration:0.8,delay:0.5,easing:"ease-out",repeat:"once"}}),
    {...T.btn("▶  Listen Free",80,514,185,"#9333ea","#ffffff",8),anim:{type:"slideUp",duration:0.6,delay:0.7,easing:"ease-out",repeat:"once"}} as ButtonElem,
    {...T.btn("Subscribe",285,514,175,"transparent","#e8e8ff",8,"#3a3850",1),anim:{type:"slideUp",duration:0.6,delay:0.8,easing:"ease-out",repeat:"once"}} as ButtonElem,
    T.rect(0,872,1200,1,"rgba(255,255,255,0.04)",{z:3}),
    T.txt("2.4M",30,80,882,"#9333ea",{font:"Poppins",fontWeight:800,w:120,z:3}),
    T.txt("Monthly Listeners",9,80,920,"#3a3850",{font:"Inter",fontWeight:700,ls:2,w:160,z:3}),
    T.txt("248",30,320,882,"#06b6d4",{font:"Poppins",fontWeight:800,w:100,z:3}),
    T.txt("Episodes",9,320,920,"#3a3850",{font:"Inter",fontWeight:700,ls:2,w:100,z:3}),
    T.txt("4.9★",30,540,882,"#e8e8ff",{font:"Poppins",fontWeight:800,w:100,z:3}),
    T.txt("Avg Rating",9,540,920,"#3a3850",{font:"Inter",fontWeight:700,ls:2,w:110,z:3}),
    T.txt("#4 in Technology",14,740,888,"#6a6880",{font:"Poppins",fontWeight:600,w:250,z:3}),
  ]};
  const p2: Page = { id:uid(), label:"Episodes", bg:"#0d0c18", h:900, elems:[
    T.txt("RECENT EPISODES",10,80,80,"#9333ea",{font:"Inter",fontWeight:700,ls:4,w:280,z:2}),
    T.txt("Latest Listens",48,80,104,"#e8e8ff",{font:"Poppins",fontWeight:800,w:560,z:2,anim:{type:"slideUp",duration:0.7,delay:0.1,easing:"ease-out",repeat:"once"}}),
    ...[
      {n:"#248",title:"Rethinking Creativity",guest:"Dr. Sarah Chen",dur:"1h 14m",plays:"98K",pct:78,color:"#9333ea",top:178},
      {n:"#247",title:"The Future of Work",guest:"Marcus Williams",dur:"52m",plays:"74K",pct:62,color:"#06b6d4",top:302},
      {n:"#246",title:"Building in Public",guest:"Priya Nair",dur:"1h 3m",plays:"61K",pct:55,color:"#f59e0b",top:426},
      {n:"#245",title:"Mindful Leadership",guest:"James Okafor",dur:"48m",plays:"53K",pct:48,color:"#f43f5e",top:550},
    ].flatMap((ep,i)=>[
      T.rect(80,ep.top,1040,100,"#131226",{radius:12,stroke:"rgba(255,255,255,0.04)",strokeW:1,z:2,anim:{type:"slideUp",duration:0.5,delay:0.1+i*0.08,easing:"ease-out",repeat:"once"}}),
      T.rect(80,ep.top,4,100,ep.color,{z:3}),
      T.txt(ep.n,13,108,ep.top+16,ep.color,{font:"Poppins",fontWeight:700,w:80,z:4}),
      T.txt(ep.title,20,108,ep.top+38,"#e8e8ff",{font:"Poppins",fontWeight:700,w:420,z:4}),
      T.txt(`with ${ep.guest} · ${ep.dur}`,12,108,ep.top+72,"#222240",{font:"Inter",w:360,z:4}),
      T.rect(640,ep.top+36,340,6,"#3a3850",{radius:3,z:3}),
      T.rect(640,ep.top+36,Math.round(340*ep.pct/100),6,ep.color,{radius:3,z:4}),
      T.txt(ep.plays,14,1000,ep.top+36,"#e8e8ff",{font:"Poppins",fontWeight:700,w:90,align:"right",z:4}),
      T.txt("plays",10,1000,ep.top+60,"#3a3850",{font:"Inter",w:90,align:"right",z:4}),
    ]),
    T.rect(80,686,1040,164,"#131226",{radius:18,stroke:"rgba(147,51,234,0.15)",strokeW:1,z:2,anim:{type:"slideUp",duration:0.8,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.txt("Never miss an episode.",26,130,712,"#e8e8ff",{font:"Poppins",fontWeight:700,w:480,z:3}),
    T.txt("Weekly show notes + guest resources in your inbox every Wednesday.",14,130,752,"#6a6880",{font:"Inter",w:480,z:3}),
    {...T.btn("Subscribe Free →",700,716,340,"#9333ea","#ffffff",8),z:3} as ButtonElem,
  ]};
  return scaleDocX({ version:1, pages:[p1,p2] }, 1920/1200);
};

// ── Template 14: Architect / Design Studio ────────────────────────────────────
const architectTemplate = (): CanvasDoc => {
  const p1: Page = { id:uid(), label:"Studio", bg:"#ffffff", h:960, elems:[
    T.rect(0,0,1200,64,"#ffffff",{z:10}),
    T.txt("FORM STUDIO",14,80,22,"#1c1c1c",{font:"Montserrat",fontWeight:800,ls:4,w:220,z:11}),
    T.txt("Projects    Process    Studio    Contact",12,670,22,"#b0b0b0",{font:"Inter",w:490,align:"right",z:11}),
    T.rect(0,64,1200,1,"#eeeeee",{z:10}),
    T.rect(80,64,3,896,"#b5891a",{z:3}),
    // Background large project number
    T.txt("01",180,104,84,"#f0ebe0",{font:"Montserrat",fontWeight:800,w:500,z:1}),
    // Project image placeholder
    T.rect(120,116,560,560,"#f5f0e8",{radius:4,z:2,anim:{type:"fadeIn",duration:0.8,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.txt("PROJECT IMAGE",13,222,388,"#d8ccb8",{font:"Montserrat",fontWeight:700,ls:4,w:356,align:"center",z:3}),
    // Right content
    T.txt("ARCHITECTURE · INTERIORS",10,720,140,"#b5891a",{font:"Montserrat",fontWeight:700,ls:4,w:380,z:3,anim:{type:"fadeIn",duration:0.6,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("Space as\nan art form.",68,720,170,"#1c1c1c",{font:"Montserrat",fontWeight:800,lh:1.05,w:460,z:3,anim:{type:"slideUp",duration:0.9,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.rect(720,368,400,1,"#eeeeee",{z:3}),
    T.txt("We design buildings and interiors that balance function with extraordinary beauty. Every project is a collaboration with nature and light.",16,720,388,"#666666",{font:"Inter",lh:1.75,w:460,z:3,anim:{type:"fadeIn",duration:0.8,delay:0.5,easing:"ease-out",repeat:"once"}}),
    {...T.btn("View Our Work",720,502,200,"#1c1c1c","#ffffff",3),anim:{type:"slideUp",duration:0.6,delay:0.7,easing:"ease-out",repeat:"once"}} as ButtonElem,
    {...T.btn("Start a Project",938,502,175,"transparent","#1c1c1c",3,"#e0e0e0",1),anim:{type:"slideUp",duration:0.6,delay:0.8,easing:"ease-out",repeat:"once"}} as ButtonElem,
    T.rect(720,592,400,1,"#eeeeee",{z:3}),
    T.txt("68",42,720,610,"#1c1c1c",{font:"Montserrat",fontWeight:800,w:80,z:3}),
    T.txt("Projects",11,720,660,"#b0b0b0",{font:"Inter",w:100,z:3}),
    T.txt("22",42,900,610,"#b5891a",{font:"Montserrat",fontWeight:800,w:80,z:3}),
    T.txt("Awards",11,900,660,"#b0b0b0",{font:"Inter",w:100,z:3}),
    T.txt("14",42,1060,610,"#1c1c1c",{font:"Montserrat",fontWeight:800,w:60,z:3}),
    T.txt("Countries",11,1060,660,"#b0b0b0",{font:"Inter",w:100,z:3}),
  ]};
  const p2: Page = { id:uid(), label:"Projects", bg:"#ffffff", h:920, elems:[
    T.txt("SELECTED WORK",9,80,80,"#b0b0b0",{font:"Montserrat",fontWeight:700,ls:4,w:280,z:2}),
    T.txt("Projects",56,80,104,"#1c1c1c",{font:"Montserrat",fontWeight:800,w:500,z:2,anim:{type:"slideUp",duration:0.7,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.rect(80,178,520,318,"#f5f0e8",{radius:5,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("01",70,104,186,"#ebe4d4",{font:"Montserrat",fontWeight:800,w:160,z:3}),
    T.txt("Casa Verde",22,104,342,"#1c1c1c",{font:"Montserrat",fontWeight:700,w:440,z:3}),
    T.txt("Private Residence · Barcelona · 2024",12,104,374,"#b0b0b0",{font:"Inter",w:380,z:3}),
    T.txt("View Project →",12,104,408,"#b5891a",{font:"Inter",fontWeight:600,w:180,z:3}),
    T.rect(640,178,480,318,"#1c1c1c",{radius:5,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.txt("02",70,664,186,"#2a2a2a",{font:"Montserrat",fontWeight:800,w:160,z:3}),
    T.txt("The Pavilion",22,664,342,"#ffffff",{font:"Montserrat",fontWeight:700,w:400,z:3}),
    T.txt("Cultural Centre · Tokyo · 2024",12,664,374,"#555555",{font:"Inter",w:380,z:3}),
    T.txt("View Project →",12,664,408,"#b5891a",{font:"Inter",fontWeight:600,w:180,z:3}),
    T.rect(80,524,340,320,"#1c1c1c",{radius:5,z:2,anim:{type:"slideUp",duration:0.7,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.txt("03",70,104,532,"#2a2a2a",{font:"Montserrat",fontWeight:800,w:160,z:3}),
    T.txt("Meridian",22,104,688,"#ffffff",{font:"Montserrat",fontWeight:700,w:280,z:3}),
    T.txt("Mixed-Use · New York City",12,104,720,"#555555",{font:"Inter",w:280,z:3}),
    T.rect(450,524,280,320,"#f5f0e8",{radius:5,z:2,anim:{type:"slideUp",duration:0.7,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.txt("04",70,474,532,"#ebe4d4",{font:"Montserrat",fontWeight:800,w:140,z:3}),
    T.txt("Villa Sol",22,474,688,"#1c1c1c",{font:"Montserrat",fontWeight:700,w:230,z:3}),
    T.txt("Residential · Ibiza",12,474,720,"#b0b0b0",{font:"Inter",w:220,z:3}),
    T.rect(760,524,360,320,"#f5f0e8",{radius:5,z:2,anim:{type:"slideUp",duration:0.7,delay:0.6,easing:"ease-out",repeat:"once"}}),
    T.txt("05",70,784,532,"#ebe4d4",{font:"Montserrat",fontWeight:800,w:140,z:3}),
    T.txt("The Bridge House",22,784,688,"#1c1c1c",{font:"Montserrat",fontWeight:700,w:300,z:3}),
    T.txt("Residential · Oslo, Norway",12,784,720,"#b0b0b0",{font:"Inter",w:280,z:3}),
  ]};
  return scaleDocX({ version:1, pages:[p1,p2] }, 1920/1200);
};

// ── Template 15: Wedding Planner ──────────────────────────────────────────────
const weddingTemplate = (): CanvasDoc => {
  const p1: Page = { id:uid(), label:"Home", bg:"#fef9f6", h:960, elems:[
    T.rect(0,0,1200,68,"#fef9f6",{z:10}),
    T.txt("Bloom & Co.",20,80,20,"#2a1a1a",{font:"Playfair Display",fontWeight:700,w:220,z:11}),
    T.txt("Services    Gallery    About    Contact",12,650,22,"#c8b0a8",{font:"Inter",w:490,align:"right",z:11}),
    T.rect(0,68,1200,1,"#f0e4dd",{z:10}),
    T.circ(980,520,300,300,"#f7e8e4",{z:1,anim:{type:"float",duration:8,delay:0,easing:"ease-in-out",repeat:"loop"}}),
    T.circ(120,680,200,200,"#eef3e8",{z:1,anim:{type:"float",duration:7,delay:2,easing:"ease-in-out",repeat:"loop"}}),
    T.circ(600,100,100,100,"#f7e8e4",{opacity:0.7,z:1}),
    T.svg(SHAPES[11],1050,180,60,60,"#c89898",{opacity:0.3,z:2,anim:{type:"float",duration:5,delay:1,easing:"ease-in-out",repeat:"loop"}}),
    T.svg(SHAPES[11],100,200,40,40,"#7a9e7e",{opacity:0.2,z:2}),
    T.rect(680,100,440,520,"#f0e4dd",{radius:24,z:2,anim:{type:"fadeIn",duration:0.8,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.txt("YOUR COUPLE\nPHOTO HERE",14,760,330,"#d4bdb5",{font:"Inter",fontWeight:700,ls:2,lh:1.5,w:280,align:"center",z:3}),
    T.rect(710,548,360,60,"#ffffff",{radius:30,z:3}),
    T.txt("✦  Sarah & James  –  June 14  ✦",12,728,568,"#c89898",{font:"Inter",fontWeight:500,ls:1,w:324,align:"center",z:4}),
    T.txt("WEDDING PLANNING & FLORALS",11,80,168,"#7a9e7e",{font:"Inter",fontWeight:600,ls:2,w:340,z:3,anim:{type:"fadeIn",duration:0.6,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.txt("Every love story\ndeserves a\nperfect chapter.",66,80,200,"#2a1a1a",{font:"Playfair Display",fontWeight:700,lh:1.07,w:560,z:3,anim:{type:"slideUp",duration:0.9,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("Boutique wedding planning and floral design for couples who want every detail to feel effortlessly beautiful. NYC · Hamptons · Destination.",16,80,450,"#8a7060",{font:"Inter",lh:1.75,w:530,z:3,anim:{type:"fadeIn",duration:0.8,delay:0.5,easing:"ease-out",repeat:"once"}}),
    {...T.btn("Start Planning",80,530,195,"#c89898","#fef9f6",30),anim:{type:"slideUp",duration:0.6,delay:0.7,easing:"ease-out",repeat:"once"}} as ButtonElem,
    {...T.btn("View Gallery",295,530,175,"transparent","#2a1a1a",30,"#e0d0c8",1),anim:{type:"slideUp",duration:0.6,delay:0.8,easing:"ease-out",repeat:"once"}} as ButtonElem,
    T.txt("300+ weddings  ·  NYC · Hamptons · Europe  ·  Featured in Vogue",12,80,608,"#c8b0a8",{font:"Inter",w:520,z:3}),
  ]};
  const p2: Page = { id:uid(), label:"Services", bg:"#fef9f6", h:900, elems:[
    T.txt("OUR SERVICES",9,80,80,"#c89898",{font:"Inter",fontWeight:700,ls:4,w:240,z:2}),
    T.txt("How we can help.",48,80,106,"#2a1a1a",{font:"Playfair Display",fontWeight:700,lh:1.1,w:600,z:2,anim:{type:"slideUp",duration:0.7,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.rect(80,198,320,420,"#ffffff",{radius:20,stroke:"#f0e4dd",strokeW:1,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.circ(192,222,56,56,"#f7e8e4",{z:3}),
    T.txt("✦",20,210,230,"#c89898",{font:"Inter",w:20,align:"center",z:4}),
    T.txt("Full\nPlanning",24,108,306,"#2a1a1a",{font:"Playfair Display",fontWeight:700,lh:1.2,w:280,z:3}),
    T.txt("Complete management from engagement to honeymoon. We handle every detail.",14,108,366,"#8a7060",{font:"Inter",lh:1.65,w:280,z:3}),
    T.txt("From $8,500",12,108,460,"#c89898",{font:"Inter",fontWeight:600,w:180,z:3}),
    {...T.btn("Learn More",108,494,264,"#c89898","#fef9f6",30),z:3} as ButtonElem,
    T.rect(430,198,320,420,"#2a1a1a",{radius:20,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.rect(430,198,320,4,"#c89898",{radius:20,z:3}),
    T.circ(542,222,56,56,"#3a2a2a",{z:3}),
    T.txt("✦",20,560,230,"#c89898",{font:"Inter",w:20,align:"center",z:4}),
    T.txt("Partial\nPlanning",24,458,306,"#ffffff",{font:"Playfair Display",fontWeight:700,lh:1.2,w:280,z:3}),
    T.txt("You handle the big pieces; we perfect the details and manage the day.",14,458,366,"#888888",{font:"Inter",lh:1.65,w:280,z:3}),
    T.txt("MOST POPULAR",9,458,460,"#c89898",{font:"Inter",fontWeight:700,ls:3,w:200,z:3}),
    {...T.btn("Learn More",458,494,264,"#c89898","#2a1a1a",30),z:3} as ButtonElem,
    T.rect(780,198,320,420,"#ffffff",{radius:20,stroke:"#f0e4dd",strokeW:1,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.circ(892,222,56,56,"#eef3e8",{z:3}),
    T.txt("✦",20,910,230,"#7a9e7e",{font:"Inter",w:20,align:"center",z:4}),
    T.txt("Floral\nDesign",24,808,306,"#2a1a1a",{font:"Playfair Display",fontWeight:700,lh:1.2,w:280,z:3}),
    T.txt("Bespoke floral design from ceremony arch to every reception table.",14,808,366,"#8a7060",{font:"Inter",lh:1.65,w:280,z:3}),
    T.txt("From $3,200",12,808,460,"#7a9e7e",{font:"Inter",fontWeight:600,w:180,z:3}),
    {...T.btn("Learn More",808,494,264,"transparent","#2a1a1a",30,"#e0d0c8",1),z:3} as ButtonElem,
    T.rect(80,660,1040,196,"#f0e4dd",{radius:20,z:2,anim:{type:"slideUp",duration:0.8,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.txt("\"Bloom & Co. turned our vision into something beyond what we ever imagined.\nEvery detail was perfect, from the florals to the final dance. Our guests\nstill talk about it two years later.\"",16,140,694,"#2a1a1a",{font:"Playfair Display",fontWeight:400,lh:1.65,w:920,align:"center",z:3}),
    T.txt("– Emily & James T., June 2025",12,440,806,"#c89898",{font:"Inter",fontWeight:500,w:320,align:"center",z:3}),
  ]};
  return scaleDocX({ version:1, pages:[p1,p2] }, 1920/1200);
};

// ── Template 16: Fashion Designer ─────────────────────────────────────────────
const fashionTemplate = (): CanvasDoc => {
  const p1: Page = { id:uid(), label:"Lookbook", bg:"#0a0a0a", h:960, elems:[
    T.rect(0,0,1200,64,"#0f0f0f",{z:10}),
    T.txt("MAISON",16,80,20,"#e8d5bc",{font:"Bebas Neue",ls:8,w:140,z:11}),
    T.txt("Collections    About    Press    Contact",12,670,22,"#555555",{font:"Inter",w:490,align:"right",z:11}),
    // Large right image panel
    T.rect(580,0,620,960,"#141414",{z:1}),
    T.rect(620,80,540,680,"#232323",{radius:4,z:2,anim:{type:"fadeIn",duration:0.8,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.txt("LOOKBOOK IMAGE",13,782,398,"#444444",{font:"Inter",fontWeight:700,ls:4,w:356,align:"center",z:3}),
    T.txt("SS 2025",14,1008,796,"#e8d5bc",{font:"Bebas Neue",ls:4,w:130,align:"right",z:3}),
    // Champagne accent strip
    T.rect(0,64,3,896,"linear-gradient(180deg,#e8d5bc 0%,rgba(232,213,188,0.2) 100%)",{z:3}),
    // Left hero text
    T.txt("SPRING\n/\nSUMMER\n2025",62,88,100,"#f5f5f5",{font:"Bebas Neue",ls:4,lh:1.0,w:460,z:3,anim:{type:"slideUp",duration:0.9,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("READY-TO-WEAR · PARIS",10,88,468,"#e8d5bc",{font:"Inter",fontWeight:700,ls:4,w:280,z:3,anim:{type:"fadeIn",duration:0.6,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.rect(88,492,180,1,"#333333",{z:3}),
    T.txt("Where minimalism meets the body. A collection exploring the tension between structure and fluid movement.",15,88,510,"#999999",{font:"Inter",lh:1.75,w:450,z:3,anim:{type:"fadeIn",duration:0.8,delay:0.6,easing:"ease-out",repeat:"once"}}),
    {...T.btn("View Collection",88,600,200,"#e8d5bc","#0a0a0a",2),anim:{type:"slideUp",duration:0.6,delay:0.8,easing:"ease-out",repeat:"once"}} as ButtonElem,
    {...T.btn("About the Designer",308,600,210,"transparent","#e8d5bc",2,"#444444",1),anim:{type:"slideUp",duration:0.6,delay:0.9,easing:"ease-out",repeat:"once"}} as ButtonElem,
    T.txt("As seen in",10,88,690,"#666666",{font:"Inter",fontWeight:600,ls:2,w:120,z:3}),
    T.txt("Vogue  ·  Harper's Bazaar  ·  i-D  ·  AnOther",13,88,710,"#777777",{font:"Inter",fontWeight:500,w:440,z:3}),
  ]};
  const p2: Page = { id:uid(), label:"Collection", bg:"#0a0a0a", h:920, elems:[
    T.txt("SS 2025",10,80,80,"#e8d5bc",{font:"Inter",fontWeight:700,ls:4,w:140,z:2}),
    T.txt("The Collection",50,80,104,"#f5f5f5",{font:"Bebas Neue",ls:2,w:560,z:2,anim:{type:"slideUp",duration:0.7,delay:0.1,easing:"ease-out",repeat:"once"}}),
    // 1 large + 3 small cards
    T.rect(80,180,475,540,"#141414",{radius:5,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("LOOK 01",10,108,700,"#e8d5bc",{font:"Inter",fontWeight:700,ls:3,w:200,z:3}),
    T.txt("Oversized Blazer",18,108,722,"#f5f5f5",{font:"Bebas Neue",ls:2,w:380,z:3}),
    T.txt("€ 1,240",13,108,750,"#888888",{font:"Inter",w:120,z:3}),
    T.rect(595,180,524,258,"#141414",{radius:5,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.txt("LOOK 02",10,623,420,"#e8d5bc",{font:"Inter",fontWeight:700,ls:3,w:200,z:3}),
    T.txt("Silk Column Dress",18,623,442,"#f5f5f5",{font:"Bebas Neue",ls:2,w:420,z:3}),
    T.txt("€ 2,100",13,623,470,"#888888",{font:"Inter",w:120,z:3}),
    T.rect(595,498,252,222,"#141414",{radius:5,z:2,anim:{type:"slideUp",duration:0.7,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.txt("LOOK 03",10,623,700,"#e8d5bc",{font:"Inter",fontWeight:700,ls:3,w:180,z:3}),
    T.txt("Trench Coat",16,623,722,"#f5f5f5",{font:"Bebas Neue",ls:2,w:220,z:3}),
    T.rect(867,498,252,222,"#141414",{radius:5,z:2,anim:{type:"slideUp",duration:0.7,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.txt("LOOK 04",10,895,700,"#e8d5bc",{font:"Inter",fontWeight:700,ls:3,w:180,z:3}),
    T.txt("Wide Leg Trousers",16,895,722,"#f5f5f5",{font:"Bebas Neue",ls:2,w:220,z:3}),
    {...T.btn("Shop Full Collection",430,830,340,"#e8d5bc","#0a0a0a",2),z:2} as ButtonElem,
  ]};
  return scaleDocX({ version:1, pages:[p1,p2] }, 1920/1200);
};

// ── Template: Actor / Performer ──────────────────────────────────────────────
const actorTemplate = (): CanvasDoc => {
  const p1: Page = { id:uid(), label:"Profile", bg:"#090907", h:960, elems:[
    T.rect(0,0,1200,66,"#0d0b09",{z:10}),
    T.txt("YOUR NAME",14,80,21,"#c9a96e",{font:"Bebas Neue",ls:6,w:200,z:11}),
    T.txt("Showreel    Credits    Training    Contact",12,680,22,"#221e12",{font:"Inter",w:480,align:"right",z:11}),
    T.rect(0,66,1200,1,"rgba(201,169,110,0.1)",{z:10}),
    // Left dark headshot panel
    T.rect(0,0,580,960,"#0f0d0a",{z:1}),
    T.rect(60,86,460,660,"#1a160c",{radius:3,z:2,anim:{type:"fadeIn",duration:0.8,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.txt("YOUR\nHEADSHOT",15,180,376,"#2a2416",{font:"Montserrat",fontWeight:700,ls:4,lh:1.5,w:300,align:"center",z:3}),
    // Gold corner bracket accents
    T.rect(60,86,32,2,"#c9a96e",{z:4}),  T.rect(60,86,2,32,"#c9a96e",{z:4}),
    T.rect(488,86,32,2,"#c9a96e",{z:4}), T.rect(518,86,2,32,"#c9a96e",{z:4}),
    T.rect(60,744,32,2,"#c9a96e",{z:4}), T.rect(60,714,2,32,"#c9a96e",{z:4}),
    T.rect(488,744,32,2,"#c9a96e",{z:4}),T.rect(518,714,2,32,"#c9a96e",{z:4}),
    // Stats below photo
    T.rect(60,790,460,1,"rgba(201,169,110,0.12)",{z:3}),
    T.txt("40+",22,80,802,"#c9a96e",{font:"Montserrat",fontWeight:800,w:60,z:3}),
    T.txt("CREDITS",8,80,832,"#2a2416",{font:"Inter",fontWeight:700,ls:3,w:60,z:3}),
    T.txt("12 Yrs",18,210,804,"#f5f0e8",{font:"Montserrat",fontWeight:700,w:80,z:3}),
    T.txt("EXPERIENCE",8,210,832,"#2a2416",{font:"Inter",fontWeight:700,ls:3,w:100,z:3}),
    T.txt("3",22,380,802,"#f5f0e8",{font:"Montserrat",fontWeight:800,w:40,z:3}),
    T.txt("LANGUAGES",8,380,832,"#2a2416",{font:"Inter",fontWeight:700,ls:3,w:100,z:3}),
    T.txt("SAG·AFTRA · AEA",11,60,870,"#c9a96e",{font:"Inter",fontWeight:600,ls:1,w:200,z:3}),
    // Background glow
    T.circ(940,380,420,420,"#c9a96e",{opacity:0.03,z:1,anim:{type:"pulse",duration:8,delay:0,easing:"ease-in-out",repeat:"loop"}}),
    // Right content
    T.txt("FILM · TELEVISION · STAGE",10,620,148,"#c9a96e",{font:"Inter",fontWeight:700,ls:4,w:460,z:3,anim:{type:"fadeIn",duration:0.6,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("Your Name.",60,620,174,"#f5f0e8",{font:"Playfair Display",fontWeight:700,lh:1.05,w:500,z:3,anim:{type:"slideUp",duration:0.8,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.txt("Actor · Performer",18,620,308,"#8b6914",{font:"Playfair Display",fontWeight:400,w:380,z:3,anim:{type:"fadeIn",duration:0.6,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.rect(620,350,200,1,"#c9a96e",{z:3}),
    T.txt("Versatile screen and stage actor with 12 years of professional experience. Known for emotionally grounded performances and extensive range across drama, comedy, and genre work.",16,620,370,"#5a5030",{font:"Inter",lh:1.75,w:500,z:3,anim:{type:"fadeIn",duration:0.8,delay:0.5,easing:"ease-out",repeat:"once"}}),
    {...T.btn("▶  Watch Demo Reel",620,488,230,"#c9a96e","#090907",4),anim:{type:"slideUp",duration:0.6,delay:0.7,easing:"ease-out",repeat:"once"}} as ButtonElem,
    {...T.btn("Contact My Agent",870,488,200,"transparent","#f5f0e8",4,"#2a2416",1),anim:{type:"slideUp",duration:0.6,delay:0.8,easing:"ease-out",repeat:"once"}} as ButtonElem,
    // Press quote card
    T.rect(620,560,500,158,"#111009",{radius:12,stroke:"rgba(201,169,110,0.1)",strokeW:1,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.9,easing:"ease-out",repeat:"once"}}),
    T.txt("✦",16,648,590,"#c9a96e",{font:"Inter",w:20,z:3}),
    T.txt("\"One of the most compelling performances of the year. A star in the making.\"",15,676,588,"#f5f0e8",{font:"Playfair Display",fontWeight:400,lh:1.55,w:420,z:3}),
    T.txt("– The Hollywood Reporter",11,648,672,"#3a3020",{font:"Inter",fontWeight:600,w:280,z:3}),
  ]};

  const p2: Page = { id:uid(), label:"Credits", bg:"#090907", h:960, elems:[
    T.txt("SELECTED CREDITS",10,80,80,"#c9a96e",{font:"Inter",fontWeight:700,ls:4,w:300,z:2}),
    T.txt("Film · Television · Stage",38,80,104,"#f5f0e8",{font:"Playfair Display",fontWeight:700,lh:1.1,w:620,z:2,anim:{type:"slideUp",duration:0.7,delay:0.1,easing:"ease-out",repeat:"once"}}),
    // Featured credit card
    T.rect(80,166,1040,156,"#111009",{radius:12,stroke:"rgba(201,169,110,0.15)",strokeW:1,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.rect(80,166,4,156,"#c9a96e",{z:3}),
    T.txt("FEATURED CREDIT",9,112,190,"#c9a96e",{font:"Inter",fontWeight:700,ls:3,w:260,z:3}),
    T.txt("Detective Marsh",28,112,212,"#f5f0e8",{font:"Playfair Display",fontWeight:700,w:440,z:3}),
    T.txt("Cold Harbor (2024) · Dir. Sofia Alvarez · Paramount Pictures",14,112,254,"#5a5030",{font:"Inter",w:580,z:3}),
    T.txt("Theatrical Release · 38M Views · 94% Rotten Tomatoes",12,112,278,"#8b6914",{font:"Inter",fontWeight:600,w:420,z:3}),
    T.rect(842,190,240,102,"#1a160c",{radius:8,z:3}),
    T.txt("FILM STILL",11,882,234,"#2a2416",{font:"Inter",fontWeight:700,ls:2,w:160,align:"center",z:4}),
    // Three columns of credits
    // Film
    T.rect(80,350,2,510,"rgba(201,169,110,0.12)",{z:2}),
    T.txt("FILM",11,92,358,"#c9a96e",{font:"Montserrat",fontWeight:700,ls:4,w:100,z:3}),
    ...[
      {y:"2024",r:"Det. Marsh",p:"Cold Harbor"},
      {y:"2023",r:"Thomas Reade",p:"Last Light"},
      {y:"2023",r:"Father Brennan",p:"The Crossing"},
      {y:"2022",r:"Marcus Webb",p:"Fractured"},
      {y:"2022",r:"Sam Hollis",p:"After the Storm"},
      {y:"2021",r:"Agent Cole",p:"Blackout"},
    ].flatMap((c,i)=>[
      T.txt(c.y,10,92,384+i*56,"#2a2416",{font:"Inter",fontWeight:600,w:46,z:3}),
      T.txt(c.r,13,142,382+i*56,"#f5f0e8",{font:"Inter",fontWeight:600,w:220,z:3}),
      T.txt(c.p,12,142,400+i*56,"#5a5030",{font:"Playfair Display",w:220,z:3}),
    ]),
    // Television
    T.rect(440,350,2,510,"rgba(201,169,110,0.12)",{z:2}),
    T.txt("TELEVISION",11,452,358,"#c9a96e",{font:"Montserrat",fontWeight:700,ls:4,w:160,z:3}),
    ...[
      {y:"2024",r:"Recurring · Kevin Park",p:"Meridian (Netflix)"},
      {y:"2023",r:"Guest · Dr. Alvarez",p:"Grey's Anatomy (ABC)"},
      {y:"2023",r:"Lead · James Frost",p:"The Bureau – Pilot"},
      {y:"2022",r:"Recurring · Tom Reeves",p:"Succession (HBO)"},
      {y:"2022",r:"Guest · Officer Mills",p:"Law & Order (NBC)"},
      {y:"2021",r:"Series Reg. · Nathan",p:"Sundown (Hulu)"},
    ].flatMap((c,i)=>[
      T.txt(c.y,10,452,384+i*56,"#2a2416",{font:"Inter",fontWeight:600,w:46,z:3}),
      T.txt(c.r,13,502,382+i*56,"#f5f0e8",{font:"Inter",fontWeight:600,w:300,z:3}),
      T.txt(c.p,12,502,400+i*56,"#5a5030",{font:"Playfair Display",w:300,z:3}),
    ]),
    // Theatre
    T.rect(820,350,2,510,"rgba(201,169,110,0.12)",{z:2}),
    T.txt("THEATRE",11,832,358,"#c9a96e",{font:"Montserrat",fontWeight:700,ls:4,w:140,z:3}),
    ...[
      {y:"2024",r:"Hamlet",p:"Old Vic, London"},
      {y:"2023",r:"Atticus Finch",p:"Roundabout Theatre"},
      {y:"2022",r:"Stanley Kowalski",p:"Signature Theatre"},
      {y:"2021",r:"Iago",p:"Shakespeare in the Park"},
      {y:"2020",r:"Willy Loman",p:"Broadway – Lyceum"},
    ].flatMap((c,i)=>[
      T.txt(c.y,10,832,384+i*56,"#2a2416",{font:"Inter",fontWeight:600,w:46,z:3}),
      T.txt(c.r,14,882,382+i*56,"#f5f0e8",{font:"Inter",fontWeight:600,w:200,z:3}),
      T.txt(c.p,12,882,400+i*56,"#5a5030",{font:"Playfair Display",w:200,z:3}),
    ]),
    T.rect(80,710,1040,1,"rgba(201,169,110,0.08)",{z:2}),
    T.txt("Full credits, footage, and references available upon request.",12,80,728,"#2a2416",{font:"Inter",w:560,z:2}),
    {...T.btn("Request Full Credits Package",80,754,300,"transparent","#c9a96e",4,"#2a2416",1),z:2} as ButtonElem,
  ]};

  const p3: Page = { id:uid(), label:"Training", bg:"#090907", h:860, elems:[
    // Dark left panel
    T.rect(0,0,520,860,"#0f0d0a",{z:1}),
    T.txt("TRAINING &\nEDUCATION",44,60,88,"#f5f0e8",{font:"Playfair Display",fontWeight:700,lh:1.1,w:400,z:2,anim:{type:"slideRight",duration:0.8,delay:0.1,easing:"ease-out",repeat:"once"}}),
    T.txt("Juilliard School",18,60,226,"#c9a96e",{font:"Playfair Display",fontWeight:700,w:380,z:2}),
    T.txt("MFA Acting · Class of 2014",13,60,254,"#5a5030",{font:"Inter",w:380,z:2}),
    T.rect(60,278,300,1,"rgba(201,169,110,0.12)",{z:2}),
    T.txt("Royal Academy of Dramatic Art",18,60,296,"#f5f0e8",{font:"Playfair Display",fontWeight:700,w:420,z:2}),
    T.txt("Intensive · London, 2016–2017",13,60,324,"#5a5030",{font:"Inter",w:380,z:2}),
    T.rect(60,348,300,1,"rgba(201,169,110,0.12)",{z:2}),
    T.txt("The Strasberg Institute",18,60,366,"#f5f0e8",{font:"Playfair Display",fontWeight:700,w:380,z:2}),
    T.txt("Method Acting · New York, ongoing",13,60,394,"#5a5030",{font:"Inter",w:380,z:2}),
    T.rect(60,420,300,1,"rgba(201,169,110,0.12)",{z:2}),
    T.txt("PRIVATE COACHING",9,60,438,"#2a2416",{font:"Inter",fontWeight:700,ls:4,w:280,z:2}),
    T.txt("Movement (Suzuki): Anna Chen\nVoice & Speech: David Park\nDialect & Accent: Sarah Miles",13,60,462,"#5a5030",{font:"Inter",lh:1.7,w:420,z:2}),
    T.circ(360,710,180,180,"#c9a96e",{opacity:0.04,z:1}),
    // Right skills panel
    T.txt("SKILLS & RANGE",9,560,88,"#c9a96e",{font:"Inter",fontWeight:700,ls:4,w:280,z:3}),
    ...([
      ["Acting Range",98,"#c9a96e"],
      ["Physical Theatre",90,"#8b6914"],
      ["Stage Combat (BASSC)",88,"#c9a96e"],
      ["Improvisation",85,"#8b6914"],
      ["Singing (Tenor)",80,"#c9a96e"],
    ] as [string,number,string][]).flatMap(([s,v,c],i)=>[
      T.txt(s,12,560,118+i*44,"#f5f0e8",{font:"Inter",fontWeight:500,w:240,z:3}),
      T.bar(560,136+i*44,530,v,c,"#1a160c"),
    ]),
    T.txt("LANGUAGES",9,560,338,"#c9a96e",{font:"Inter",fontWeight:700,ls:4,w:200,z:3}),
    ...([
      ["English (Native)",100,"#c9a96e"],
      ["French (Fluent)",88,"#8b6914"],
      ["Spanish (Conversational)",65,"#c9a96e"],
    ] as [string,number,string][]).flatMap(([s,v,c],i)=>[
      T.txt(s,12,560,362+i*44,"#f5f0e8",{font:"Inter",fontWeight:500,w:240,z:3}),
      T.bar(560,380+i*44,530,v,c,"#1a160c"),
    ]),
    T.txt("ACCENTS & DIALECTS",9,560,490,"#c9a96e",{font:"Inter",fontWeight:700,ls:4,w:280,z:3}),
    T.txt("RP British · Standard American · Southern American\nNew York · Boston · Irish · Australian · Scottish",13,560,512,"#5a5030",{font:"Inter",lh:1.65,w:530,z:3}),
    T.rect(560,572,530,1,"rgba(201,169,110,0.12)",{z:3}),
    T.txt("REPRESENTED BY",9,560,590,"#2a2416",{font:"Inter",fontWeight:700,ls:4,w:280,z:3}),
    T.txt("Creative Artists Agency – (212) 555-0142",14,560,612,"#c9a96e",{font:"Inter",fontWeight:600,w:480,z:3}),
    T.txt("For auditions and casting enquiries, contact the agent directly.",12,560,640,"#2a2416",{font:"Inter",w:500,z:3}),
    {...T.btn("▶  Demo Reel",560,672,198,"#c9a96e","#090907",4),z:3} as ButtonElem,
    {...T.btn("Download Headshots",778,672,240,"transparent","#c9a96e",4,"#2a2416",1),z:3} as ButtonElem,
  ]};

  return scaleDocX({ version:1, pages:[p1,p2,p3] }, 1920/1200);
};

// ── Modern editorial templates (reference-style, single statement page) ───────

// Bold oversized typographic hero.
const reflectTemplate = (): CanvasDoc => {
  const p1: Page = { id:uid(), label:"Home", bg:"#f4f4f5", h:820, elems:[
    T.txt("REFLECT STUDIO",13,80,32,"#0e0e10",{font:"Montserrat",fontWeight:800,ls:1,w:320,z:11}),
    T.txt("Gallery     Recognition     Shop",12,760,34,"#6b6b73",{font:"Inter",w:360,align:"right",z:11}),
    T.rect(80,92,360,300,"linear-gradient(135deg,#2f6df6,#16b8d6)",{radius:12,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.rect(470,150,200,242,"linear-gradient(160deg,#e9eaec,#cfd2d8)",{radius:12,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.rect(820,110,300,200,"linear-gradient(150deg,#f15a24,#7d1f3f)",{radius:12,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.txt("Reflect.",172,36,448,"#0e0e10",{font:"Montserrat",fontWeight:800,ls:-6,lh:0.9,w:1130,z:3,anim:{type:"slideUp",duration:0.9,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.txt("Design beyond boundaries, a multidisciplinary studio crafting brands, objects & spaces.",17,82,700,"#6b6b73",{font:"Inter",lh:1.6,w:620,z:3,anim:{type:"fadeIn",duration:0.8,delay:0.6,easing:"ease-out",repeat:"once"}}),
  ]};
  const p2: Page = { id:uid(), label:"Work", bg:"#f4f4f5", h:880, elems:[
    T.txt("SELECTED WORK",12,80,80,"#6b6b73",{font:"Montserrat",fontWeight:800,ls:2,w:300,z:2}),
    T.txt("Projects",60,80,104,"#0e0e10",{font:"Montserrat",fontWeight:800,ls:-3,w:600,z:2}),
    T.rect(80,220,520,290,"linear-gradient(135deg,#2f6df6,#16b8d6)",{radius:12,z:2}),
    T.txt("BRANDING",11,104,242,"#ffffff",{font:"Montserrat",fontWeight:800,ls:2,w:220,z:3}),
    T.txt("Lumen Identity",24,104,452,"#ffffff",{font:"Montserrat",fontWeight:700,w:400,z:3}),
    T.rect(620,220,500,290,"linear-gradient(150deg,#f15a24,#7d1f3f)",{radius:12,z:2}),
    T.txt("PRODUCT",11,644,242,"#ffffff",{font:"Montserrat",fontWeight:800,ls:2,w:220,z:3}),
    T.txt("Atlas Watch",24,644,452,"#ffffff",{font:"Montserrat",fontWeight:700,w:400,z:3}),
    T.rect(80,530,500,270,"linear-gradient(160deg,#1b1d22,#3a3f4a)",{radius:12,z:2}),
    T.txt("SPATIAL",11,104,552,"#ffffff",{font:"Montserrat",fontWeight:800,ls:2,w:220,z:3}),
    T.txt("Form Gallery",24,104,742,"#ffffff",{font:"Montserrat",fontWeight:700,w:400,z:3}),
    T.rect(600,530,520,270,"linear-gradient(140deg,#caa06f,#e8c39e)",{radius:12,z:2}),
    T.txt("EDITORIAL",11,624,552,"#3a2f1f",{font:"Montserrat",fontWeight:800,ls:2,w:220,z:3}),
    T.txt("Paper Quarterly",24,624,742,"#2a2118",{font:"Montserrat",fontWeight:700,w:400,z:3}),
  ]};
  const p3: Page = { id:uid(), label:"About", bg:"#f4f4f5", h:720, elems:[
    T.rect(80,90,420,520,"linear-gradient(135deg,#2f6df6,#16b8d6)",{radius:12,z:2}),
    T.txt("YOUR PHOTO",12,80,330,"#dbe7ff",{font:"Montserrat",fontWeight:800,ls:2,align:"center",w:420,z:3}),
    T.txt("ABOUT THE STUDIO",12,560,110,"#6b6b73",{font:"Montserrat",fontWeight:800,ls:2,w:400,z:2}),
    T.txt("We design\nwith intent.",58,560,138,"#0e0e10",{font:"Montserrat",fontWeight:800,ls:-2,lh:1.04,w:560,z:2}),
    T.txt("Reflect is a multidisciplinary studio working across brand, product and space. We partner with ambitious teams to build work that lasts.",16,560,308,"#6b6b73",{font:"Inter",lh:1.7,w:540,z:2}),
    {...T.btn("Start a project",560,438,210,"#0e0e10","#ffffff",0,"none",0,52,14)} as ButtonElem,
    T.txt("40+",30,560,548,"#0e0e10",{font:"Montserrat",fontWeight:800,w:120,z:2}),
    T.txt("PROJECTS",10,560,592,"#6b6b73",{font:"Inter",fontWeight:700,ls:2,w:120,z:2}),
    T.txt("12",30,720,548,"#0e0e10",{font:"Montserrat",fontWeight:800,w:120,z:2}),
    T.txt("AWARDS",10,720,592,"#6b6b73",{font:"Inter",fontWeight:700,ls:2,w:120,z:2}),
    T.txt("9yrs",30,880,548,"#0e0e10",{font:"Montserrat",fontWeight:800,w:120,z:2}),
    T.txt("STUDIO",10,880,592,"#6b6b73",{font:"Inter",fontWeight:700,ls:2,w:120,z:2}),
  ]};
  return scaleDocX({ version:1, pages:[p1,p2,p3] }, 1920/1200);
};

// Full-bleed dark photography with a centered serif headline.
const wandererTemplate = (): CanvasDoc => {
  const p1: Page = { id:uid(), label:"Home", bg:"#0a0a0a", h:820, elems:[
    T.rect(0,0,1200,820,"linear-gradient(165deg,#0c1c15 0%,#0a0f0c 55%,#06100b 100%)",{z:1}),
    T.circ(840,-120,520,520,"#2f6d4f",{opacity:0.12,z:1,anim:{type:"pulse",duration:7,delay:0,easing:"ease-in-out",repeat:"loop"}}),
    T.txt("WANDER",13,80,36,"#f3f6f4",{font:"Inter",fontWeight:600,ls:4,w:220,z:5}),
    T.txt("photos    films    journal",11,760,38,"#aebbb3",{font:"Inter",ls:1,w:360,align:"right",z:5}),
    T.txt("otherworldly\niceland",62,200,288,"#f3f6f4",{font:"Playfair Display",fontWeight:400,italic:true,align:"center",lh:1.05,w:800,z:5,anim:{type:"fadeIn",duration:1,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.rect(590,470,20,2,"#aebbb3",{z:5}),
    T.txt("Photos & films by Maya, eleven days chasing light across the highlands.",14,300,500,"#b8c4bd",{font:"Inter",align:"center",lh:1.6,w:600,z:5,anim:{type:"fadeIn",duration:0.9,delay:0.5,easing:"ease-out",repeat:"once"}}),
    {...T.btn("View the series",500,580,200,"transparent","#f3f6f4",0,"#3a4a42",1,50,13),anim:{type:"fadeIn",duration:0.7,delay:0.8,easing:"ease-out",repeat:"once"}} as ButtonElem,
  ]};
  const p2: Page = { id:uid(), label:"Gallery", bg:"#0a0a0a", h:900, elems:[
    T.txt("THE SERIES",11,80,80,"#7fae97",{font:"Inter",fontWeight:600,ls:3,w:300,z:2}),
    T.txt("Highlands",54,80,104,"#f3f6f4",{font:"Playfair Display",fontWeight:400,italic:true,w:500,z:2}),
    T.rect(80,210,330,250,"linear-gradient(150deg,#16382a,#0a120d)",{radius:6,z:2}),
    T.txt("Skógafoss",13,98,432,"#cdd8d1",{font:"Inter",w:200,z:3}),
    T.rect(470,210,330,250,"linear-gradient(150deg,#123026,#0a120d)",{radius:6,z:2}),
    T.txt("Reynisfjara",13,488,432,"#cdd8d1",{font:"Inter",w:200,z:3}),
    T.rect(860,210,330,250,"linear-gradient(150deg,#1a3a2c,#0a120d)",{radius:6,z:2}),
    T.txt("Vestrahorn",13,878,432,"#cdd8d1",{font:"Inter",w:200,z:3}),
    T.rect(80,486,330,250,"linear-gradient(150deg,#10261d,#0a120d)",{radius:6,z:2}),
    T.txt("Jökulsárlón",13,98,708,"#cdd8d1",{font:"Inter",w:200,z:3}),
    T.rect(470,486,330,250,"linear-gradient(150deg,#1c4030,#0a120d)",{radius:6,z:2}),
    T.txt("Diamond Beach",13,488,708,"#cdd8d1",{font:"Inter",w:200,z:3}),
    T.rect(860,486,330,250,"linear-gradient(150deg,#143226,#0a120d)",{radius:6,z:2}),
    T.txt("Landmannalaugar",13,878,708,"#cdd8d1",{font:"Inter",w:220,z:3}),
  ]};
  const p3: Page = { id:uid(), label:"About", bg:"#0a0a0a", h:760, elems:[
    T.rect(72,90,420,500,"linear-gradient(160deg,#16382a,#0a120d)",{radius:8,z:2}),
    T.txt("BEHIND THE LENS",11,560,110,"#7fae97",{font:"Inter",fontWeight:600,ls:3,w:400,z:2}),
    T.txt("Chasing\nthe light.",54,560,138,"#f3f6f4",{font:"Playfair Display",fontWeight:400,italic:true,lh:1.05,w:560,z:2}),
    T.txt("Maya is a landscape photographer and filmmaker based in Reykjavík, documenting the raw edges of the north, one expedition at a time.",16,560,308,"#9fb1a7",{font:"Inter",lh:1.7,w:520,z:2}),
    {...T.btn("Get in touch",560,440,200,"transparent","#f3f6f4",0,"#3a4a42",1,50,13)} as ButtonElem,
    T.txt("hello@wander.co",15,560,544,"#7fae97",{font:"Inter",w:300,z:2}),
  ]};
  return scaleDocX({ version:1, pages:[p1,p2,p3] }, 1920/1200);
};

// Clean fine-art gallery: centered serif statement above a row of works.
const fineArtTemplate = (): CanvasDoc => {
  const p1: Page = { id:uid(), label:"Home", bg:"#ffffff", h:760, elems:[
    T.txt("All Prints     About",12,80,34,"#6b6b73",{font:"Inter",w:260,z:11}),
    T.txt("Jay Montclaire",16,450,30,"#1a1a1a",{font:"Playfair Display",fontWeight:500,align:"center",w:300,z:11}),
    T.txt("Fine Art Painter.\nPrintmaker.",54,300,148,"#1a1a1a",{font:"Playfair Display",fontWeight:400,align:"center",lh:1.15,w:600,z:3,anim:{type:"slideUp",duration:0.8,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.rect(80,360,330,300,"linear-gradient(135deg,#e8c39e,#caa06f)",{radius:4,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.rect(435,360,330,300,"linear-gradient(140deg,#2a2a2a,#4a4a4a)",{radius:4,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.rect(790,360,330,300,"linear-gradient(135deg,#3f7fe0,#7db0f5)",{radius:4,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.txt("Selected prints, limited editions, shipped worldwide.",13,360,690,"#6b6b73",{font:"Inter",align:"center",w:480,z:3}),
  ]};
  const p2: Page = { id:uid(), label:"Prints", bg:"#ffffff", h:880, elems:[
    T.txt("Prints",52,80,80,"#1a1a1a",{font:"Playfair Display",fontWeight:400,w:400,z:2}),
    T.txt("Limited editions, hand-pulled.",14,80,150,"#6b6b73",{font:"Inter",w:400,z:2}),
    T.rect(80,210,330,260,"linear-gradient(135deg,#e8c39e,#caa06f)",{radius:4,z:2}),
    T.txt("Dune No. 4",15,80,480,"#1a1a1a",{font:"Playfair Display",w:330,z:3}),
    T.txt("$320",13,80,506,"#6b6b73",{font:"Inter",w:330,z:3}),
    T.rect(435,210,330,260,"linear-gradient(140deg,#2a2a2a,#4a4a4a)",{radius:4,z:2}),
    T.txt("Nightfall",15,435,480,"#1a1a1a",{font:"Playfair Display",w:330,z:3}),
    T.txt("$280",13,435,506,"#6b6b73",{font:"Inter",w:330,z:3}),
    T.rect(790,210,330,260,"linear-gradient(135deg,#3f7fe0,#7db0f5)",{radius:4,z:2}),
    T.txt("Tide",15,790,480,"#1a1a1a",{font:"Playfair Display",w:330,z:3}),
    T.txt("$340",13,790,506,"#6b6b73",{font:"Inter",w:330,z:3}),
    T.rect(80,560,330,260,"linear-gradient(135deg,#cdb4db,#a98fc9)",{radius:4,z:2}),
    T.txt("Bloom",15,80,830,"#1a1a1a",{font:"Playfair Display",w:330,z:3}),
    T.rect(435,560,330,260,"linear-gradient(135deg,#b7d8c0,#7fae97)",{radius:4,z:2}),
    T.txt("Meadow",15,435,830,"#1a1a1a",{font:"Playfair Display",w:330,z:3}),
    T.rect(790,560,330,260,"linear-gradient(135deg,#e3a9a0,#c97f74)",{radius:4,z:2}),
    T.txt("Ember",15,790,830,"#1a1a1a",{font:"Playfair Display",w:330,z:3}),
  ]};
  const p3: Page = { id:uid(), label:"About", bg:"#ffffff", h:720, elems:[
    T.rect(80,90,420,520,"linear-gradient(140deg,#2a2a2a,#4a4a4a)",{radius:4,z:2}),
    T.txt("About",14,560,110,"#6b6b73",{font:"Inter",ls:2,w:300,z:2}),
    T.txt("Painter &\nprintmaker.",50,560,140,"#1a1a1a",{font:"Playfair Display",fontWeight:400,lh:1.15,w:520,z:2}),
    T.txt("Jay Montclaire works from a studio in Lisbon, making oil paintings and hand-pulled prints in small, considered editions.",16,560,308,"#6b6b73",{font:"Inter",lh:1.7,w:520,z:2}),
    {...T.btn("Commission a piece",560,430,240,"#1a1a1a","#ffffff",0,"none",0,52,13)} as ButtonElem,
    T.txt("Shown at Tate · MoMA · Gagosian",13,560,534,"#9a9aa3",{font:"Inter",w:460,z:2}),
  ]};
  return scaleDocX({ version:1, pages:[p1,p2,p3] }, 1920/1200);
};

// Bold centered statement with two image cards.
const letteringTemplate = (): CanvasDoc => {
  const p1: Page = { id:uid(), label:"Home", bg:"#ededee", h:760, elems:[
    T.txt("Work    Shop    Blog    Contact",12,80,34,"#4a4a4f",{font:"Inter",fontWeight:500,w:320,z:11}),
    T.txt("Ida Kester",15,450,30,"#1a1a1a",{font:"Inter",fontWeight:700,align:"center",w:300,z:11}),
    T.txt("Ida Kester is a hand-lettering\nartist & illustrator based in Detroit.",30,250,140,"#1a1a1a",{font:"Inter",fontWeight:700,align:"center",lh:1.3,w:700,z:3,anim:{type:"slideUp",duration:0.8,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.rect(180,320,400,360,"linear-gradient(140deg,#1a1a1a,#3a3a3a)",{radius:8,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.txt("GARY GATORS",18,200,480,"#e0c04a",{font:"Bebas Neue",ls:2,align:"center",w:360,z:3}),
    T.rect(620,320,400,360,"linear-gradient(140deg,#c23b2a,#e07a2a)",{radius:8,z:2,anim:{type:"fadeIn",duration:0.7,delay:0.4,easing:"ease-out",repeat:"once"}}),
    T.txt("TEX-MEX",22,640,480,"#fff4e0",{font:"Bebas Neue",ls:2,align:"center",w:360,z:3}),
  ]};
  const p2: Page = { id:uid(), label:"Work", bg:"#ededee", h:870, elems:[
    T.txt("Selected Work",30,80,80,"#1a1a1a",{font:"Inter",fontWeight:700,w:500,z:2}),
    T.rect(80,170,500,300,"linear-gradient(140deg,#1a1a1a,#3a3a3a)",{radius:8,z:2}),
    T.txt("GARY GATORS",28,100,300,"#e0c04a",{font:"Bebas Neue",ls:2,w:460,align:"center",z:3}),
    T.rect(620,170,500,300,"linear-gradient(140deg,#c23b2a,#e07a2a)",{radius:8,z:2}),
    T.txt("TEX-MEX BBQ",28,640,300,"#fff4e0",{font:"Bebas Neue",ls:2,w:460,align:"center",z:3}),
    T.rect(80,500,500,300,"linear-gradient(140deg,#2563eb,#60a5fa)",{radius:8,z:2}),
    T.txt("BLUE NOTE",28,100,630,"#eaf2ff",{font:"Bebas Neue",ls:2,w:460,align:"center",z:3}),
    T.rect(620,500,500,300,"linear-gradient(140deg,#16a34a,#86efac)",{radius:8,z:2}),
    T.txt("FARMERS CO.",28,640,630,"#0a2a16",{font:"Bebas Neue",ls:2,w:460,align:"center",z:3}),
  ]};
  const p3: Page = { id:uid(), label:"About", bg:"#ededee", h:700, elems:[
    T.rect(80,90,400,480,"linear-gradient(140deg,#1a1a1a,#3a3a3a)",{radius:8,z:2}),
    T.txt("ABOUT",14,540,110,"#6b6b73",{font:"Inter",fontWeight:700,ls:2,w:300,z:2}),
    T.txt("Hand-lettering\n& illustration.",46,540,138,"#1a1a1a",{font:"Inter",fontWeight:700,lh:1.1,w:560,z:2}),
    T.txt("Ida Kester is a Detroit-based lettering artist working with brands big and small to draw words worth reading.",16,540,300,"#4a4a4f",{font:"Inter",lh:1.7,w:540,z:2}),
    {...T.btn("Work with me",540,410,200,"#1a1a1a","#ffffff",6,"none",0,52,13)} as ButtonElem,
    T.txt("hello@idakester.com",14,540,510,"#4a4a4f",{font:"Inter",w:360,z:2}),
  ]};
  return scaleDocX({ version:1, pages:[p1,p2,p3] }, 1920/1200);
};

// Minimal press / shop with a bold graphic poster.
const pressTemplate = (): CanvasDoc => {
  const p1: Page = { id:uid(), label:"Home", bg:"#ffffff", h:760, elems:[
    T.txt("Shop    About    Contact",11,80,32,"#6b6b73",{font:"Inter",w:280,z:11}),
    T.txt("Jotter Press",15,450,28,"#1a1a1a",{font:"Playfair Display",fontWeight:500,align:"center",w:300,z:11}),
    T.rect(0,66,1200,1,"#ececec",{z:10}),
    T.txt("New Releases in Shop",22,400,96,"#1a1a1a",{font:"Playfair Display",fontWeight:400,align:"center",w:400,z:3,anim:{type:"fadeIn",duration:0.7,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.rect(420,160,360,520,"#16a34a",{radius:4,z:2,anim:{type:"slideUp",duration:0.8,delay:0.3,easing:"ease-out",repeat:"once"}}),
    T.txt("Navigating\nExhibition",28,450,196,"#ffffff",{font:"Inter",fontWeight:800,lh:1.1,w:300,z:3,anim:{type:"fadeIn",duration:0.7,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.svg(SHAPES[0],452,360,300,110,"none",{stroke:"#ec6fc0",strokeW:6,svgContent:`<polyline points="2,8 70,52 2,96 70,140" fill="none"/>`,viewBox:"0 0 72 148",z:3}),
    T.txt("Mark Novo",16,450,600,"#ffffff",{font:"Inter",fontWeight:700,w:300,z:3}),
    T.txt("‹",30,360,400,"#bdbdbd",{font:"Inter",w:40,align:"center",z:3}),
    T.txt("›",30,800,400,"#bdbdbd",{font:"Inter",w:40,align:"center",z:3}),
  ]};
  const p2: Page = { id:uid(), label:"Shop", bg:"#ffffff", h:800, elems:[
    T.txt("Shop",40,80,80,"#1a1a1a",{font:"Playfair Display",fontWeight:400,w:300,z:2}),
    T.rect(0,150,1200,1,"#ececec",{z:2}),
    T.rect(80,190,330,420,"#16a34a",{radius:4,z:2}),
    T.txt("Navigating",22,100,214,"#ffffff",{font:"Inter",fontWeight:800,w:290,z:3}),
    T.txt("Risograph Poster",15,80,628,"#1a1a1a",{font:"Playfair Display",w:330,z:3}),
    T.txt("$28",13,80,656,"#6b6b73",{font:"Inter",w:200,z:3}),
    T.rect(435,190,330,420,"#e11d48",{radius:4,z:2}),
    T.txt("Sunset Run",22,455,214,"#fff0f2",{font:"Inter",fontWeight:800,w:290,z:3}),
    T.txt("Two-Colour Print",15,435,628,"#1a1a1a",{font:"Playfair Display",w:330,z:3}),
    T.txt("$24",13,435,656,"#6b6b73",{font:"Inter",w:200,z:3}),
    T.rect(790,190,330,420,"#1d4ed8",{radius:4,z:2}),
    T.txt("Field Notes",22,810,214,"#eef2ff",{font:"Inter",fontWeight:800,w:290,z:3}),
    T.txt("Zine · 32pp",15,790,628,"#1a1a1a",{font:"Playfair Display",w:330,z:3}),
    T.txt("$18",13,790,656,"#6b6b73",{font:"Inter",w:200,z:3}),
  ]};
  const p3: Page = { id:uid(), label:"About", bg:"#ffffff", h:680, elems:[
    T.txt("About Jotter Press",40,300,110,"#1a1a1a",{font:"Playfair Display",fontWeight:400,align:"center",w:600,z:3}),
    T.txt("An independent risograph studio printing posters, zines and prints in small runs since 2018.",17,330,196,"#6b6b73",{font:"Inter",align:"center",lh:1.7,w:540,z:3}),
    T.rect(80,300,1040,300,"linear-gradient(120deg,#16a34a,#86efac)",{radius:6,z:2}),
    T.txt("Risograph · Letterpress · Screenprint",13,400,540,"#0a2a16",{font:"Inter",fontWeight:600,ls:1,align:"center",w:400,z:3}),
  ]};
  return scaleDocX({ version:1, pages:[p1,p2,p3] }, 1920/1200);
};

// Clean serif intro over a full-width abstract image.
const spottedTemplate = (): CanvasDoc => {
  const p1: Page = { id:uid(), label:"Home", bg:"#ffffff", h:780, elems:[
    T.txt("Shop    About    Contact",11,80,32,"#6b6b73",{font:"Inter",w:280,z:11}),
    T.txt("Spotted",16,450,28,"#1a1a1a",{font:"Playfair Display",fontWeight:500,align:"center",w:300,z:11}),
    T.rect(80,92,1040,420,"linear-gradient(120deg,#f6b8c8 0%,#f7d34b 100%)",{radius:8,z:2,anim:{type:"fadeIn",duration:0.8,delay:0.2,easing:"ease-out",repeat:"once"}}),
    T.txt("Watercolor paintings that capture\nthe sophisticated moments.",26,300,560,"#1a1a1a",{font:"Playfair Display",fontWeight:400,align:"center",lh:1.25,w:600,z:3,anim:{type:"slideUp",duration:0.8,delay:0.5,easing:"ease-out",repeat:"once"}}),
    T.txt("New Collection · 2025",12,460,690,"#9a9aa3",{font:"Inter",ls:2,align:"center",w:280,z:3}),
  ]};
  const p2: Page = { id:uid(), label:"Gallery", bg:"#ffffff", h:880, elems:[
    T.txt("Gallery",52,80,80,"#1a1a1a",{font:"Playfair Display",fontWeight:400,w:400,z:2}),
    T.rect(80,200,510,300,"linear-gradient(120deg,#f6b8c8,#f7d34b)",{radius:6,z:2}),
    T.rect(610,200,510,300,"linear-gradient(120deg,#a7d8f0,#c8f0c8)",{radius:6,z:2}),
    T.rect(80,520,510,300,"linear-gradient(120deg,#d8c8f0,#f6b8c8)",{radius:6,z:2}),
    T.rect(610,520,510,300,"linear-gradient(120deg,#f7d34b,#f0a0a0)",{radius:6,z:2}),
  ]};
  const p3: Page = { id:uid(), label:"About", bg:"#ffffff", h:700, elems:[
    T.txt("About",14,80,110,"#9a9aa3",{font:"Inter",ls:2,w:300,z:2}),
    T.txt("Soft moments,\nin watercolor.",48,80,138,"#1a1a1a",{font:"Playfair Display",fontWeight:400,lh:1.15,w:500,z:2}),
    T.txt("Spotted is the studio of a watercolor artist capturing quiet, sophisticated moments in paint, commissions and prints available.",16,80,308,"#6b6b73",{font:"Inter",lh:1.7,w:480,z:2}),
    {...T.btn("Commission a piece",80,430,220,"#1a1a1a","#ffffff",999,"none",0,50,13)} as ButtonElem,
    T.rect(640,90,480,520,"linear-gradient(120deg,#f6b8c8,#f7d34b)",{radius:8,z:2}),
  ]};
  return scaleDocX({ version:1, pages:[p1,p2,p3] }, 1920/1200);
};

const TEMPLATES: {name:string; emoji:string; make:()=>CanvasDoc}[] = [
  { name:"Reflect",      emoji:"◼", make:reflectTemplate },
  { name:"Wanderer",     emoji:"❖", make:wandererTemplate },
  { name:"Fine Art",     emoji:"✎", make:fineArtTemplate },
  { name:"Lettering",    emoji:"✦", make:letteringTemplate },
  { name:"Press",        emoji:"❏", make:pressTemplate },
  { name:"Spotted",      emoji:"◓", make:spottedTemplate },
  { name:"Blank",        emoji:"⬜", make:blank },
  { name:"Photographer", emoji:"◆", make:photographerTemplate },
  { name:"Developer",    emoji:"◈", make:developerTemplate },
  { name:"Designer",     emoji:"◉", make:designerTemplate },
  { name:"Influencer",   emoji:"★", make:influencerTemplate },
  { name:"Musician",     emoji:"♪", make:musicArtistTemplate },
  { name:"Agency",       emoji:"◐", make:agencyTemplate },
  { name:"Startup",      emoji:"⬡", make:startupTemplate },
  { name:"Resume",       emoji:"▣", make:cvTemplate },
  { name:"Fitness",      emoji:"⚡", make:fitnessTemplate },
  { name:"Chef",         emoji:"◑", make:chefTemplate },
  { name:"Podcast",      emoji:"◍", make:podcastTemplate },
  { name:"Architect",    emoji:"□", make:architectTemplate },
  { name:"Wedding",      emoji:"◇", make:weddingTemplate },
  { name:"Fashion",      emoji:"▲", make:fashionTemplate },
  { name:"Actor",        emoji:"✦", make:actorTemplate },
];

const ANIM_TYPES: {id:AnimType; label:string; icon:string}[] = [
  {id:"none",      label:"None",     icon:"–"},
  {id:"fadeIn",    label:"Fade",     icon:"✦"},
  {id:"slideUp",   label:"Slide ↑",  icon:"↑"},
  {id:"slideDown", label:"Slide ↓",  icon:"↓"},
  {id:"slideLeft", label:"Slide ←",  icon:"←"},
  {id:"slideRight",label:"Slide →",  icon:"→"},
  {id:"zoomIn",    label:"Zoom In",  icon:"⊕"},
  {id:"zoomOut",   label:"Zoom Out", icon:"⊖"},
  {id:"bounce",    label:"Bounce",   icon:"⤸"},
  {id:"pulse",     label:"Pulse",    icon:"◉"},
  {id:"spin",      label:"Spin",     icon:"↻"},
  {id:"shake",     label:"Shake",    icon:"≈"},
  {id:"flip",      label:"Flip",     icon:"⟳"},
  {id:"float",     label:"Float",    icon:"↟"},
];
const DEFAULT_ANIM: AnimConfig = { type:"none", duration:0.6, delay:0, easing:"ease", repeat:"once" };

const GRAD_TEXT_PRESETS = [
  {name:"Sunset",  val:"linear-gradient(90deg,#f97316,#ef4444,#ec4899)"},
  {name:"Ocean",   val:"linear-gradient(90deg,#06b6d4,#3b82f6,#6366f1)"},
  {name:"Forest",  val:"linear-gradient(90deg,#22c55e,#10b981,#06b6d4)"},
  {name:"Gold",    val:"linear-gradient(90deg,#fbbf24,#f59e0b,#d97706)"},
  {name:"Aurora",  val:"linear-gradient(90deg,#8b5cf6,#ec4899,#ef4444)"},
  {name:"Mint",    val:"linear-gradient(90deg,#10b981,#22d3ee)"},
];

// â"€â"€ Text presets â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const TEXT_PRESETS = [
  { label:"Heading",    size:64, bold:true,  font:"Inter" },
  { label:"Subheading", size:36, bold:true,  font:"Inter" },
  { label:"Title",      size:28, bold:true,  font:"Inter" },
  { label:"Body",       size:18, bold:false, font:"Inter" },
  { label:"Caption",    size:14, bold:false, font:"Inter" },
  { label:"Quote",      size:24, bold:false, font:"Playfair Display" },
  { label:"Label",      size:12, bold:false, font:"Inter" },
  { label:"Display",    size:96, bold:true,  font:"Montserrat" },
];

// â"€â"€ Elem rendering â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function ElemContent({ el }: { el: Elem }) {
  if (el.type === "text") {
    const strokeCSS: React.CSSProperties = el.textStroke && el.textStrokeW
      ? { WebkitTextStroke: `${el.textStrokeW}px ${el.textStroke}` } as React.CSSProperties : {};
    const gradCSS: React.CSSProperties = el.gradientText ? {
      backgroundImage: el.gradientText,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      color: "transparent",
    } as React.CSSProperties : {};
    const tshadow = el.textShadow
      ? `${el.textShadow.x}px ${el.textShadow.y}px ${el.textShadow.blur}px ${el.textShadow.color}`
      : undefined;
    return (
      <div style={{
        width:"100%", height:"100%",
        fontFamily: fontFamily(el.font),
        fontSize:el.size,
        fontWeight: el.fontWeight ?? (el.bold ? 700 : 400),
        fontStyle:el.italic?"italic":"normal",
        textDecoration:el.underline?"underline":"none",
        textAlign:el.align, color:el.color,
        lineHeight:el.lh, letterSpacing:el.ls?`${el.ls}px`:undefined,
        textTransform: (el.textTransform && el.textTransform!=="none") ? el.textTransform as any : undefined,
        whiteSpace:"pre-wrap", wordBreak:"break-word",
        overflow:"visible", padding:"4px",
        backgroundColor:el.highlight||undefined,
        textShadow: tshadow,
        ...strokeCSS,
        ...gradCSS,
      }}>
        {el.content || <span style={{opacity:0.3,WebkitTextFillColor:el.gradientText?"initial":undefined,color:el.color}}>Click to edit</span>}
      </div>
    );
  }
  if (el.type === "image") {
    const imgFilter = (() => {
      const parts: string[] = [];
      if (el.brightness !== undefined && el.brightness !== 100) parts.push(`brightness(${el.brightness}%)`);
      if (el.contrast   !== undefined && el.contrast   !== 100) parts.push(`contrast(${el.contrast}%)`);
      if (el.saturation !== undefined && el.saturation !== 100) parts.push(`saturate(${el.saturation}%)`);
      if (el.blur       !== undefined && el.blur       !== 0)   parts.push(`blur(${el.blur}px)`);
      if (el.grayscale  !== undefined && el.grayscale  !== 0)   parts.push(`grayscale(${el.grayscale}%)`);
      return parts.length ? parts.join(" ") : undefined;
    })();
    if (!el.src) return (
      <div style={{width:"100%",height:"100%",background:"#e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:el.radius,color:"#9ca3af"}}>
        <ImgIcon style={{width:40,height:40,opacity:0.5}} />
      </div>
    );
    return <img src={el.src} alt="" style={{width:"100%",height:"100%",objectFit:el.fit,borderRadius:el.radius,display:"block",filter:imgFilter}} />;
  }
  if (el.type === "rect") {
    const bStyle = el.strokeStyle==="dashed"?"dashed":el.strokeStyle==="dotted"?"dotted":"solid";
    return (
      <div style={{
        width:"100%", height:"100%",
        background:el.fill==="none"?"transparent":el.fill,
        borderRadius:el.radius,
        border:el.stroke&&el.stroke!=="none"?`${el.strokeW}px ${bStyle} ${el.stroke}`:undefined,
      }} />
    );
  }
  if (el.type === "circle") {
    const bStyle = el.strokeStyle==="dashed"?"dashed":el.strokeStyle==="dotted"?"dotted":"solid";
    return (
      <div style={{
        width:"100%", height:"100%",
        background:el.fill==="none"?"transparent":el.fill,
        borderRadius:"50%",
        border:el.stroke&&el.stroke!=="none"?`${el.strokeW}px ${bStyle} ${el.stroke}`:undefined,
      }} />
    );
  }
  if (el.type === "svg") {
    const dashArr = el.strokeStyle==="dashed"?"8 4":el.strokeStyle==="dotted"?"2 4":undefined;
    return (
      <svg
        viewBox={el.viewBox}
        style={{width:"100%",height:"100%"}}
        fill={el.fill||"none"}
        stroke={el.stroke||"none"}
        strokeWidth={el.strokeW}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dashArr}
        dangerouslySetInnerHTML={{__html:el.svgContent}}
      />
    );
  }
  if (el.type === "video") {
    if (!el.youtubeId) return (
      <div style={{width:"100%",height:"100%",background:"#1a1a1a",borderRadius:el.radius,display:"flex",alignItems:"center",justifyContent:"center",color:"#666"}}>
        <Film style={{width:40,height:40,opacity:0.4}} />
        <span style={{marginLeft:8,fontSize:13,opacity:0.5}}>Add YouTube ID</span>
      </div>
    );
    return (
      <div style={{width:"100%",height:"100%",borderRadius:el.radius,overflow:"hidden",background:"#000"}}>
        <iframe
          src={`https://www.youtube.com/embed/${el.youtubeId}`}
          style={{width:"100%",height:"100%",border:"none"}}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  if (el.type === "button") {
    return (
      <div style={{
        width:"100%", height:"100%", position:"relative",
        display:"flex", alignItems:"center", justifyContent:"center",
        background:el.bgColor==="transparent"?"transparent":el.bgColor,
        borderRadius:el.radius,
        border:el.borderW>0&&el.borderColor!=="none"?`${el.borderW}px solid ${el.borderColor}`:"none",
      }}>
        <span style={{color:el.textColor,fontFamily:fontFamily(el.font),fontSize:el.fontSize,fontWeight:600,letterSpacing:"0.01em"}}>
          {el.text||"Button"}
        </span>
        {el.link && (
          <span style={{
            position:"absolute", top:4, right:6,
            fontSize:9, color: el.textColor, opacity:0.55,
            lineHeight:1, pointerEvents:"none",
          }}>
            {el.link.startsWith("mailto:")?"✉️":el.link.startsWith("tel:")?"📞":"🔗"}
          </span>
        )}
      </div>
    );
  }
  if (el.type === "progress") {
    const pct = Math.min(100, Math.max(0, el.value));
    return (
      <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",gap:8}}>
        <div style={{flex:1,height:"60%",background:el.trackColor,borderRadius:el.radius,overflow:"hidden",position:"relative"}}>
          <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${pct}%`,background:el.fillColor,borderRadius:el.radius,transition:"width 0.2s"}} />
        </div>
        {el.showLabel && (
          <span style={{fontSize:14,fontWeight:700,color:el.labelColor,minWidth:36,textAlign:"right",flexShrink:0}}>
            {pct}%
          </span>
        )}
      </div>
    );
  }
  return null;
}

// â"€â"€ Right panel helpers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const SWATCHES = [
  "#000000","#1e293b","#64748b","#94a3b8","#ffffff","#f1f5f9",
  "#ef4444","#f97316","#fbbf24","#22c55e","#3b82f6","#6366f1","#8b5cf6","#ec4899",
];

const BLEND_MODES = [
  "normal","multiply","screen","overlay","darken","lighten",
  "color-dodge","color-burn","hard-light","soft-light",
  "difference","exclusion","hue","saturation","color","luminosity",
];

// PanelSelect: forces explicit colors so Windows 11 native dropdown is always readable
function PanelSelect({ value, onChange, children, style }: {
  value:string; onChange:(v:string)=>void;
  children:React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <select
      value={value}
      onChange={e=>onChange(e.target.value)}
      style={{color:"#111827", backgroundColor:"#ffffff", ...style}}
      className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-400 focus:outline-none">
      {children}
    </select>
  );
}

function Section({ title, children, defaultOpen=true, hint }: { title:string; children:React.ReactNode; defaultOpen?:boolean; hint?:string }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{borderBottom:"1px solid #f1f5f9"}}>
      {/* Stronger header so sections are scannable instead of all looking alike. */}
      <button onClick={()=>setOpen(v=>!v)} style={{background:"transparent"}}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors">
        <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">{title}</span>
        <ChevronDown style={{width:13,height:13,color:"#9ca3af",transition:"transform 0.15s",transform:open?"":"rotate(-90deg)"}} />
      </button>
      {open && <div className="px-3 pb-3">{hint && <p className="text-[10px] text-gray-400 mb-2 leading-snug">{hint}</p>}{children}</div>}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label:string; value:string; onChange:(v:string)=>void }) {
  const safe = /^#[0-9a-fA-F]{3,6}$/.test(value) ? value : "#000000";
  return (
    <div>
      {label && <label className="block text-[10px] text-gray-600 mb-1">{label}</label>}
      <div className="flex items-center gap-1.5 mb-1.5">
        <input type="color" value={safe} onChange={e=>onChange(e.target.value)}
          className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer flex-shrink-0" style={{padding:2}} />
        <input type="text" value={value} onChange={e=>onChange(e.target.value)}
          className="flex-1 text-[11px] px-2 py-1.5 border border-gray-200 rounded-lg font-mono bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-400 focus:outline-none" />
      </div>
      <div className="flex gap-1 flex-wrap">
        {SWATCHES.map(sw=>(
          <button key={sw} onClick={()=>onChange(sw)} title={sw}
            className={`flex-shrink-0 transition-transform hover:scale-110 ${value===sw?"ring-2 ring-blue-500 ring-offset-1":""}`}
            style={{width:17,height:17,borderRadius:4,background:sw,border:"1px solid rgba(0,0,0,0.12)"}} />
        ))}
      </div>
    </div>
  );
}

function RangeSlider({ label, value, min, max, step=1, unit="", onChange }: {
  label:string; value:number; min:number; max:number; step?:number; unit?:string; onChange:(v:number)=>void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] text-gray-600">{label}</label>
        <span className="text-[10px] font-semibold text-gray-700 tabular-nums">{Math.round(value*10)/10}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e=>onChange(parseFloat(e.target.value))}
        className="w-full accent-blue-600" style={{height:4}} />
    </div>
  );
}

// â"€â"€ Right panel â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function RightPanel({
  el, page, selectedIds, selectedCount, lockAspect,
  onElemChange, onPageChange, onDelete, onDuplicate, onLock, onBringForward, onSendBack,
  onToggleLockAspect, onAlignElems, onDistribute, onSelectLayer, onUploadBg,
}: {
  el: Elem|null; page: Page|null; selectedIds:string[]; selectedCount:number; lockAspect:boolean;
  onElemChange:(patch:Partial<Elem>)=>void; onPageChange:(patch:Partial<Page>)=>void;
  onDelete:()=>void; onDuplicate:()=>void; onLock:()=>void;
  onBringForward:()=>void; onSendBack:()=>void;
  onToggleLockAspect:()=>void;
  onAlignElems:(type:"left"|"centerH"|"right"|"top"|"centerV"|"bottom")=>void;
  onDistribute:(dir:"h"|"v")=>void;
  onSelectLayer:(id:string)=>void;
  onUploadBg:(url:string)=>void;
}) {
  const [layersTab, setLayersTab] = useState(false);

  const panelStyle: React.CSSProperties = {
    width:256, background:"#fff", borderLeft:"1px solid #f1f5f9",
    display:"flex", flexDirection:"column", overflowY:"auto", flexShrink:0,
  };

  const headerStyle: React.CSSProperties = {
    borderBottom:"1px solid #f1f5f9", padding:"8px 12px",
    display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0,
  };

  const typeEmoji = (t:string) => (({text:"T",image:"🖼",rect:"□",circle:"○",svg:"◆",video:"▶",button:"⬜",progress:"▬"} as Record<string,string>)[t]??"•");

  const LayersPanel = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="p-2 space-y-0.5">
        {[...(page?.elems??[])].sort((a,b)=>b.z-a.z).map(elem=>{
          const sel = selectedIds.includes(elem.id);
          const preview = elem.type==="text"?(elem as any).content?.slice(0,22)||"(empty)":
                          elem.type==="button"?(elem as any).text||"Button":
                          `${elem.type} ${Math.round(elem.w)}×${Math.round(elem.h)}`;
          return (
            <button key={elem.id} onClick={()=>onSelectLayer(elem.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${sel?"bg-blue-50 border border-blue-200":"hover:bg-gray-50 border border-transparent"}`}>
              <span className="text-[11px] w-5 text-center flex-shrink-0 select-none font-mono">{typeEmoji(elem.type)}</span>
              <span className={`flex-1 text-[11px] truncate ${sel?"text-blue-700 font-medium":"text-gray-700"}`}>{preview}</span>
              {elem.locked && <Lock className="w-3 h-3 text-amber-400 flex-shrink-0"/>}
              <span className="text-[9px] text-gray-500 flex-shrink-0 font-mono">z{elem.z}</span>
            </button>
          );
        })}
        {!page?.elems.length && <p className="text-[11px] text-gray-500 text-center py-6">No elements on this page</p>}
      </div>
    </div>
  );

  const TabBar = () => (
    <div className="flex border-b border-gray-100 flex-shrink-0">
      {(["props","layers"] as const).map(t=>(
        <button key={t} onClick={()=>setLayersTab(t==="layers")}
          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 ${(t==="layers"?layersTab:!layersTab)?"text-blue-600 border-b-2 border-blue-500":"text-gray-500 hover:text-gray-700"}`}>
          {t==="layers"&&<Layers className="w-3 h-3"/>}{t==="props"?"Properties":"Layers"}
        </button>
      ))}
    </div>
  );

  // â"€â"€ Multi-select â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  if (!el && selectedCount >= 2) {
    return (
      <div style={panelStyle}>
        <TabBar/>
        {layersTab ? <LayersPanel/> : (
          <div className="p-3">
            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2">Align</p>
            <div className="grid grid-cols-3 gap-1 mb-2">
              {([["left","Left"],["centerH","Center H"],["right","Right"],["top","Top"],["centerV","Center V"],["bottom","Bottom"]] as const).map(([t,label])=>(
                <button key={t} onClick={()=>onAlignElems(t as any)} title={label}
                  className="py-1.5 text-[10px] border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 text-gray-600 transition-colors font-medium">
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2 mt-3">Distribute {selectedCount < 3 && <span className="text-gray-500">(3+ needed)</span>}</p>
            <div className="grid grid-cols-2 gap-1 mb-3">
              <button onClick={()=>onDistribute("h")} disabled={selectedCount<3}
                className="py-1.5 text-[10px] border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 text-gray-600 transition-colors font-medium flex items-center justify-center gap-1 disabled:opacity-40">
                <AlignHorizontalDistributeCenter className="w-3 h-3"/> Horiz.
              </button>
              <button onClick={()=>onDistribute("v")} disabled={selectedCount<3}
                className="py-1.5 text-[10px] border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 text-gray-600 transition-colors font-medium flex items-center justify-center gap-1 disabled:opacity-40">
                <AlignVerticalDistributeCenter className="w-3 h-3"/> Vert.
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={onDelete} className="py-1.5 text-xs rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors font-medium">Delete</button>
              <button onClick={onDuplicate} className="py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-medium">Duplicate</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // â"€â"€ Page settings â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  if (!el) {
    return (
      <div style={panelStyle}>
        <TabBar/>
        {layersTab ? <LayersPanel/> : page && (
          <>
            <Section title="Background">
              <div className="space-y-3 pt-1">
                <ColorField label="Color" value={page.bg} onChange={v=>onPageChange({bg:v})} />
                <div>
                  <label className="block text-[10px] text-gray-600 mb-1">Image</label>
                  <MediaUpload value={page.bgImage??""} onChange={url=>onPageChange({bgImage:url||undefined})} accept="image" compact />
                  {page.bgImage && (
                    <button onClick={()=>onPageChange({bgImage:undefined})}
                      className="mt-1 text-[10px] text-red-400 hover:text-red-600">Remove image</button>
                  )}
                </div>
              </div>
            </Section>
            <Section title="Page Settings">
              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="block text-[10px] text-gray-600 mb-1">Label</label>
                  <input type="text" value={page.label} onChange={e=>onPageChange({label:e.target.value})}
                    className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-400 focus:outline-none" />
                </div>
              </div>
            </Section>
          </>
        )}
      </div>
    );
  }

  // ── Element selected ─────────────────────────────────────────────────────────
  return (
    <div style={panelStyle}><TabBar/>{layersTab?<LayersPanel/>:
    <div style={{display:"contents"}}>
      {/* Header */}
      <div style={headerStyle}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest"
            style={{color:"#6366f1"}}>{el.type}</span>
          {el.locked && <span className="text-[9px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-semibold">Locked</span>}
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={onLock} title={el.locked?"Unlock":"Lock"}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
            style={{color:el.locked?"#f59e0b":"#94a3b8"}}>
            {el.locked?<Lock style={{width:13,height:13}}/>:<Unlock style={{width:13,height:13}}/>}
          </button>
          <button onClick={onDuplicate} title="Duplicate"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <Copy style={{width:13,height:13}}/>
          </button>
          <button onClick={onDelete} title="Delete"
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors" style={{color:"#f87171"}}>
            <Trash2 style={{width:13,height:13}}/>
          </button>
        </div>
      </div>

      {/* Position & Size */}
      <Section title="Position & Size">
        <div className="grid grid-cols-2 gap-2 pt-1">
          {([["X","x"],["Y","y"],["W","w"],["H","h"]] as const).map(([lab,k])=>(
            <div key={k}>
              <label className="block text-[10px] text-gray-600 mb-0.5">{lab}</label>
              <input type="number" value={Math.round((el as any)[k])}
                onChange={e=>onElemChange({[k]:parseFloat(e.target.value)||0} as any)}
                className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-400 focus:outline-none" />
            </div>
          ))}
        </div>
        <button onClick={onToggleLockAspect}
          className={`mt-2 flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-lg border transition-colors w-full font-medium ${lockAspect?"bg-blue-50 border-blue-400 text-blue-600":"border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
          <Link2 style={{width:11,height:11,flexShrink:0}}/>
          {lockAspect?"Aspect locked":"Lock aspect ratio"}
        </button>
      </Section>

      {/* Transform */}
      <Section title="Transform">
        <div className="space-y-3 pt-1">
          <RangeSlider label="Rotation" value={el.rot} min={0} max={360} unit="°" onChange={v=>onElemChange({rot:v})} />
          <RangeSlider label="Opacity" value={Math.round(el.opacity*100)} min={0} max={100} unit="%" onChange={v=>onElemChange({opacity:v/100})} />
          <div>
            <p className="text-[10px] text-gray-600 mb-1.5">Flip</p>
            <div className="flex gap-1.5">
              <button onClick={()=>onElemChange({flipX:!el.flipX} as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs border rounded-lg transition-colors font-medium ${el.flipX?"bg-blue-600 text-white border-blue-600":"border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                <FlipHorizontal2 style={{width:12,height:12}}/> H
              </button>
              <button onClick={()=>onElemChange({flipY:!el.flipY} as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs border rounded-lg transition-colors font-medium ${el.flipY?"bg-blue-600 text-white border-blue-600":"border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                <FlipVertical2 style={{width:12,height:12}}/> V
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Appearance">
        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-[10px] text-gray-600 mb-1">Blend Mode</label>
            <PanelSelect value={el.blendMode||"normal"} onChange={v=>onElemChange({blendMode:v} as any)}>
              {BLEND_MODES.map(m=>(
                <option key={m} value={m} style={{color:"#111827",backgroundColor:"#ffffff"}}>
                  {m.charAt(0).toUpperCase()+m.slice(1).replace(/-/g," ")}
                </option>
              ))}
            </PanelSelect>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] text-gray-600">Shadow</label>
              <button onClick={()=>onElemChange({shadow:el.shadow?null:{x:4,y:4,blur:12,color:"rgba(0,0,0,0.3)"}} as any)}
                className={`text-[10px] px-2.5 py-0.5 rounded-md border font-medium transition-colors ${el.shadow?"bg-blue-600 text-white border-blue-600":"border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                {el.shadow?"On":"Off"}
              </button>
            </div>
            {el.shadow && (
              <div className="space-y-2 bg-gray-50 rounded-xl p-2.5">
                <div className="grid grid-cols-3 gap-1.5">
                  {([["X","x"],["Y","y"],["Blur","blur"]] as const).map(([lab,k])=>(
                    <div key={k}>
                      <label className="block text-[9px] text-gray-600 mb-0.5">{lab}</label>
                      <input type="number" value={(el.shadow as any)[k]}
                        onChange={ev=>onElemChange({shadow:{...el.shadow!,[k]:parseFloat(ev.target.value)||0}} as any)}
                        className="w-full text-xs px-1.5 py-1 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="color" value={toHexColor(el.shadow.color)}
                    onChange={e=>onElemChange({shadow:{...el.shadow!,color:e.target.value}} as any)}
                    className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer flex-shrink-0" style={{padding:2}} />
                  <input type="text" value={el.shadow.color}
                    onChange={e=>onElemChange({shadow:{...el.shadow!,color:e.target.value}} as any)}
                    className="flex-1 text-[11px] px-2 py-1.5 border border-gray-200 rounded-lg font-mono bg-white focus:outline-none" />
                </div>
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Layer */}
      <Section title="Layer" defaultOpen={false}>
        <div className="flex gap-1.5 pt-1">
          <button onClick={onBringForward}
            className="flex-1 text-xs py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700">↑ Forward</button>
          <button onClick={onSendBack}
            className="flex-1 text-xs py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700">↓ Back</button>
        </div>
      </Section>

      {/* Animation */}
      <Section title="Animation" defaultOpen={false}>
        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-[10px] text-gray-600 mb-1.5">Type</label>
            <div className="grid grid-cols-4 gap-1">
              {ANIM_TYPES.map(a=>(
                <button key={a.id}
                  onClick={()=>onElemChange({anim:{...(el.anim??DEFAULT_ANIM),type:a.id}} as any)}
                  title={a.label}
                  className={`flex flex-col items-center gap-0.5 py-1.5 text-[9px] border rounded-lg transition-colors ${
                    (el.anim?.type??"none")===a.id?"bg-blue-600 text-white border-blue-600":"border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}>
                  <span className="text-sm leading-none">{a.icon}</span>
                  <span className="leading-tight">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
          {el.anim?.type && el.anim.type!=="none" && (
            <>
              <RangeSlider label="Duration" value={el.anim.duration??0.6} min={0.1} max={5} step={0.1} unit="s"
                onChange={v=>onElemChange({anim:{...el.anim!,duration:v}} as any)} />
              <RangeSlider label="Delay" value={el.anim.delay??0} min={0} max={5} step={0.1} unit="s"
                onChange={v=>onElemChange({anim:{...el.anim!,delay:v}} as any)} />
              <div>
                <label className="block text-[10px] text-gray-600 mb-1">Easing</label>
                <PanelSelect value={el.anim.easing??"ease"} onChange={v=>onElemChange({anim:{...el.anim!,easing:v as any}} as any)}>
                  {(["ease","ease-in","ease-out","ease-in-out","linear"] as const).map(v=>(
                    <option key={v} value={v} style={{color:"#111827"}}>{v}</option>
                  ))}
                </PanelSelect>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-gray-600">Repeat</label>
                <div className="flex gap-1">
                  {(["once","loop"] as const).map(r=>(
                    <button key={r} onClick={()=>onElemChange({anim:{...el.anim!,repeat:r}} as any)}
                      className={`px-2.5 py-1 text-[10px] border rounded-lg transition-colors font-medium ${
                        (el.anim?.repeat??"once")===r?"bg-blue-600 text-white border-blue-600":"border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}>
                      {r==="once"?"Once":"Loop"}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-gray-600 bg-blue-50 rounded-lg px-2 py-1.5 leading-relaxed">
                Animation plays on the public page. Add delay to stagger multiple elements.
              </p>
            </>
          )}
        </div>
      </Section>

      {/* Link */}
      <Section title="Link" defaultOpen={el.type==="button"}>
        <div className="space-y-2.5 pt-1">
          {(()=>{
            const raw = el.link??"";
            const linkType: "url"|"email"|"phone" =
              raw.startsWith("mailto:") ? "email" :
              raw.startsWith("tel:")    ? "phone" : "url";
            const displayVal =
              linkType==="email" ? raw.slice(7) :
              linkType==="phone" ? raw.slice(4) : raw;
            const applyLink = (type: "url"|"email"|"phone", val: string) => {
              if (!val.trim()) { onElemChange({link:undefined} as any); return; }
              const prefixed = type==="email" ? `mailto:${val}` : type==="phone" ? `tel:${val.replace(/\s/g,"")}` : val;
              onElemChange({link:prefixed} as any);
            };
            return (
              <>
                <div className="flex gap-1">
                  {(["url","email","phone"] as const).map(t=>(
                    <button key={t} onClick={()=>applyLink(t, displayVal)}
                      className={`flex-1 py-1.5 text-[10px] border rounded-lg transition-colors font-medium ${linkType===t?"bg-gray-900 text-white border-gray-900":"border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                      {t==="url"?"🔗 URL":t==="email"?"✉️ Email":"📞 Phone"}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={displayVal}
                  placeholder={linkType==="url"?"https://example.com":linkType==="email"?"you@example.com":"+1 555 000 0000"}
                  onChange={e=>applyLink(linkType, e.target.value)}
                  className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-400 focus:outline-none"
                />
                {el.link && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-600 font-mono truncate">{el.link}</span>
                    <button onClick={()=>onElemChange({link:undefined} as any)}
                      className="text-[10px] text-red-400 hover:text-red-600 transition-colors ml-2 flex-shrink-0">Remove</button>
                  </div>
                )}
                <p className="text-[10px] text-gray-600 leading-relaxed">
                  {linkType==="email"?"Opens email composer on click.":linkType==="phone"?"Opens phone dialer on click.":"Opens URL in a new tab on click."}
                </p>
              </>
            );
          })()}
        </div>
      </Section>

      {/* Text */}
      {el.type==="text" && (
        <Section title="Text">
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-[10px] text-gray-600 mb-1">Font</label>
              <PanelSelect value={el.font} onChange={v=>onElemChange({font:v} as any)} style={{fontFamily:el.font}}>
                {FONTS.map(f=><option key={f} value={f} style={{fontFamily:f,color:"#111827",backgroundColor:"#ffffff"}}>{f}</option>)}
              </PanelSelect>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-600 mb-1">Size</label>
                <input type="number" value={el.size} min={8} max={400}
                  onChange={e=>onElemChange({size:parseInt(e.target.value)||16} as any)}
                  className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-600 mb-1">Line H</label>
                <input type="number" value={el.lh} min={0.5} max={5} step={0.1}
                  onChange={e=>onElemChange({lh:parseFloat(e.target.value)||1.3} as any)}
                  className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-400 focus:outline-none" />
              </div>
            </div>

            <ColorField label="Color" value={el.color} onChange={v=>onElemChange({color:v} as any)} />

            {/* Font Weight */}
            <div>
              <label className="block text-[10px] text-gray-600 mb-1">Weight</label>
              <div className="grid grid-cols-6 gap-1">
                {[300,400,500,600,700,800].map(w=>(
                  <button key={w} onClick={()=>onElemChange({fontWeight:w,bold:w>=700} as any)}
                    className={`py-1 text-[9px] border rounded-lg transition-colors ${(el.fontWeight??(el.bold?700:400))===w?"bg-gray-900 text-white border-gray-900":"border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    style={{fontWeight:w}}>
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Style buttons */}
            <div className="flex gap-1">
              <button onClick={()=>onElemChange({italic:!el.italic} as any)}
                className={`flex-1 py-1.5 text-xs border rounded-lg italic transition-colors font-medium ${el.italic?"bg-gray-900 text-white border-gray-900":"border-gray-200 text-gray-700 hover:bg-gray-50"}`}>I</button>
              <button onClick={()=>onElemChange({underline:!el.underline} as any)}
                className={`flex-1 py-1.5 text-xs border rounded-lg underline transition-colors font-medium ${el.underline?"bg-gray-900 text-white border-gray-900":"border-gray-200 text-gray-700 hover:bg-gray-50"}`}>U</button>
              {(["left","center","right"] as const).map(a=>(
                <button key={a} onClick={()=>onElemChange({align:a} as any)}
                  className={`flex-1 py-1.5 text-xs border rounded-lg transition-colors ${el.align===a?"bg-gray-900 text-white border-gray-900":"border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
                  {a==="left"?<AlignLeft style={{width:11,height:11,margin:"0 auto"}}/>:a==="center"?<AlignCenter style={{width:11,height:11,margin:"0 auto"}}/>:<AlignRight style={{width:11,height:11,margin:"0 auto"}}/>}
                </button>
              ))}
            </div>

            {/* Text Transform */}
            <div>
              <label className="block text-[10px] text-gray-600 mb-1">Transform</label>
              <div className="flex gap-1">
                {([
                  ["none","-","None"],
                  ["uppercase","AA","Uppercase"],
                  ["lowercase","aa","Lowercase"],
                  ["capitalize","Aa","Capitalize"],
                ] as const).map(([v,icon,title])=>(
                  <button key={v} onClick={()=>onElemChange({textTransform:v} as any)} title={title}
                    className={`flex-1 py-1.5 text-[10px] border rounded-lg transition-colors font-mono ${(el.textTransform??"none")===v?"bg-gray-900 text-white border-gray-900":"border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <RangeSlider label="Letter Spacing" value={el.ls} min={-10} max={50} step={0.5} unit="px" onChange={v=>onElemChange({ls:v} as any)} />
          </div>
        </Section>
      )}

      {/* Text Effects */}
      {el.type==="text" && (
        <Section title="Text Effects" defaultOpen={false}>
          <div className="space-y-3 pt-1">
            {/* Gradient Text */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] text-gray-600">Gradient Text</label>
                <button onClick={()=>onElemChange({gradientText:el.gradientText?undefined:GRAD_TEXT_PRESETS[0].val} as any)}
                  className={`text-[10px] px-2.5 py-0.5 rounded-md border font-medium transition-colors ${el.gradientText?"bg-blue-600 text-white border-blue-600":"border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                  {el.gradientText?"On":"Off"}
                </button>
              </div>
              {el.gradientText && (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-3 gap-1">
                    {GRAD_TEXT_PRESETS.map(g=>(
                      <button key={g.name} onClick={()=>onElemChange({gradientText:g.val} as any)}
                        className={`py-1 text-[9px] rounded-lg border transition-all font-medium overflow-hidden ${el.gradientText===g.val?"border-blue-500 ring-1 ring-blue-400":"border-gray-200 hover:border-gray-300"}`}
                        style={{background:g.val,WebkitBackgroundClip:"text",backgroundClip:"text",WebkitTextFillColor:"transparent",color:"transparent"}}>
                        {g.name}
                      </button>
                    ))}
                  </div>
                  <input type="text" value={el.gradientText}
                    onChange={e=>onElemChange({gradientText:e.target.value} as any)}
                    className="w-full text-[10px] px-2 py-1.5 border border-gray-200 rounded-lg font-mono bg-gray-50 text-gray-900 focus:outline-none" />
                </div>
              )}
            </div>
            {/* Text Shadow */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-gray-600">Text Shadow</label>
                <button onClick={()=>onElemChange({textShadow:el.textShadow?null:{x:2,y:2,blur:6,color:"rgba(0,0,0,0.4)"}} as any)}
                  className={`text-[10px] px-2.5 py-0.5 rounded-md border font-medium transition-colors ${el.textShadow?"bg-blue-600 text-white border-blue-600":"border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                  {el.textShadow?"On":"Off"}
                </button>
              </div>
              {el.textShadow && (
                <div className="space-y-2 bg-gray-50 rounded-xl p-2.5">
                  <div className="grid grid-cols-3 gap-1.5">
                    {([["X","x"],["Y","y"],["Blur","blur"]] as const).map(([lab,k])=>(
                      <div key={k}>
                        <label className="block text-[9px] text-gray-600 mb-0.5">{lab}</label>
                        <input type="number" value={(el.textShadow as any)[k]}
                          onChange={ev=>onElemChange({textShadow:{...el.textShadow!,[k]:parseFloat(ev.target.value)||0}} as any)}
                          className="w-full text-xs px-1.5 py-1 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none" />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="color" value={toHexColor(el.textShadow.color)}
                      onChange={e=>onElemChange({textShadow:{...el.textShadow!,color:e.target.value}} as any)}
                      className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer flex-shrink-0" style={{padding:2}} />
                    <input type="text" value={el.textShadow.color}
                      onChange={e=>onElemChange({textShadow:{...el.textShadow!,color:e.target.value}} as any)}
                      className="flex-1 text-[11px] px-2 py-1.5 border border-gray-200 rounded-lg font-mono bg-white focus:outline-none" />
                  </div>
                </div>
              )}
            </div>
            {/* Highlight */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-gray-600">Highlight</label>
                {el.highlight && (
                  <button onClick={()=>onElemChange({highlight:undefined} as any)}
                    className="text-[10px] text-red-400 hover:text-red-600">Clear</button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value={el.highlight||"#ffff00"}
                  onChange={e=>onElemChange({highlight:e.target.value} as any)}
                  className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer flex-shrink-0" style={{padding:2}} />
                <span className="text-[10px] font-mono text-gray-500">{el.highlight||"None"}</span>
              </div>
            </div>
            {/* Outline */}
            <div>
              <label className="block text-[10px] text-gray-600 mb-1">Text Outline</label>
              <div className="flex items-center gap-1.5">
                <input type="color" value={el.textStroke||"#000000"}
                  onChange={e=>onElemChange({textStroke:e.target.value,textStrokeW:el.textStrokeW||1} as any)}
                  className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer flex-shrink-0" style={{padding:2}} />
                <input type="number" value={el.textStrokeW||0} min={0} max={10} step={0.5} placeholder="0"
                  onChange={e=>onElemChange({textStrokeW:parseFloat(e.target.value)||0} as any)}
                  className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:outline-none" />
                <span className="text-[10px] text-gray-600 flex-shrink-0">px</span>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Image */}
      {el.type==="image" && (
        <Section title="Image">
          <div className="space-y-3 pt-1">
            <MediaUpload value={el.src} onChange={url=>onElemChange({src:url} as any)} accept="image" compact />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-600 mb-1">Fit</label>
                <PanelSelect value={el.fit} onChange={v=>onElemChange({fit:v as any} as any)}>
                  <option value="cover" style={{color:"#111827"}}>Cover</option>
                  <option value="contain" style={{color:"#111827"}}>Contain</option>
                  <option value="fill" style={{color:"#111827"}}>Fill</option>
                </PanelSelect>
              </div>
              <div>
                <label className="block text-[10px] text-gray-600 mb-1">Radius</label>
                <input type="number" value={el.radius} min={0} max={600}
                  onChange={e=>onElemChange({radius:parseInt(e.target.value)||0} as any)}
                  className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:outline-none" />
              </div>
            </div>
          </div>
        </Section>
      )}

      {el.type==="image" && (
        <Section title="Filters" defaultOpen={false}>
          <div className="space-y-2.5 pt-1">
            {([
              ["Brightness","brightness",0,200,100],
              ["Contrast","contrast",0,200,100],
              ["Saturation","saturation",0,200,100],
              ["Grayscale","grayscale",0,100,0],
              ["Blur","blur",0,20,0],
            ] as const).map(([label,k,min,max,def])=>(
              <RangeSlider key={k} label={label} value={(el as any)[k]??def} min={min} max={max}
                onChange={v=>onElemChange({[k]:Math.round(v)} as any)} />
            ))}
            <button onClick={()=>onElemChange({brightness:100,contrast:100,saturation:100,grayscale:0,blur:0} as any)}
              className="text-[10px] text-gray-600 hover:text-blue-600 transition-colors">Reset filters</button>
          </div>
        </Section>
      )}

      {/* Rect / Circle */}
      {(el.type==="rect"||el.type==="circle") && (
        <Section title="Shape">
          <div className="space-y-3 pt-1">
            {/* Fill: gradient preview or color picker */}
            {el.fill && (el.fill.includes("gradient") || el.fill.includes("gradient")) ? (
              <div>
                <label className="block text-[10px] text-gray-600 mb-1">Fill</label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg border border-gray-200 flex-shrink-0" style={{background:el.fill}} />
                  <div className="flex-1 text-[10px] text-gray-500 truncate font-mono">{el.fill.slice(0,28)}…</div>
                  <button onClick={()=>onElemChange({fill:"#e2e8f0"} as any)}
                    className="px-2 py-1 text-[10px] border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 flex-shrink-0">
                    Replace
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-gray-600">Fill</label>
                  <button onClick={()=>onElemChange({fill:el.fill==="none"||el.fill==="transparent"?"#e2e8f0":"none"} as any)}
                    className={`px-2 py-0.5 text-[10px] border rounded-lg transition-colors ${el.fill==="none"||el.fill==="transparent"?"bg-gray-900 text-white border-gray-900":"border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                    {el.fill==="none"||el.fill==="transparent"?"No fill":"Has fill"}
                  </button>
                </div>
                {el.fill!=="none"&&el.fill!=="transparent" && (
                  <ColorField label="" value={el.fill} onChange={v=>onElemChange({fill:v} as any)} />
                )}
              </div>
            )}
            <div>
              <ColorField label="Stroke" value={el.stroke==="none"?"#64748b":el.stroke} onChange={v=>onElemChange({stroke:v} as any)} />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-600 mb-1">Width</label>
                  <input type="number" value={el.strokeW} min={0} max={20}
                    onChange={e=>onElemChange({strokeW:parseInt(e.target.value)||0} as any)}
                    className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-600 mb-1">Style</label>
                  <div className="flex gap-1">
                    {(["solid","dashed","dotted"] as const).map(s=>(
                      <button key={s} onClick={()=>onElemChange({strokeStyle:s} as any)} title={s}
                        className={`flex-1 py-1 text-[10px] border rounded-lg transition-colors font-mono ${(el.strokeStyle??"solid")===s?"bg-gray-900 text-white border-gray-900":"border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                        {s==="solid"?"-":s==="dashed"?"--":".."}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {el.type==="rect" && (
              <RangeSlider label="Corner Radius" value={el.radius} min={0} max={600} onChange={v=>onElemChange({radius:Math.round(v)} as any)} />
            )}
          </div>
        </Section>
      )}

      {/* SVG */}
      {el.type==="svg" && (
        <Section title="SVG Shape">
          <div className="space-y-3 pt-1">
            {el.fill && el.fill.includes("gradient") ? (
              <div>
                <label className="block text-[10px] text-gray-600 mb-1">Fill</label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg border border-gray-200 flex-shrink-0" style={{background:el.fill}} />
                  <div className="flex-1 text-[10px] text-gray-500 truncate font-mono">{el.fill.slice(0,28)}…</div>
                  <button onClick={()=>onElemChange({fill:"#6366f1"} as any)}
                    className="px-2 py-1 text-[10px] border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 flex-shrink-0">
                    Replace
                  </button>
                </div>
              </div>
            ) : (
              <ColorField label="Fill" value={el.fill==="none"||el.fill==="transparent"?"#6366f1":el.fill} onChange={v=>onElemChange({fill:v} as any)} />
            )}
            <div>
              <ColorField label="Stroke" value={el.stroke==="none"?"#64748b":el.stroke} onChange={v=>onElemChange({stroke:v} as any)} />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-600 mb-1">Width</label>
                  <input type="number" value={el.strokeW} min={0} max={20}
                    onChange={e=>onElemChange({strokeW:parseInt(e.target.value)||0} as any)}
                    className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-600 mb-1">Style</label>
                  <div className="flex gap-1">
                    {(["solid","dashed","dotted"] as const).map(s=>(
                      <button key={s} onClick={()=>onElemChange({strokeStyle:s} as any)} title={s}
                        className={`flex-1 py-1 text-[10px] border rounded-lg transition-colors font-mono ${(el.strokeStyle??"solid")===s?"bg-gray-900 text-white border-gray-900":"border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                        {s==="solid"?"-":s==="dashed"?"--":".."}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Video */}
      {el.type==="video" && (
        <Section title="Video">
          <div className="space-y-2.5 pt-1">
            <div>
              <label className="block text-[10px] text-gray-600 mb-1">YouTube ID</label>
              <input type="text" value={el.youtubeId} placeholder="dQw4w9WgXcQ"
                onChange={e=>onElemChange({youtubeId:e.target.value} as any)}
                className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-400 focus:outline-none" />
            </div>
            <RangeSlider label="Corner Radius" value={el.radius} min={0} max={200} onChange={v=>onElemChange({radius:Math.round(v)} as any)} />
          </div>
        </Section>
      )}

      {/* Button */}
      {el.type==="button" && (
        <Section title="Button">
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-[10px] text-gray-600 mb-1">Text</label>
              <input type="text" value={el.text} onChange={e=>onElemChange({text:e.target.value} as any)}
                className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-600 mb-1">Font</label>
              <PanelSelect value={el.font} onChange={v=>onElemChange({font:v} as any)} style={{fontFamily:el.font}}>
                {FONTS.map(f=><option key={f} value={f} style={{fontFamily:f,color:"#111827",backgroundColor:"#ffffff"}}>{f}</option>)}
              </PanelSelect>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-600 mb-1">Font Size</label>
                <input type="number" value={el.fontSize} min={8} max={80}
                  onChange={e=>onElemChange({fontSize:parseInt(e.target.value)||16} as any)}
                  className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-600 mb-1">Radius</label>
                <input type="number" value={el.radius} min={0} max={200}
                  onChange={e=>onElemChange({radius:parseInt(e.target.value)||8} as any)}
                  className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:outline-none" />
              </div>
            </div>
            <ColorField label="Text Color" value={el.textColor} onChange={v=>onElemChange({textColor:v} as any)} />
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-gray-600">Background</label>
                <button onClick={()=>onElemChange({bgColor:el.bgColor==="transparent"?"#3b82f6":"transparent"} as any)}
                  className={`px-2 py-0.5 text-[10px] border rounded-lg transition-colors ${el.bgColor==="transparent"?"bg-gray-900 text-white border-gray-900":"border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                  {el.bgColor==="transparent"?"None":"Color"}
                </button>
              </div>
              {el.bgColor!=="transparent" && (
                <ColorField label="" value={el.bgColor} onChange={v=>onElemChange({bgColor:v} as any)} />
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-gray-600">Border</label>
                <button onClick={()=>onElemChange({borderColor:el.borderColor==="none"?"#64748b":"none"} as any)}
                  className={`px-2 py-0.5 text-[10px] border rounded-lg transition-colors ${el.borderColor==="none"?"bg-gray-900 text-white border-gray-900":"border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                  {el.borderColor==="none"?"Off":"On"}
                </button>
              </div>
              {el.borderColor!=="none" && (
                <>
                  <ColorField label="" value={el.borderColor} onChange={v=>onElemChange({borderColor:v} as any)} />
                  <div className="mt-2">
                    <RangeSlider label="Border Width" value={el.borderW} min={0} max={20} onChange={v=>onElemChange({borderW:Math.round(v)} as any)} />
                  </div>
                </>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* Progress */}
      {el.type==="progress" && (
        <Section title="Progress Bar">
          <div className="space-y-3 pt-1">
            <RangeSlider label="Value" value={el.value} min={0} max={100} unit="%" onChange={v=>onElemChange({value:Math.round(v)} as any)} />
            <RangeSlider label="Corner Radius" value={el.radius} min={0} max={100} onChange={v=>onElemChange({radius:Math.round(v)} as any)} />
            <ColorField label="Fill Color" value={el.fillColor} onChange={v=>onElemChange({fillColor:v} as any)} />
            <ColorField label="Track Color" value={el.trackColor} onChange={v=>onElemChange({trackColor:v} as any)} />
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-gray-600">Show Label</label>
              <button onClick={()=>onElemChange({showLabel:!el.showLabel} as any)}
                className={`px-3 py-1 text-[10px] border rounded-lg transition-colors font-medium ${el.showLabel?"bg-blue-600 text-white border-blue-600":"border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                {el.showLabel?"On":"Off"}
              </button>
            </div>
            {el.showLabel && (
              <ColorField label="Label Color" value={el.labelColor} onChange={v=>onElemChange({labelColor:v} as any)} />
            )}
          </div>
        </Section>
      )}
    </div>
    }
  </div>
  );
}

// ── Template thumbnail ──────────────────────────────────────────────────────────

function TemplateThumbnail({ doc, w = 88, h = 56 }: { doc: CanvasDoc; w?: number; h?: number }) {
  const page = doc.pages[0];
  if (!page) return <div style={{ width: w, height: h, background: "#f3f4f6", borderRadius: 4 }} />;
  const scale = w / CW;
  return (
    <div style={{ width: w, height: h, overflow: "hidden", borderRadius: 4, position: "relative", flexShrink: 0, background: page.bg }}>
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: CW, height: page.h,
        background: page.bg,
        backgroundImage: page.bgImage ? `url(${page.bgImage})` : undefined,
        backgroundSize: "cover", backgroundPosition: "center",
        transform: `scale(${scale})`, transformOrigin: "top left",
        pointerEvents: "none",
      }}>
        {[...page.elems].sort((a, b) => a.z - b.z).map(el => (
          <div key={el.id} style={{
            position: "absolute",
            left: el.x, top: el.y, width: el.w, height: el.h,
            transform: `rotate(${el.rot}deg)`,
            transformOrigin: "center center",
            opacity: el.opacity, zIndex: el.z,
          }}>
            <ElemContent el={el} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Left panel ────────────────────────────────────────────────────────────────

type CategoryId = "templates"|"text"|"shapes"|"icons"|"lines"|"gradients"|"photos"|"stickers"|"buttons"|"videos"|"charts"|"uploads";

const CATEGORIES: {id:CategoryId; label:string; icon:React.ReactNode}[] = [
  {id:"templates", label:"Templates", icon:<LayoutTemplate className="w-4 h-4"/>},
  {id:"text",      label:"Text",      icon:<Type className="w-4 h-4"/>},
  {id:"shapes",    label:"Shapes",    icon:<Square className="w-4 h-4"/>},
  {id:"icons",     label:"Icons",     icon:<Star className="w-4 h-4"/>},
  {id:"lines",     label:"Lines",     icon:<Minus className="w-4 h-4"/>},
  {id:"gradients", label:"Gradients", icon:<Palette className="w-4 h-4"/>},
  {id:"photos",    label:"Photos",    icon:<ImgIcon className="w-4 h-4"/>},
  {id:"stickers",  label:"Stickers",  icon:<Smile className="w-4 h-4"/>},
  {id:"buttons",   label:"Buttons",   icon:<Play className="w-4 h-4"/>},
  {id:"videos",    label:"Videos",    icon:<Film className="w-4 h-4"/>},
  {id:"charts",    label:"Progress",  icon:<BarChart2 className="w-4 h-4"/>},
  {id:"uploads",   label:"Uploads",   icon:<Upload className="w-4 h-4"/>},
];

function LeftPanel({
  onAddElem, onApplyTemplate, onUpload, communityRefreshKey, currentUsername,
}: {
  onAddElem: (el: Elem) => void;
  onApplyTemplate: (doc: CanvasDoc) => void;
  onUpload: (src: string) => void;
  communityRefreshKey: number;
  currentUsername: string | null | undefined;
}) {
  const [cat, setCat] = useState<CategoryId>("templates");
  const [uploading, setUploading] = useState(false);
  const [ytId, setYtId] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Pre-compute built-in template docs once
  const builtinDocs = useMemo(() => TEMPLATES.map(t => ({ name:t.name, emoji:t.emoji, doc:t.make() })), []);

  // Community templates
  type CommunityT = { id:string; name:string; description:string|null; category:string|null; useCount:number; previewDoc:CanvasDoc|null; author:{username:string|null;name:string|null;image:string|null;verified:boolean}; createdAt:string; };
  const [communityTemplates, setCommunityTemplates] = useState<CommunityT[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityLoaded, setCommunityLoaded] = useState(false);

  useEffect(() => {
    setCommunityLoaded(false);
  }, [communityRefreshKey]);

  useEffect(() => {
    if (cat === "templates" && !communityLoaded) {
      setCommunityLoading(true);
      fetch("/api/canvas-templates?limit=20")
        .then(r=>r.json())
        .then(d=>{ setCommunityTemplates(d.templates??[]); setCommunityLoaded(true); })
        .catch(()=>{})
        .finally(()=>setCommunityLoading(false));
    }
  }, [cat, communityLoaded]);

  const applyFromCommunity = async (id: string) => {
    const r = await fetch(`/api/canvas-templates/${id}`);
    if (!r.ok) return;
    const t = await r.json();
    if (t.canvasData?.version === 1) onApplyTemplate(t.canvasData as CanvasDoc);
  };

  const deleteTemplate = async (id: string) => {
    const r = await fetch(`/api/canvas-templates/${id}`, { method: "DELETE" });
    if (r.ok) setCommunityTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", {method:"POST",body:fd});
      const data = await res.json();
      if (data.url) {
        const el = makeImage(data.url, (CW-400)/2, 200);
        onAddElem(el);
        onUpload(data.url);
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const catLabel = CATEGORIES.find(c=>c.id===cat)?.label ?? "";

  return (
    <div className="flex h-full flex-shrink-0" style={{width:252}}>
      {/* Dark icon strip */}
      <div className="flex flex-col items-center py-2 gap-0.5 overflow-y-auto flex-shrink-0"
        style={{width:48,background:"#111827",borderRight:"1px solid rgba(255,255,255,0.05)"}}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={()=>setCat(c.id)} title={c.label}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
              cat===c.id
                ? "text-white shadow-lg"
                : "text-gray-500 hover:text-gray-200 hover:bg-white/10"
            }`}
            style={cat===c.id ? {background:"linear-gradient(135deg,#3b82f6,#6366f1)",boxShadow:"0 4px 12px rgba(99,102,241,0.4)"} : {}}>
            {c.icon}
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div className="flex flex-col overflow-hidden" style={{flex:1,background:"#fafafa",borderRight:"1px solid #e5e7eb"}}>
        {/* Panel header */}
        <div className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0"
          style={{borderBottom:"1px solid #e5e7eb",background:"#fff"}}>
          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">{catLabel}</span>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">

          {cat==="templates" && (
            <>
              {/* Built-in templates – 2-column grid with live preview */}
              <div className="grid grid-cols-2 gap-1.5">
                {builtinDocs.map(t => (
                  <button key={t.name} onClick={()=>onApplyTemplate(t.doc)}
                    className="flex flex-col rounded-xl overflow-hidden bg-white border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all text-left group">
                    <div className="w-full overflow-hidden" style={{background:t.doc.pages[0]?.bg??"#f3f4f6"}}>
                      <TemplateThumbnail doc={t.doc} w={88} h={56}/>
                    </div>
                    <div className="px-2 py-1.5">
                      <p className="text-[11px] font-semibold text-gray-700 group-hover:text-blue-600 leading-tight">{t.name}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Community templates */}
              <div className="mt-2">
                <div className="flex items-center gap-1.5 px-0.5 py-1">
                  <Users className="w-3 h-3 text-purple-500"/>
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Community</span>
                </div>
                {communityLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400"/>
                  </div>
                )}
                {!communityLoading && communityTemplates.length === 0 && (
                  <p className="text-[11px] text-gray-500 text-center py-3 px-2">No community templates yet.<br/>Be the first to share one!</p>
                )}
                {!communityLoading && communityTemplates.length > 0 && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {communityTemplates.map(t=>(
                      <div key={t.id} className="relative group/card">
                        <button onClick={()=>applyFromCommunity(t.id)}
                          className="w-full flex flex-col rounded-xl overflow-hidden bg-white border border-gray-200 hover:border-purple-400 hover:shadow-md transition-all text-left group">
                          <div className="w-full overflow-hidden" style={{background:(t.previewDoc as any)?.pages?.[0]?.bg??"#f3f4f6"}}>
                            {t.previewDoc?.version===1
                              ? <TemplateThumbnail doc={t.previewDoc} w={88} h={56}/>
                              : <div style={{width:88,height:56,background:"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center"}}>
                                  <LayoutTemplate style={{width:20,height:20,color:"#d1d5db"}}/>
                                </div>
                            }
                          </div>
                          <div className="px-2 py-1.5">
                            <p className="text-[11px] font-semibold text-gray-700 group-hover:text-purple-600 leading-tight truncate">{t.name}</p>
                            <p className="text-[9px] text-gray-600 truncate">@{t.author.username ?? t.author.name}</p>
                          </div>
                        </button>
                        {currentUsername && t.author.username === currentUsername && (
                          <button
                            onClick={e=>{ e.stopPropagation(); deleteTemplate(t.id); }}
                            title="Delete template"
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-600 z-10">
                            <X className="w-3 h-3"/>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {cat==="text" && (
            <>
              {TEXT_PRESETS.map(p=>(
                <button key={p.label}
                  onClick={()=>onAddElem({...makeText(p.label,p.size,(CW-400)/2,200),bold:p.bold,font:p.font} as TextElem)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-left transition-all shadow-sm">
                  <div style={{fontFamily:p.font,fontSize:Math.min(p.size,24),fontWeight:p.bold?700:400,color:"#1e293b",lineHeight:1.2}}>
                    {p.label}
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1">{p.size}px . {p.font}</p>
                </button>
              ))}
              <button
                onClick={()=>onAddElem(makeText("Your text here",20,(CW-400)/2,200))}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 text-xs text-gray-600 hover:text-blue-600 text-center transition-all">
                + Add custom text
              </button>
            </>
          )}

          {cat==="shapes" && (
            <div className="grid grid-cols-3 gap-1.5">
              {SHAPES.map(s=>(
                <button key={s.name} onClick={()=>onAddElem(makeSvg(s))}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-all shadow-sm group">
                  <svg viewBox={s.viewBox} className="w-9 h-9"
                    fill={s.defaultFill==="none"?"none":s.defaultFill}
                    stroke={s.defaultStroke==="none"?"none":s.defaultStroke}
                    strokeWidth={s.defaultStrokeW} strokeLinecap="round" strokeLinejoin="round"
                    dangerouslySetInnerHTML={{__html:s.svgContent}} />
                  <span className="text-[9px] text-gray-500 group-hover:text-blue-600 text-center leading-tight font-medium">{s.name}</span>
                </button>
              ))}
            </div>
          )}

          {cat==="icons" && (
            <div className="grid grid-cols-3 gap-1.5">
              {ICONS.map(ic=>(
                <button key={ic.name} onClick={()=>onAddElem(makeSvg({...ic,w:120,h:120}))}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-all shadow-sm group">
                  <svg viewBox={ic.viewBox} className="w-7 h-7"
                    fill={ic.defaultFill} stroke={ic.defaultStroke}
                    strokeWidth={ic.defaultStrokeW} strokeLinecap="round" strokeLinejoin="round"
                    dangerouslySetInnerHTML={{__html:ic.svgContent}} />
                  <span className="text-[9px] text-gray-500 group-hover:text-blue-600 text-center leading-tight font-medium">{ic.name}</span>
                </button>
              ))}
            </div>
          )}

          {cat==="lines" && LINES.map(ln=>(
            <button key={ln.name} onClick={()=>onAddElem(makeSvg(ln))}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-all shadow-sm">
              <svg viewBox={ln.viewBox} className="w-16 h-5 flex-shrink-0"
                fill={ln.defaultFill} stroke={ln.defaultStroke}
                strokeWidth={ln.defaultStrokeW} strokeLinecap="round" strokeLinejoin="round"
                dangerouslySetInnerHTML={{__html:ln.svgContent}} />
              <span className="text-xs font-medium text-gray-700">{ln.name}</span>
            </button>
          ))}

          {cat==="gradients" && (
            <div className="grid grid-cols-2 gap-1.5">
              {GRADIENTS.map(g=>(
                <button key={g.name}
                  onClick={()=>onAddElem({...makeRect((CW-400)/2,200),w:400,h:250,fill:g.fill,radius:12} as RectElem)}
                  className="rounded-xl overflow-hidden border border-gray-200 hover:border-blue-400 transition-all shadow-sm hover:shadow-md hover:scale-[1.02]">
                  <div style={{background:g.fill,height:52}} />
                  <div className="bg-white py-1.5 text-center">
                    <span className="text-[10px] font-medium text-gray-600">{g.name}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {cat==="photos" && (
            <div className="grid grid-cols-2 gap-1.5">
              {STOCK_PHOTOS.map(p=>(
                <button key={p.name}
                  onClick={()=>onAddElem(makeImage(p.full,(CW-600)/2,100))}
                  className="rounded-xl overflow-hidden border border-gray-200 hover:border-blue-400 transition-all shadow-sm hover:shadow-md hover:scale-[1.02]">
                  <img src={p.thumb} alt={p.name} className="w-full h-14 object-cover" loading="lazy" />
                  <div className="bg-white py-1.5 text-center">
                    <span className="text-[10px] font-medium text-gray-600">{p.name}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {cat==="stickers" && (
            <div className="grid grid-cols-5 gap-1">
              {STICKERS.map(s=>(
                <button key={s}
                  onClick={()=>onAddElem({...makeText(s,64,(CW-80)/2,300),w:80,h:80,align:"center"} as TextElem)}
                  className="aspect-square flex items-center justify-center text-2xl rounded-xl bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-all shadow-sm hover:scale-110">
                  {s}
                </button>
              ))}
            </div>
          )}

          {cat==="buttons" && BUTTON_PRESETS.map(b=>(
            <button key={b.text} onClick={()=>onAddElem(makeButton(b))}
              className="w-full p-2.5 rounded-xl bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-all shadow-sm">
              <div className="w-full py-2 rounded-lg text-xs font-semibold text-center"
                style={{
                  background:b.bgColor==="transparent"?"#f8fafc":b.bgColor,
                  color:b.textColor,
                  borderRadius:b.radius,
                  border:b.borderW>0&&b.borderColor!=="none"?`${b.borderW}px solid ${b.borderColor}`:"none",
                }}>
                {b.text}
              </div>
            </button>
          ))}

          {cat==="videos" && (
            <div className="space-y-2.5 pt-1">
              <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-sm">
                <p className="text-[11px] font-medium text-gray-600 mb-2">YouTube Video ID</p>
                <input
                  type="text" value={ytId} onChange={e=>setYtId(e.target.value)}
                  placeholder="e.g. dQw4w9WgXcQ"
                  className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-400 focus:outline-none transition-colors"
                />
                <button
                  onClick={()=>{ if(ytId.trim()){onAddElem(makeVideo(ytId.trim()));setYtId("");} }}
                  disabled={!ytId.trim()}
                  className="mt-2 w-full text-xs py-2 text-white rounded-lg font-medium disabled:opacity-40 transition-opacity"
                  style={{background:"linear-gradient(135deg,#3b82f6,#2563eb)"}}>
                  Add Video
                </button>
              </div>
              <p className="text-[10px] text-gray-600 text-center">Paste the ID from the YouTube URL after <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-600">?v=</code></p>
            </div>
          )}

          {cat==="charts" && (
            <>
              {[
                {label:"Progress Bar", value:65, fill:"#3b82f6", track:"#e2e8f0"},
                {label:"Skill bar",    value:80, fill:"#10b981", track:"#d1fae5"},
                {label:"Completion",   value:45, fill:"#f59e0b", track:"#fef3c7"},
                {label:"Loading",      value:92, fill:"#8b5cf6", track:"#ede9fe"},
                {label:"Achievement",  value:30, fill:"#ef4444", track:"#fee2e2"},
              ].map(preset=>(
                <button key={preset.label}
                  onClick={()=>onAddElem({...makeProgress(),value:preset.value,fillColor:preset.fill,trackColor:preset.track})}
                  className="w-full p-3 rounded-xl bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-all shadow-sm text-left">
                  <div className="w-full h-3.5 rounded-full overflow-hidden mb-2" style={{background:preset.track}}>
                    <div className="h-full rounded-full transition-all" style={{width:`${preset.value}%`,background:preset.fill}} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-gray-600">{preset.label}</span>
                    <span className="text-[10px] font-bold" style={{color:preset.fill}}>{preset.value}%</span>
                  </div>
                </button>
              ))}
            </>
          )}

          {cat==="uploads" && (
            <div className="space-y-2.5 pt-1">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              <button
                onClick={()=>fileRef.current?.click()}
                disabled={uploading}
                className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 text-gray-400 hover:text-blue-600 transition-all disabled:opacity-60 bg-white"
                style={{background:"radial-gradient(ellipse at center, #f8fafc, #ffffff)"}}>
                {uploading
                  ? <><Loader2 className="w-6 h-6 animate-spin"/><span className="text-xs font-medium">Uploadingâ€¦</span></>
                  : <><Upload className="w-6 h-6"/><span className="text-xs font-medium">Click to upload image</span><span className="text-[10px] text-gray-500">JPG, PNG, GIF, WebP</span></>
                }
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// â"€â"€ Top bar â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function TopBar({
  saving, canUndo, canRedo, username, zoom, snapEnabled, exporting,
  isPublished, togglingPublish,
  onUndo, onRedo, onZoomIn, onZoomOut, onZoomReset,
  onToggleSnap, onExport,
  onSave, onPublishTemplate, onTogglePublish,
}: {
  saving:boolean; canUndo:boolean; canRedo:boolean;
  username:string|null|undefined; zoom:number; snapEnabled:boolean; exporting:boolean;
  isPublished:boolean; togglingPublish:boolean;
  onUndo:()=>void; onRedo:()=>void;
  onZoomIn:()=>void; onZoomOut:()=>void; onZoomReset:()=>void;
  onToggleSnap:()=>void; onExport:()=>void;
  onSave:()=>void; onPublishTemplate:()=>void; onTogglePublish:()=>void;
}) {
  return (
    <div className="h-14 bg-white flex items-center px-4 gap-2 flex-shrink-0 relative z-20"
      style={{borderBottom:"1px solid #f1f5f9",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>

      {/* Brand / Back */}
      <Link href="/dashboard" title="Back to dashboard"
        className="flex items-center gap-2 mr-1 group flex-shrink-0">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-95 shadow-sm"
          style={{background:"linear-gradient(135deg,#3b82f6,#6366f1)"}}>
          <PanelLeft className="w-4 h-4 text-white" />
        </div>
      </Link>

      <div className="w-px h-5 bg-gray-200 flex-shrink-0 mx-1" />

      {/* Undo / Redo */}
      <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
        <button onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)"
          className="w-8 h-7 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-600">
          <Undo2 className="w-3.5 h-3.5"/>
        </button>
        <button onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)"
          className="w-8 h-7 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-600">
          <Redo2 className="w-3.5 h-3.5"/>
        </button>
      </div>

      <div className="w-px h-5 bg-gray-200 flex-shrink-0 mx-1" />

      {/* Zoom controls */}
      <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
        <button onClick={onZoomOut} title="Zoom out (Ctrl+-)"
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-600 text-base font-bold leading-none">
          −
        </button>
        <button onClick={onZoomReset} title="Reset zoom (Ctrl+0)"
          className="h-7 px-1.5 min-w-[46px] text-[11px] font-semibold text-gray-700 rounded-md hover:bg-white hover:shadow-sm transition-all tabular-nums">
          {Math.round(zoom*100)}%
        </button>
        <button onClick={onZoomIn} title="Zoom in (Ctrl+=)"
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-600 text-base font-bold leading-none">
          +
        </button>
      </div>

      <div className="w-px h-5 bg-gray-200 flex-shrink-0 mx-1" />

      {/* Snap to grid toggle */}
      <button onClick={onToggleSnap} title={snapEnabled?"Snap to grid ON (click to disable)":"Snap to grid OFF"}
        className={`flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-lg border transition-all ${snapEnabled?"bg-blue-50 border-blue-300 text-blue-700":"text-gray-500 border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300"}`}>
        <Grid3x3 className="w-3.5 h-3.5"/> Snap
      </button>

      {/* Export */}
      <button onClick={onExport} disabled={exporting} title="Download current page as PNG"
        className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all disabled:opacity-50">
        {exporting?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Download className="w-3.5 h-3.5"/>}
        Export
      </button>

      <div className="flex-1" />

      {/* Center label */}
      <span className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-700 select-none pointer-events-none tracking-tight">
        Portfolio Editor
      </span>

      {/* Right actions */}
      {username && (
        <Link href={`/${username}`} target="_blank"
          className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all">
          <Eye className="w-3.5 h-3.5"/> Preview
        </Link>
      )}
      <button onClick={onPublishTemplate} title="Share your design as a community template"
        className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all">
        <Share2 className="w-3.5 h-3.5"/> Share Template
      </button>
      {/* Publish status, explicit so live vs. draft is never ambiguous. */}
      <span className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[11px] font-semibold border ${
        isPublished
          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
          : "text-gray-500 bg-gray-50 border-gray-200"
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? "bg-emerald-500" : "bg-gray-400"}`} />
        {isPublished ? "Live" : "Draft"}
      </span>
      <button
        onClick={onTogglePublish}
        disabled={togglingPublish}
        title={isPublished ? "Unpublish portfolio" : "Publish portfolio (make it visible to everyone)"}
        className={`flex items-center gap-1.5 h-8 px-4 text-xs font-semibold rounded-lg shadow-sm disabled:opacity-60 transition-all ${
          isPublished
            ? "bg-green-500 hover:bg-green-600 text-white"
            : "bg-gray-900 hover:bg-gray-700 text-white"
        }`}>
        {togglingPublish
          ? <Loader2 className="w-3.5 h-3.5 animate-spin"/>
          : <Eye className="w-3.5 h-3.5"/>}
        {isPublished ? "Published" : "Publish"}
      </button>
      <button onClick={onSave} disabled={saving}
        className="flex items-center gap-1.5 h-8 px-4 text-xs font-semibold text-white rounded-lg shadow-sm disabled:opacity-60 transition-opacity"
        style={{background:"linear-gradient(135deg,#3b82f6 0%,#2563eb 100%)"}}>
        {saving?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Save className="w-3.5 h-3.5"/>}
        {saving?"Savingâ€¦":"Save"}
      </button>
    </div>
  );
}

// â"€â"€ Main Editor â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

export default function PortfolioEditor() {
  const { data: session } = useSession();
  const [doc, setDoc] = useState<CanvasDoc>(blank());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activePageId, setActivePageId] = useState<string>("");
  const [zoom, setZoom] = useState(0.5);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [lockAspect, setLockAspect] = useState(false);
  const [publishModal, setPublishModal] = useState(false);
  const [publishName, setPublishName] = useState("");
  const [publishDesc, setPublishDesc] = useState("");
  const [publishCat, setPublishCat] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishDone, setPublishDone] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [togglingPublish, setTogglingPublish] = useState(false);
  const [communityRefreshKey, setCommunityRefreshKey] = useState(0);
  const [marquee, setMarquee] = useState<{x:number;y:number;w:number;h:number}|null>(null);
  const [ctxMenu, setCtxMenu] = useState<{x:number;y:number;elemId:string|null}|null>(null);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [exporting, setExporting] = useState(false);
  // Focus mode hides both side panels so the page being edited becomes the hero.
  const [focusMode, setFocusMode] = useState(false);
  const marqueeCoverRef = useRef<HTMLDivElement>(null);
  const editSnapRef    = useRef<CanvasDoc|null>(null);
  const clipboardRef   = useRef<Elem[]>([]);
  const dragPageRef    = useRef<string|null>(null);

  const docRef       = useRef(doc); docRef.current = doc;
  const historyRef   = useRef<CanvasDoc[]>([]);
  const futureRef    = useRef<CanvasDoc[]>([]);
  const zoomRef      = useRef(zoom); zoomRef.current = zoom;
  const lockAspectRef = useRef(lockAspect); lockAspectRef.current = lockAspect;
  const selectedIdsRef = useRef(selectedIds); selectedIdsRef.current = selectedIds;
  const snapRef = useRef(snapEnabled); snapRef.current = snapEnabled;

  // Derived single-selection helpers
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;

  // â"€â"€ Load â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

  useEffect(() => {
    fetch("/api/portfolio")
      .then(r=>r.json())
      .then(data=>{
        if (data?.canvasData && (data.canvasData as any).version===1) {
          const d = data.canvasData as CanvasDoc;
          setDoc(d);
          setActivePageId(d.pages[0]?.id??"");
        } else {
          const d = blank();
          setDoc(d);
          setActivePageId(d.pages[0].id);
        }
        setIsPublished(data?.published ?? false);
        setLoaded(true);
      })
      .catch(()=>{
        const d = blank();
        setDoc(d);
        setActivePageId(d.pages[0].id);
        setLoaded(true);
      });
  }, []);

  // â"€â"€ History â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

  const pushHistory = useCallback((before: CanvasDoc) => {
    historyRef.current = [...historyRef.current.slice(-49), before];
    futureRef.current  = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    const h = historyRef.current;
    if (!h.length) return;
    const prev = h[h.length-1];
    futureRef.current  = [docRef.current, ...futureRef.current.slice(0,49)];
    historyRef.current = h.slice(0,-1);
    setCanUndo(h.length>1);
    setCanRedo(true);
    setDoc(prev);
    setSelectedIds([]);
  }, []);

  const redo = useCallback(() => {
    const f = futureRef.current;
    if (!f.length) return;
    const next = f[0];
    historyRef.current = [...historyRef.current.slice(-49), docRef.current];
    futureRef.current  = f.slice(1);
    setCanUndo(true);
    setCanRedo(f.length>1);
    setDoc(next);
    setSelectedIds([]);
  }, []);

  const zoomIn    = useCallback(() => setZoom(z => Math.min(2,    parseFloat((z+0.1).toFixed(1)))), []);
  const zoomOut   = useCallback(() => setZoom(z => Math.max(0.25, parseFloat((z-0.1).toFixed(1)))), []);
  const zoomReset = useCallback(() => setZoom(0.5), []);

  // â"€â"€ Keyboard â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const isInput = t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.isContentEditable;
      if ((e.metaKey||e.ctrlKey)&&e.key==="z"&&!e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.metaKey||e.ctrlKey)&&(e.key==="y"||(e.key==="z"&&e.shiftKey))) { e.preventDefault(); redo(); }
      if (!isInput&&(e.key==="Delete"||e.key==="Backspace")) {
        const ids = selectedIdsRef.current;
        if (ids.length > 0) {
          e.preventDefault();
          if (ids.length > 1) {
            const pgId = activePageId||docRef.current.pages[0]?.id;
            const toDelete = [...ids];
            setDocAndHistory(d=>({...d,pages:d.pages.map(p=>p.id!==pgId?p:{...p,elems:p.elems.filter(el=>!toDelete.includes(el.id))})}));
            setSelectedIds([]);
          } else {
            deleteElem(ids[0]);
          }
        }
      }
      if (!isInput&&(e.metaKey||e.ctrlKey)&&e.key==="d") {
        const ids = selectedIdsRef.current;
        if (ids.length > 0) {
          e.preventDefault();
          if (ids.length > 1) {
            const pgId = activePageId||docRef.current.pages[0]?.id;
            const toDupe = [...ids];
            setDocAndHistory(d=>{
              const page = d.pages.find(p=>p.id===pgId);
              const copies:Elem[] = (page?.elems.filter(el=>toDupe.includes(el.id))??[])
                .map(orig=>({...orig,id:uid(),x:orig.x+20,y:orig.y+20,z:orig.z+1}));
              return {...d,pages:d.pages.map(p=>p.id!==pgId?p:{...p,elems:[...p.elems,...copies]})};
            });
          } else {
            duplicateElem(ids[0]);
          }
        }
      }
      if (e.key==="Escape") { setSelectedIds([]); setEditingId(null); setCtxMenu(null); }
      // ── Arrow nudge ──────────────────────────────────────────────────────────
      if (!isInput && ["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)) {
        const ids = selectedIdsRef.current;
        if (ids.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          const dx = e.key==="ArrowLeft" ? -step : e.key==="ArrowRight" ? step : 0;
          const dy = e.key==="ArrowUp"   ? -step : e.key==="ArrowDown"  ? step : 0;
          const pgId = activePageId||docRef.current.pages[0]?.id;
          if (!e.repeat) pushHistory(docRef.current);
          setDoc(d=>({...d,pages:d.pages.map(p=>p.id!==pgId?p:{...p,
            elems:p.elems.map(el=>ids.includes(el.id)&&!el.locked?{...el,x:el.x+dx,y:el.y+dy}:el),
          })}));
        }
      }
      // ── Select all ──────────────────────────────────────────────────────────
      if (!isInput && (e.metaKey||e.ctrlKey) && e.key==="a") {
        e.preventDefault();
        const pgId = activePageId||docRef.current.pages[0]?.id;
        const page = docRef.current.pages.find(p=>p.id===pgId);
        if (page) { const ids=page.elems.map(el=>el.id); setSelectedIds(ids); selectedIdsRef.current=ids; }
      }
      // ── Copy ────────────────────────────────────────────────────────────────
      if (!isInput && (e.metaKey||e.ctrlKey) && e.key==="c") {
        const ids = selectedIdsRef.current;
        if (ids.length > 0) {
          const pgId = activePageId||docRef.current.pages[0]?.id;
          const page = docRef.current.pages.find(p=>p.id===pgId);
          if (page) clipboardRef.current = page.elems.filter(el=>ids.includes(el.id));
        }
      }
      // ── Paste ───────────────────────────────────────────────────────────────
      if (!isInput && (e.metaKey||e.ctrlKey) && e.key==="v") {
        const items = clipboardRef.current;
        if (items.length > 0) {
          e.preventDefault();
          const pgId = activePageId||docRef.current.pages[0]?.id;
          const copies = items.map(orig=>({...orig,id:uid(),x:orig.x+20,y:orig.y+20}));
          const newIds = copies.map(c=>c.id);
          setDocAndHistory(d=>({...d,pages:d.pages.map(p=>p.id!==pgId?p:{...p,elems:[...p.elems,...copies]})}));
          setSelectedIds(newIds); selectedIdsRef.current=newIds;
          clipboardRef.current = items.map(el=>({...el,x:el.x+20,y:el.y+20}));
        }
      }
      // ── Zoom shortcuts ──────────────────────────────────────────────────────
      if ((e.metaKey||e.ctrlKey) && (e.key==="="||e.key==="+")) { e.preventDefault(); zoomIn(); }
      if ((e.metaKey||e.ctrlKey) && e.key==="-") { e.preventDefault(); zoomOut(); }
      if ((e.metaKey||e.ctrlKey) && e.key==="0") { e.preventDefault(); zoomReset(); }
    };
    window.addEventListener("keydown", onKey);
    return ()=>window.removeEventListener("keydown", onKey);
  }, [undo, redo, selectedId, activePageId, zoomIn, zoomOut, zoomReset, pushHistory]); // eslint-disable-line

  // â"€â"€ Doc helpers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

  const activePage = doc.pages.find(p=>p.id===activePageId)??doc.pages[0];
  const selectedEl = selectedId ? activePage?.elems.find(e=>e.id===selectedId)??null : null;

  const setDocAndHistory = useCallback((updater:(d:CanvasDoc)=>CanvasDoc) => {
    setDoc(prev => {
      const next = updater(prev);
      pushHistory(prev);
      return next;
    });
  }, [pushHistory]);

  const updateElem = useCallback((patch: Partial<Elem>) => {
    if (!selectedId) return;
    const pgId = activePageId||doc.pages[0]?.id;
    setDocAndHistory(d=>({
      ...d,
      pages:d.pages.map(p=>p.id!==pgId?p:{
        ...p, elems:p.elems.map(e=>e.id!==selectedId?e:{...e,...patch} as Elem),
      }),
    }));
  }, [selectedId, activePageId, doc.pages, setDocAndHistory]);

  const deleteElem = useCallback((id:string) => {
    const pgId = activePageId||doc.pages[0]?.id;
    setDocAndHistory(d=>({
      ...d,
      pages:d.pages.map(p=>p.id!==pgId?p:{...p,elems:p.elems.filter(e=>e.id!==id)}),
    }));
    setSelectedIds([]);
  }, [activePageId, doc.pages, setDocAndHistory]);

  const duplicateElem = useCallback((id:string) => {
    const pgId = activePageId||doc.pages[0]?.id;
    setDocAndHistory(d=>{
      const page = d.pages.find(p=>p.id===pgId);
      const orig = page?.elems.find(e=>e.id===id);
      if (!orig) return d;
      const copy:Elem = {...orig, id:uid(), x:orig.x+20, y:orig.y+20, z:orig.z+1};
      return {...d, pages:d.pages.map(p=>p.id!==pgId?p:{...p,elems:[...p.elems,copy]})};
    });
  }, [activePageId, doc.pages, setDocAndHistory]);

  const addElem = useCallback((el: Elem) => {
    const pgId = activePageId||doc.pages[0]?.id;
    const before = docRef.current;
    setDoc(d=>({
      ...d,
      pages:d.pages.map(p=>p.id!==pgId?p:{...p,elems:[...p.elems,el]}),
    }));
    pushHistory(before);
    setSelectedIds([el.id]);
  }, [activePageId, doc.pages, pushHistory]);

  const alignElems = useCallback((type:"left"|"centerH"|"right"|"top"|"centerV"|"bottom") => {
    const ids = selectedIdsRef.current;
    if (ids.length < 2) return;
    const pgId = activePageId||docRef.current.pages[0]?.id;
    const page = docRef.current.pages.find(p=>p.id===pgId);
    const elems = page?.elems.filter(e=>ids.includes(e.id))??[];
    if (!elems.length) return;
    const minX = Math.min(...elems.map(e=>e.x));
    const maxX = Math.max(...elems.map(e=>e.x+e.w));
    const minY = Math.min(...elems.map(e=>e.y));
    const maxY = Math.max(...elems.map(e=>e.y+e.h));
    const cX = (minX+maxX)/2;
    const cY = (minY+maxY)/2;
    const patches: Record<string,{x?:number;y?:number}> = {};
    for (const el of elems) {
      if (type==="left")    patches[el.id] = {x:minX};
      if (type==="centerH") patches[el.id] = {x:cX-el.w/2};
      if (type==="right")   patches[el.id] = {x:maxX-el.w};
      if (type==="top")     patches[el.id] = {y:minY};
      if (type==="centerV") patches[el.id] = {y:cY-el.h/2};
      if (type==="bottom")  patches[el.id] = {y:maxY-el.h};
    }
    setDocAndHistory(d=>({
      ...d,
      pages:d.pages.map(p=>p.id!==pgId?p:{
        ...p,
        elems:p.elems.map(el=>patches[el.id]?{...el,...patches[el.id]}:el),
      }),
    }));
  }, [activePageId, setDocAndHistory]);

  const distributeElems = useCallback((dir: "h"|"v") => {
    const ids = selectedIdsRef.current;
    if (ids.length < 3) return;
    const pgId = activePageId||docRef.current.pages[0]?.id;
    setDocAndHistory(d => {
      const page = d.pages.find(p=>p.id===pgId);
      if (!page) return d;
      const elems = page.elems.filter(el=>ids.includes(el.id));
      if (dir === "h") {
        const sorted = [...elems].sort((a,b)=>a.x-b.x);
        const totalW = sorted.reduce((s,el)=>s+el.w, 0);
        const span   = sorted[sorted.length-1].x + sorted[sorted.length-1].w - sorted[0].x;
        const gap    = (span - totalW) / (sorted.length - 1);
        let cursor = sorted[0].x;
        const xs: Record<string,number> = {};
        sorted.forEach(el => { xs[el.id]=cursor; cursor+=el.w+gap; });
        return {...d, pages:d.pages.map(p=>p.id!==pgId?p:{...p,
          elems:p.elems.map(el=>xs[el.id]!==undefined?{...el,x:xs[el.id]}:el)})};
      } else {
        const sorted = [...elems].sort((a,b)=>a.y-b.y);
        const totalH = sorted.reduce((s,el)=>s+el.h, 0);
        const span   = sorted[sorted.length-1].y + sorted[sorted.length-1].h - sorted[0].y;
        const gap    = (span - totalH) / (sorted.length - 1);
        let cursor = sorted[0].y;
        const ys: Record<string,number> = {};
        sorted.forEach(el => { ys[el.id]=cursor; cursor+=el.h+gap; });
        return {...d, pages:d.pages.map(p=>p.id!==pgId?p:{...p,
          elems:p.elems.map(el=>ys[el.id]!==undefined?{...el,y:ys[el.id]}:el)})};
      }
    });
  }, [activePageId, setDocAndHistory]);

  const duplicatePage = useCallback((pageId: string) => {
    setDocAndHistory(d => {
      const src = d.pages.find(p=>p.id===pageId);
      if (!src) return d;
      const copy: Page = {...src, id:uid(), label:src.label+" Copy",
        elems:src.elems.map(el=>({...el,id:uid()}))};
      const idx = d.pages.findIndex(p=>p.id===pageId);
      const pages = [...d.pages];
      pages.splice(idx+1, 0, copy);
      return {...d, pages};
    });
  }, [setDocAndHistory]);

  const reorderPage = useCallback((fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    setDocAndHistory(d => {
      const pages = [...d.pages];
      const [moved] = pages.splice(fromIdx, 1);
      pages.splice(toIdx, 0, moved);
      return {...d, pages};
    });
  }, [setDocAndHistory]);

  const exportPage = useCallback(async () => {
    const pgId = activePageId||docRef.current.pages[0]?.id;
    const el = document.getElementById(`canvas-page-${pgId}`);
    if (!el) return;
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(el, {pixelRatio:1, cacheBust:true});
      const a = document.createElement("a");
      a.href = dataUrl; a.download = "portfolio.png"; a.click();
    } catch(err) { console.error("Export failed", err); }
    finally { setExporting(false); }
  }, [activePageId]);

  const updatePage = useCallback((patch: Partial<Page>) => {
    const pgId = activePageId||doc.pages[0]?.id;
    setDocAndHistory(d=>({
      ...d,
      pages:d.pages.map(p=>p.id!==pgId?p:{...p,...patch}),
    }));
  }, [activePageId, doc.pages, setDocAndHistory]);

  const addPage = useCallback(() => {
    const newPage:Page = {id:uid(),label:`Page ${doc.pages.length+1}`,bg:"#ffffff",h:DEFAULT_H,elems:[]};
    setDocAndHistory(d=>({...d,pages:[...d.pages,newPage]}));
    setActivePageId(newPage.id);
    setSelectedIds([]);
  }, [doc.pages, setDocAndHistory]);

  const deletePage = useCallback((pgId:string) => {
    if (doc.pages.length<=1) return;
    setDocAndHistory(d=>({...d,pages:d.pages.filter(p=>p.id!==pgId)}));
    setActivePageId(doc.pages.find(p=>p.id!==pgId)?.id??"");
    setSelectedIds([]);
  }, [doc.pages, setDocAndHistory]);

  // â"€â"€ Drag â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

  const startDrag = useCallback((e: React.PointerEvent, elemId:string) => {
    e.preventDefault(); e.stopPropagation();
    const pgId = activePageId||docRef.current.pages[0]?.id;
    const page = docRef.current.pages.find(p=>p.id===pgId);
    const elem = page?.elems.find(el=>el.id===elemId);
    if (!elem||elem.locked) return;

    // Drag all selected if this elem is part of selection, else just this one
    const currentIds = selectedIdsRef.current;
    const isDragSelected = currentIds.includes(elemId);
    const dragIds = isDragSelected && currentIds.length > 1 ? currentIds : [elemId];
    const origins = dragIds.map(id=>{
      const el2 = page?.elems.find(el=>el.id===id);
      return {id, ox:el2?.x??0, oy:el2?.y??0, locked:el2?.locked??false};
    }).filter(o=>!o.locked);

    const startX=e.clientX, startY=e.clientY;
    const snapBefore = docRef.current;

    const SG = 8; // snap grid size
    const onMove = (ev:PointerEvent) => {
      const dx=(ev.clientX-startX)/zoomRef.current;
      const dy=(ev.clientY-startY)/zoomRef.current;
      setDoc(d=>({
        ...d,
        pages:d.pages.map(p=>p.id!==pgId?p:{
          ...p,
          elems:p.elems.map(el=>{
            const o = origins.find(o2=>o2.id===el.id);
            if (!o) return el;
            let nx=Math.max(0,o.ox+dx), ny=Math.max(0,o.oy+dy);
            if (snapRef.current) { nx=Math.round(nx/SG)*SG; ny=Math.round(ny/SG)*SG; }
            return {...el,x:nx,y:ny};
          }),
        }),
      }));
    };
    const onUp = () => {
      window.removeEventListener("pointermove",onMove);
      window.removeEventListener("pointerup",onUp);
      pushHistory(snapBefore);
    };
    window.addEventListener("pointermove",onMove);
    window.addEventListener("pointerup",onUp);
  }, [activePageId, pushHistory]);

  // â"€â"€ Resize â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

  const startResize = useCallback((e:React.PointerEvent, elemId:string, dir:HandleDir) => {
    e.preventDefault(); e.stopPropagation();
    const pgId = activePageId||docRef.current.pages[0]?.id;
    const page = docRef.current.pages.find(p=>p.id===pgId);
    const allIds = selectedIdsRef.current;
    const [cx,cy,cw,ch] = HANDLE_MAP[dir];
    const snapBefore = docRef.current;

    if (allIds.length > 1) {
      // ── Group resize ──────────────────────────────────────────────────────────
      const elems = page?.elems.filter(el => allIds.includes(el.id) && !el.locked) ?? [];
      if (!elems.length) return;
      const bx1 = Math.min(...elems.map(el => el.x));
      const by1 = Math.min(...elems.map(el => el.y));
      const bx2 = Math.max(...elems.map(el => el.x + el.w));
      const by2 = Math.max(...elems.map(el => el.y + el.h));
      const bw = bx2 - bx1, bh = by2 - by1;
      const origRels = elems.map(el => ({
        id: el.id,
        rx: bw > 0 ? (el.x - bx1) / bw : 0,
        ry: bh > 0 ? (el.y - by1) / bh : 0,
        rw: bw > 0 ? el.w / bw : 1,
        rh: bh > 0 ? el.h / bh : 1,
        size:     (el as any).size     as number|undefined,
        fontSize: (el as any).fontSize as number|undefined,
      }));
      const startX = e.clientX, startY = e.clientY;
      const onMove = (ev: PointerEvent) => {
        const dx = (ev.clientX - startX) / zoomRef.current;
        const dy = (ev.clientY - startY) / zoomRef.current;
        const nw = Math.max(20, bw + cw * dx);
        const nh = Math.max(20, bh + ch * dy);
        const newBx = bx1 + (cx ? (bw - nw) : 0);
        const newBy = by1 + (cy ? (bh - nh) : 0);
        const scaleW = nw / bw, scaleH = nh / bh;
        setDoc(d => ({
          ...d,
          pages: d.pages.map(p => p.id !== pgId ? p : {
            ...p,
            elems: p.elems.map(el => {
              const rel = origRels.find(r => r.id === el.id);
              if (!rel) return el;
              const scale = Math.max(scaleW, scaleH);
              const extra: Record<string, number> = {};
              if (rel.size     !== undefined) extra.size     = Math.max(8, Math.round(rel.size     * scale));
              if (rel.fontSize !== undefined) extra.fontSize = Math.max(8, Math.round(rel.fontSize * scale));
              return { ...el, x: newBx + rel.rx * nw, y: newBy + rel.ry * nh, w: Math.max(10, rel.rw * nw), h: Math.max(10, rel.rh * nh), ...extra };
            }),
          }),
        }));
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        pushHistory(snapBefore);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      return;
    }

    // ── Single element resize ─────────────────────────────────────────────────
    const elem = page?.elems.find(el=>el.id===elemId);
    if (!elem) return;

    const startX=e.clientX, startY=e.clientY;
    const {x:ox,y:oy,w:ow,h:oh} = elem;
    const origSize     = (elem as any).size     as number|undefined;
    const origFontSize = (elem as any).fontSize as number|undefined;
    const aspect = ow / oh;

    const onMove = (ev:PointerEvent) => {
      const dx=(ev.clientX-startX)/zoomRef.current;
      const dy=(ev.clientY-startY)/zoomRef.current;
      const SG = 8;
      let nw=Math.max(20,ow+cw*dx);
      let nh=Math.max(20,oh+ch*dy);
      if (snapRef.current) { nw=Math.max(20,Math.round(nw/SG)*SG); nh=Math.max(20,Math.round(nh/SG)*SG); }
      if (lockAspectRef.current) {
        const useDx = cw!==0 && (ch===0 || Math.abs(cw*dx) >= Math.abs(ch*dy));
        if (useDx) nh = nw / aspect;
        else       nw = nh * aspect;
        nw = Math.max(20, nw); nh = Math.max(20, nh);
      }
      const scaleH = nh/oh;
      const scaleW = nw/ow;
      const scale  = Math.max(scaleH, scaleW);
      const extra: Record<string,number> = {};
      if (origSize     !== undefined) extra.size     = Math.max(8,  Math.round(origSize     * scale));
      if (origFontSize !== undefined) extra.fontSize = Math.max(8,  Math.round(origFontSize * scale));
      setDoc(d=>({
        ...d,
        pages:d.pages.map(p=>p.id!==pgId?p:{
          ...p,
          elems:p.elems.map(el=>el.id!==elemId?el:{...el,x:ox+(cx?(ow-nw):0),y:oy+(cy?(oh-nh):0),w:nw,h:nh,...extra}),
        }),
      }));
    };
    const onUp = () => {
      window.removeEventListener("pointermove",onMove);
      window.removeEventListener("pointerup",onUp);
      pushHistory(snapBefore);
    };
    window.addEventListener("pointermove",onMove);
    window.addEventListener("pointerup",onUp);
  }, [activePageId, pushHistory]);

  // â"€â"€ Rotate â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

  const startRotate = useCallback((e:React.PointerEvent, elemId:string) => {
    e.preventDefault(); e.stopPropagation();
    const pgId = activePageId||docRef.current.pages[0]?.id;
    const page = docRef.current.pages.find(p=>p.id===pgId);
    const elem = page?.elems.find(el=>el.id===elemId);
    if (!elem) return;

    const cx=elem.x+elem.w/2, cy=elem.y+elem.h/2;
    const snapBefore = docRef.current;
    const canvasEl = document.getElementById(`canvas-page-${pgId}`);
    const rect = canvasEl?.getBoundingClientRect();
    if (!rect) return;

    const onMove = (ev:PointerEvent) => {
      const px=(ev.clientX-rect.left)/zoomRef.current;
      const py=(ev.clientY-rect.top)/zoomRef.current;
      const angle=Math.atan2(py-cy,px-cx)*(180/Math.PI)+90;
      const rot=((angle%360)+360)%360;
      setDoc(d=>({
        ...d,
        pages:d.pages.map(p=>p.id!==pgId?p:{...p,elems:p.elems.map(el=>el.id!==elemId?el:{...el,rot})}),
      }));
    };
    const onUp = () => {
      window.removeEventListener("pointermove",onMove);
      window.removeEventListener("pointerup",onUp);
      pushHistory(snapBefore);
    };
    window.addEventListener("pointermove",onMove);
    window.addEventListener("pointerup",onUp);
  }, [activePageId, pushHistory]);

  // ── Marquee selection ────────────────────────────────────────────────────────

  const startMarquee = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const pgId = activePageId || docRef.current.pages[0]?.id;
    const rect = e.currentTarget.getBoundingClientRect();
    const z = zoomRef.current;
    const x0 = (e.clientX - rect.left) / z;
    const y0 = (e.clientY - rect.top)  / z;

    // Show cover immediately via DOM, don't wait for React render cycle
    if (marqueeCoverRef.current) marqueeCoverRef.current.style.display = "block";

    e.currentTarget.setPointerCapture(e.pointerId);
    setMarquee({ x: x0, y: y0, w: 0, h: 0 });
    setSelectedIds([]);
    setEditingId(null);

    const noSelect = (ev: Event) => ev.preventDefault();
    document.addEventListener("selectstart", noSelect);

    const onMove = (ev: PointerEvent) => {
      ev.preventDefault();
      const cx = (ev.clientX - rect.left) / z;
      const cy = (ev.clientY - rect.top)  / z;
      setMarquee({
        x: Math.min(x0, cx),
        y: Math.min(y0, cy),
        w: Math.abs(cx - x0),
        h: Math.abs(cy - y0),
      });
    };

    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("selectstart", noSelect);
      // Hide cover immediately
      if (marqueeCoverRef.current) marqueeCoverRef.current.style.display = "none";

      setMarquee(mq => {
        if (!mq || (mq.w < 4 && mq.h < 4)) return null;
        const page = docRef.current.pages.find(p => p.id === pgId);
        if (!page) return null;
        const mx1 = mq.x, my1 = mq.y, mx2 = mq.x + mq.w, my2 = mq.y + mq.h;
        const hits = page.elems
          .filter(el => !el.locked)
          .filter(el => el.x < mx2 && el.x + el.w > mx1 && el.y < my2 && el.y + el.h > my1)
          .map(el => el.id);
        setSelectedIds(hits);
        return null;
      });
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

  // ── Save ──────────────────────────────────────────────────────────────────────

  const save = useCallback(async (d?: CanvasDoc) => {
    setSaving(true);
    try {
      const payload = d??docRef.current;
      await fetch("/api/portfolio", {
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({canvasData:payload, template:"canvas"}),
      });
    } finally {
      setSaving(false);
    }
  }, []);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(() => {
    if (!loaded) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(()=>save(doc), 2000);
    return ()=>{ if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [doc, loaded]); // eslint-disable-line

  const togglePublish = useCallback(async () => {
    setTogglingPublish(true);
    try {
      const next = !isPublished;
      const r = await fetch("/api/portfolio/publish", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({published:next}),
      });
      if (r.ok) setIsPublished(next);
    } finally {
      setTogglingPublish(false);
    }
  }, [isPublished]);

  const publishTemplate = useCallback(async () => {
    if (!publishName.trim()) return;
    setPublishing(true);
    try {
      const r = await fetch("/api/canvas-templates", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ name:publishName.trim(), description:publishDesc.trim()||null, category:publishCat.trim()||null, canvasData:docRef.current }),
      });
      if (r.ok) { setPublishDone(true); setCommunityRefreshKey(k=>k+1); }
      else alert("Failed to publish template. Please try again.");
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setPublishing(false);
    }
  }, [publishName, publishDesc, publishCat]);

  // â"€â"€ Render â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const activePg = doc.pages.find(p=>p.id===activePageId)??doc.pages[0];

  return (
    <>
    {/* Mobile / small-screen notice, the canvas editor needs room to work */}
    <div className="lg:hidden fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center text-center px-8 gap-5">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm"
        style={{background:"linear-gradient(135deg,#3b82f6,#6366f1)"}}>
        <LayoutTemplate className="w-7 h-7 text-white" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-gray-900">Best on a bigger screen</h1>
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
          The portfolio editor is a drag-and-drop design tool that needs more room than a phone.
          Open it on a tablet or computer to build your portfolio.
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-[220px]">
        {(session?.user as any)?.username && (
          <Link href={`/${(session?.user as any).username}`} target="_blank"
            className="h-10 flex items-center justify-center gap-1.5 rounded-xl text-sm font-semibold text-white shadow-sm"
            style={{background:"linear-gradient(135deg,#3b82f6,#2563eb)"}}>
            <Eye className="w-4 h-4"/> Preview my portfolio
          </Link>
        )}
        <Link href="/dashboard"
          className="h-10 flex items-center justify-center rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
          Back to dashboard
        </Link>
      </div>
    </div>
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden select-none">
      <link rel="stylesheet" href={GF_URL} />

      <TopBar
        saving={saving} canUndo={canUndo} canRedo={canRedo}
        username={(session?.user as any)?.username} zoom={zoom}
        snapEnabled={snapEnabled} exporting={exporting}
        isPublished={isPublished} togglingPublish={togglingPublish}
        onUndo={undo} onRedo={redo}
        onZoomIn={zoomIn} onZoomOut={zoomOut} onZoomReset={zoomReset}
        onToggleSnap={()=>setSnapEnabled(v=>!v)}
        onExport={exportPage}
        onSave={()=>save()}
        onPublishTemplate={()=>{ setPublishName(""); setPublishDesc(""); setPublishCat(""); setPublishDone(false); setPublishModal(true); }}
        onTogglePublish={togglePublish}
      />

      <div className="flex flex-1 overflow-hidden">
        {!focusMode && (
        <LeftPanel
          onAddElem={addElem}
          onApplyTemplate={newDoc=>{
            pushHistory(docRef.current);
            setDoc(newDoc);
            setActivePageId(newDoc.pages[0]?.id??"");
            setSelectedIds([]);
          }}
          onUpload={()=>{}}
          communityRefreshKey={communityRefreshKey}
          currentUsername={(session?.user as any)?.username}
        />
        )}

        {/* Canvas */}
        <div
          className="flex-1 overflow-auto bg-gray-200 flex flex-col items-center py-8 relative"
          onClick={()=>{ setSelectedIds([]); setEditingId(null); }}>

          {/* Floating zoom controls, pinned top-right so they never overlap the
              centered page tabs (the page tabs stay clickable independently). */}
          <div
            onClick={e=>e.stopPropagation()}
            style={{position:"sticky",top:12,zIndex:50,alignSelf:"flex-end",marginRight:16,marginBottom:-34,pointerEvents:"none"}}>
            <div style={{
              display:"inline-flex", alignItems:"center", gap:2,
              background:"rgba(30,30,30,0.82)", backdropFilter:"blur(6px)",
              borderRadius:999, padding:"4px 8px",
              boxShadow:"0 2px 12px rgba(0,0,0,0.28)",
              pointerEvents:"all",
            }}>
              <button onClick={()=>setZoom(z=>Math.max(z-0.1,0.2))}
                style={{width:28,height:26,display:"flex",alignItems:"center",justifyContent:"center",
                  borderRadius:999,border:"none",background:"transparent",cursor:"pointer",color:"#e5e7eb",fontSize:16,lineHeight:1}}>
                −
              </button>
              <span style={{fontSize:11,fontWeight:700,color:"#e5e7eb",minWidth:38,textAlign:"center",fontVariantNumeric:"tabular-nums"}}>
                {Math.round(zoom*100)}%
              </span>
              <button onClick={()=>setZoom(z=>Math.min(z+0.1,3))}
                style={{width:28,height:26,display:"flex",alignItems:"center",justifyContent:"center",
                  borderRadius:999,border:"none",background:"transparent",cursor:"pointer",color:"#e5e7eb",fontSize:16,lineHeight:1}}>
                +
              </button>
              <div style={{width:1,height:16,background:"rgba(255,255,255,0.15)",margin:"0 2px"}} />
              <button onClick={()=>setZoom(0.5)}
                style={{height:26,padding:"0 8px",display:"flex",alignItems:"center",justifyContent:"center",
                  borderRadius:999,border:"none",background:"transparent",cursor:"pointer",
                  color:"#9ca3af",fontSize:11,fontWeight:600}}>
                Reset
              </button>
              <div style={{width:1,height:16,background:"rgba(255,255,255,0.15)",margin:"0 2px"}} />
              <button onClick={()=>setFocusMode(v=>!v)} title="Focus mode, hide panels so the page is the only thing on screen"
                style={{height:26,padding:"0 8px",display:"flex",alignItems:"center",justifyContent:"center",gap:5,
                  borderRadius:999,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,
                  background: focusMode ? "#c8e83c" : "transparent",
                  color: focusMode ? "#162000" : "#9ca3af"}}>
                {focusMode ? "Exit Focus" : "Focus"}
              </button>
            </div>
          </div>

          {/* Page tabs */}
          <div className="flex items-center gap-1.5 mb-4 bg-white rounded-xl px-2 py-1.5 shadow-sm border border-gray-200 flex-wrap">
            {doc.pages.map((pg,pgIdx)=>(
              <div key={pg.id} className="relative group/pg"
                draggable
                onDragStart={e=>{ e.stopPropagation(); dragPageRef.current=pg.id; e.dataTransfer.effectAllowed="move"; }}
                onDragOver={e=>{ e.preventDefault(); e.dataTransfer.dropEffect="move"; }}
                onDrop={e=>{ e.preventDefault(); const fromId=dragPageRef.current; if(!fromId||fromId===pg.id) return; const fi=doc.pages.findIndex(p=>p.id===fromId); const ti=doc.pages.findIndex(p=>p.id===pg.id); reorderPage(fi,ti); dragPageRef.current=null; }}>
                <button
                  onClick={e=>{e.stopPropagation();setActivePageId(pg.id);setSelectedIds([]);}}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-grab active:cursor-grabbing ${pg.id===activePageId?"bg-blue-600 text-white":"text-gray-600 hover:bg-gray-100"}`}>
                  {pg.label}
                </button>
                <button title="Duplicate page"
                  onClick={e=>{e.stopPropagation();duplicatePage(pg.id);}}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] items-center justify-center hidden group-hover/pg:flex shadow-sm hover:bg-blue-600 z-10 leading-none">
                  +
                </button>
              </div>
            ))}
            <button onClick={e=>{e.stopPropagation();addPage();}} title="Add page"
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0">
              <Plus className="w-3.5 h-3.5"/>
            </button>
            {doc.pages.length>1 && (
              <button onClick={e=>{e.stopPropagation();deletePage(activePageId);}} title="Delete current page"
                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400 flex-shrink-0">
                <Minus className="w-3.5 h-3.5"/>
              </button>
            )}
          </div>

          {/* Canvas artboard */}
          {activePg && (
            <div style={{transform:`scale(${zoom})`,transformOrigin:"top center"}}>
              <div
                id={`canvas-page-${activePg.id}`}
                onClick={e=>{e.stopPropagation(); setCtxMenu(null);}}
                onContextMenu={e=>{e.preventDefault(); setCtxMenu({x:e.clientX,y:e.clientY,elemId:null});}}
                onPointerDown={startMarquee}
                style={{
                  position:"relative", width:CW, height:activePg.h,
                  backgroundColor:activePg.bg,
                  backgroundImage:activePg.bgImage?`url(${activePg.bgImage})`:undefined,
                  backgroundSize:"cover", backgroundPosition:"center",
                  boxShadow:"0 4px 32px rgba(0,0,0,0.18)", overflow:"hidden",
                  cursor: marquee ? "crosshair" : "default",
                }}>

                {[...activePg.elems].sort((a,b)=>a.z-b.z).map(el=>{
                  const sel = selectedIds.includes(el.id);
                  const editing = el.id===editingId && el.type==="text";
                  const flipTransform = `${el.flipX?"scaleX(-1) ":""}${el.flipY?"scaleY(-1) ":""}`;
                  const shadowFilter = el.shadow
                    ? `drop-shadow(${el.shadow.x}px ${el.shadow.y}px ${el.shadow.blur}px ${el.shadow.color})`
                    : undefined;

                  return (
                    <div key={el.id}
                      style={{
                        position:"absolute",
                        left:el.x, top:el.y, width:el.w, height:el.h,
                        transform:`rotate(${el.rot}deg) ${flipTransform}`,
                        transformOrigin:"center center",
                        opacity:el.opacity, zIndex:el.z,
                        filter:shadowFilter,
                        mixBlendMode:(el.blendMode&&el.blendMode!=="normal"?el.blendMode:undefined) as any,
                        cursor:el.locked?"not-allowed":editing?"text":"move",
                        outline:sel&&!editing?"2px solid #3b82f6":undefined,
                        outlineOffset:1,
                      }}
                      onPointerDown={e=>{
                        if (editing) return;
                        e.stopPropagation();
                        if (e.shiftKey) {
                          const newIds = selectedIdsRef.current.includes(el.id)
                            ? selectedIdsRef.current.filter(id=>id!==el.id)
                            : [...selectedIdsRef.current, el.id];
                          setSelectedIds(newIds);
                          selectedIdsRef.current = newIds;
                        } else {
                          if (!selectedIdsRef.current.includes(el.id)) {
                            setSelectedIds([el.id]);
                            selectedIdsRef.current = [el.id];
                          }
                          if (!el.locked) startDrag(e, el.id);
                        }
                      }}
                      onContextMenu={e=>{
                        e.preventDefault(); e.stopPropagation();
                        if (!selectedIdsRef.current.includes(el.id)) {
                          setSelectedIds([el.id]); selectedIdsRef.current=[el.id];
                        }
                        setCtxMenu({x:e.clientX,y:e.clientY,elemId:el.id});
                      }}
                      onDoubleClick={e=>{
                        if (el.type==="text"&&!el.locked) {
                          e.stopPropagation();
                          editSnapRef.current = docRef.current;
                          setEditingId(el.id);
                        }
                      }}>

                      {editing && el.type==="text" ? (
                        <textarea
                          autoFocus
                          value={el.content}
                          onChange={ev=>{
                            const content=ev.target.value;
                            setDoc(d=>({
                              ...d,
                              pages:d.pages.map(p=>p.id!==activePg.id?p:{
                                ...p,
                                elems:p.elems.map(e2=>e2.id!==el.id?e2:{...e2,content} as Elem),
                              }),
                            }));
                          }}
                          onBlur={()=>{ pushHistory(editSnapRef.current??docRef.current); editSnapRef.current=null; setEditingId(null); }}
                          onKeyDown={e=>{ if(e.key==="Escape"){pushHistory(editSnapRef.current??docRef.current);editSnapRef.current=null;setEditingId(null);} }}
                          style={{
                            position:"absolute", inset:0, width:"100%", height:"100%",
                            border:"none", outline:"none", background:"transparent", resize:"none",
                            fontFamily:fontFamily(el.font), fontSize:el.size,
                            fontWeight:el.fontWeight??(el.bold?700:400), fontStyle:el.italic?"italic":"normal",
                            textDecoration:el.underline?"underline":"none",
                            textAlign:el.align, color:el.color, lineHeight:el.lh,
                            letterSpacing:el.ls?`${el.ls}px`:undefined,
                            textTransform:(el.textTransform&&el.textTransform!=="none")?el.textTransform as any:undefined,
                            padding:4, cursor:"text", whiteSpace:"pre-wrap", wordBreak:"break-word",
                          }}
                        />
                      ) : (
                        <ElemContent el={el} />
                      )}

                    </div>
                  );
                })}

                {/* Selection handle overlays â€" always above all elements */}
                {!editingId && selectedIds.map(selId=>{
                  const s = activePg.elems.find(el=>el.id===selId);
                  if (!s || s.locked) return null;
                  const isSingle = selectedIds.length === 1;
                  return (
                    <div key={`sel-${selId}`} style={{
                      position:"absolute",
                      left:s.x, top:s.y, width:s.w, height:s.h,
                      transform:`rotate(${s.rot}deg)`,
                      transformOrigin:"center center",
                      zIndex:99999,
                      pointerEvents:"none",
                    }}>
                      {isSingle && (
                        <>
                          <div
                            onPointerDown={e=>{e.stopPropagation();startRotate(e,s.id);}}
                            style={{
                              position:"absolute", top:-36, left:"50%", transform:"translateX(-50%)",
                              width:22, height:22, borderRadius:"50%",
                              background:"white", border:"2px solid #3b82f6",
                              cursor:"grab", pointerEvents:"all",
                              display:"flex", alignItems:"center", justifyContent:"center",
                              boxShadow:"0 1px 4px rgba(0,0,0,0.25)",
                            }}>
                            <RotateCcw style={{width:10,height:10,color:"#3b82f6"}} />
                          </div>
                          <div style={{position:"absolute",top:-28,left:"50%",width:2,height:28,background:"#3b82f6",transform:"translateX(-50%)",pointerEvents:"none"}} />
                          {(Object.keys(HANDLE_MAP) as HandleDir[]).map(dir=>(
                            <div key={dir}
                              onPointerDown={e=>{e.stopPropagation();startResize(e,s.id,dir);}}
                              style={{
                                position:"absolute", ...HANDLE_POS[dir],
                                width:14, height:14, background:"white",
                                border:"2px solid #3b82f6", borderRadius:3,
                                cursor:HANDLE_CURSOR[dir], pointerEvents:"all",
                                boxShadow:"0 1px 4px rgba(0,0,0,0.25)",
                              }}
                            />
                          ))}
                        </>
                      )}
                      {!isSingle && (
                        <div style={{
                          position:"absolute", inset:-2,
                          border:"1.5px solid #3b82f6", borderRadius:2,
                          pointerEvents:"none",
                        }} />
                      )}
                    </div>
                  );
                })}

                {/* Group bounding box with resize handles for multi-selection */}
                {!editingId && selectedIds.length > 1 && (() => {
                  const selElems = activePg.elems.filter(el => selectedIds.includes(el.id) && !el.locked);
                  if (!selElems.length) return null;
                  const bx1 = Math.min(...selElems.map(el => el.x));
                  const by1 = Math.min(...selElems.map(el => el.y));
                  const bx2 = Math.max(...selElems.map(el => el.x + el.w));
                  const by2 = Math.max(...selElems.map(el => el.y + el.h));
                  return (
                    <div key="group-bbox" style={{
                      position:"absolute",
                      left: bx1 - 4, top: by1 - 4,
                      width: bx2 - bx1 + 8, height: by2 - by1 + 8,
                      border: "1.5px dashed #3b82f6",
                      zIndex: 100000,
                      pointerEvents: "none",
                    }}>
                      {(Object.keys(HANDLE_MAP) as HandleDir[]).map(dir => (
                        <div key={dir}
                          onPointerDown={e => { e.stopPropagation(); startResize(e, selElems[0].id, dir); }}
                          style={{
                            position:"absolute", ...HANDLE_POS[dir],
                            width:14, height:14, background:"white",
                            border:"2px solid #3b82f6", borderRadius:3,
                            cursor:HANDLE_CURSOR[dir], pointerEvents:"all",
                            boxShadow:"0 1px 4px rgba(0,0,0,0.25)",
                          }}
                        />
                      ))}
                    </div>
                  );
                })()}

                {/* Snap grid overlay */}
                {snapEnabled && (
                  <div style={{
                    position:"absolute", inset:0, pointerEvents:"none", zIndex:99997,
                    backgroundImage:"radial-gradient(circle, #93c5fd 1px, transparent 1px)",
                    backgroundSize:"8px 8px", opacity:0.5,
                  }}/>
                )}

                {/* Transparent cover during marquee, shown immediately via ref, not React state */}
                <div ref={marqueeCoverRef} style={{
                  display:"none",
                  position:"absolute", inset:0,
                  zIndex:999998,
                  cursor:"crosshair",
                  userSelect:"none",
                }}/>

                {/* Marquee selection rectangle */}
                {marquee && marquee.w > 2 && marquee.h > 2 && (
                  <div style={{
                    position:"absolute",
                    left:marquee.x, top:marquee.y, width:marquee.w, height:marquee.h,
                    border:"1.5px solid #3b82f6",
                    background:"rgba(59,130,246,0.08)",
                    pointerEvents:"none",
                    zIndex:999999,
                  }}/>
                )}
              </div>
            </div>
          )}

          <div style={{height:(activePg?.h??DEFAULT_H)*zoom+48}} />
        </div>

        {!focusMode && (
        <RightPanel
          el={selectedEl}
          page={activePg??null}
          selectedIds={selectedIds}
          selectedCount={selectedIds.length}
          lockAspect={lockAspect}
          onElemChange={updateElem}
          onPageChange={updatePage}
          onDelete={()=>{
            if (selectedIds.length > 1) {
              const pgId = activePageId||doc.pages[0]?.id;
              const ids = selectedIds;
              setDocAndHistory(d=>({...d,pages:d.pages.map(p=>p.id!==pgId?p:{...p,elems:p.elems.filter(e=>!ids.includes(e.id))})}));
              setSelectedIds([]);
            } else if (selectedId) {
              deleteElem(selectedId);
            }
          }}
          onDuplicate={()=>{
            if (selectedIds.length > 1) {
              const pgId = activePageId||doc.pages[0]?.id;
              setDocAndHistory(d=>{
                const page = d.pages.find(p=>p.id===pgId);
                const copies:Elem[] = (page?.elems.filter(e=>selectedIds.includes(e.id))??[])
                  .map(orig=>({...orig,id:uid(),x:orig.x+20,y:orig.y+20,z:orig.z+1}));
                return {...d,pages:d.pages.map(p=>p.id!==pgId?p:{...p,elems:[...p.elems,...copies]})};
              });
            } else if (selectedId) {
              duplicateElem(selectedId);
            }
          }}
          onLock={()=>selectedId&&updateElem({locked:!selectedEl?.locked} as any)}
          onBringForward={()=>selectedId&&updateElem({z:(selectedEl?.z??1)+1} as any)}
          onSendBack={()=>selectedId&&updateElem({z:Math.max(0,(selectedEl?.z??1)-1)} as any)}
          onToggleLockAspect={()=>setLockAspect(v=>!v)}
          onAlignElems={alignElems}
          onDistribute={distributeElems}
          onSelectLayer={(id)=>{ setSelectedIds([id]); selectedIdsRef.current=[id]; }}
          onUploadBg={()=>{}}
        />
        )}
      </div>
    </div>

    {/* Context Menu */}
    {ctxMenu && (() => {
      const pgId = activePageId||doc.pages[0]?.id;
      const page = doc.pages.find(p=>p.id===pgId);
      const ctxEl = ctxMenu.elemId ? page?.elems.find(el=>el.id===ctxMenu.elemId) : null;
      const maxZ  = Math.max(0,...(page?.elems.map(el=>el.z)??[]));
      const minZ  = Math.min(0,...(page?.elems.map(el=>el.z)??[]));
      const hasClipboard = clipboardRef.current.length > 0;
      const close = () => setCtxMenu(null);
      const btn = (label:string, onClick:()=>void, danger=false) => (
        <button key={label} onClick={()=>{ onClick(); close(); }}
          className={`w-full text-left px-3 py-1.5 text-[12px] rounded-md transition-colors ${danger?"text-red-500 hover:bg-red-50":"text-gray-700 hover:bg-gray-100"}`}>
          {label}
        </button>
      );
      const sep = (k:string) => <div key={k} className="my-1 h-px bg-gray-100 mx-2" />;
      return (
        <div
          style={{position:"fixed",left:ctxMenu.x,top:ctxMenu.y,zIndex:99999,minWidth:188}}
          className="bg-white rounded-xl shadow-2xl border border-gray-200 p-1.5 py-1"
          onContextMenu={e=>e.preventDefault()}
          onClick={e=>e.stopPropagation()}>
          {ctxEl ? (<>
            {btn("Duplicate  Ctrl+D", ()=>{
              const ids=selectedIdsRef.current;
              if(ids.length>1){
                const copies=page!.elems.filter(el=>ids.includes(el.id)).map(orig=>({...orig,id:uid(),x:orig.x+20,y:orig.y+20,z:orig.z+1}));
                setDocAndHistory(d=>({...d,pages:d.pages.map(p=>p.id!==pgId?p:{...p,elems:[...p.elems,...copies]})}));
              } else { duplicateElem(ctxEl.id); }
            })}
            {btn("Copy  Ctrl+C", ()=>{
              const ids=selectedIdsRef.current;
              clipboardRef.current = page?.elems.filter(el=>ids.includes(el.id))??[];
            })}
            {hasClipboard && btn("Paste  Ctrl+V", ()=>{
              const items=clipboardRef.current;
              const copies=items.map(orig=>({...orig,id:uid(),x:orig.x+20,y:orig.y+20}));
              const newIds=copies.map(c=>c.id);
              setDocAndHistory(d=>({...d,pages:d.pages.map(p=>p.id!==pgId?p:{...p,elems:[...p.elems,...copies]})}));
              setSelectedIds(newIds); selectedIdsRef.current=newIds;
              clipboardRef.current=items.map(el=>({...el,x:el.x+20,y:el.y+20}));
            })}
            {sep("s1")}
            {btn("Bring Forward", ()=>updateElem({z:ctxEl.z+1} as any))}
            {btn("Send Backward", ()=>updateElem({z:Math.max(0,ctxEl.z-1)} as any))}
            {btn("Bring to Front", ()=>updateElem({z:maxZ+1} as any))}
            {btn("Send to Back",   ()=>updateElem({z:Math.max(0,minZ-1)} as any))}
            {sep("s2")}
            {btn(ctxEl.locked?"Unlock Element":"Lock Element", ()=>updateElem({locked:!ctxEl.locked} as any))}
            {sep("s3")}
            {btn("Delete  Del", ()=>{
              const ids=selectedIdsRef.current;
              if(ids.length>1){
                setDocAndHistory(d=>({...d,pages:d.pages.map(p=>p.id!==pgId?p:{...p,elems:p.elems.filter(el=>!ids.includes(el.id))})}));
                setSelectedIds([]);
              } else { deleteElem(ctxEl.id); }
            }, true)}
          </>) : (<>
            {hasClipboard && btn("Paste  Ctrl+V", ()=>{
              const items=clipboardRef.current;
              const copies=items.map(orig=>({...orig,id:uid(),x:orig.x+20,y:orig.y+20}));
              const newIds=copies.map(c=>c.id);
              setDocAndHistory(d=>({...d,pages:d.pages.map(p=>p.id!==pgId?p:{...p,elems:[...p.elems,...copies]})}));
              setSelectedIds(newIds); selectedIdsRef.current=newIds;
              clipboardRef.current=items.map(el=>({...el,x:el.x+20,y:el.y+20}));
            })}
            {btn("Select All  Ctrl+A", ()=>{
              const ids=page?.elems.map(el=>el.id)??[];
              setSelectedIds(ids); selectedIdsRef.current=ids;
            })}
          </>)}
        </div>
      );
    })()}

    {/* Click-away to close context menu */}
    {ctxMenu && <div style={{position:"fixed",inset:0,zIndex:99998}} onClick={()=>setCtxMenu(null)} onContextMenu={e=>{e.preventDefault();setCtxMenu(null);}}/>}

    {/* Publish Template Modal */}
    {publishModal && (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{background:"rgba(0,0,0,0.55)"}}
        onClick={()=>!publishing&&setPublishModal(false)}>
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative"
          onClick={e=>e.stopPropagation()}>
          <button onClick={()=>!publishing&&setPublishModal(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-5 h-5"/>
          </button>
          {publishDone ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Share2 className="w-6 h-6 text-green-600"/>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Template Published!</h3>
              <p className="text-sm text-gray-500 mb-4">Your template is now available to the community.</p>
              <button onClick={()=>setPublishModal(false)}
                className="px-5 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-5">
                <Share2 className="w-5 h-5 text-purple-500"/>
                <h3 className="text-base font-bold text-gray-900">Share as Template</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Template Name *</label>
                  <input
                    value={publishName}
                    onChange={e=>setPublishName(e.target.value)}
                    placeholder="e.g. Dark Agency Portfolio"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                  <textarea
                    value={publishDesc}
                    onChange={e=>setPublishDesc(e.target.value)}
                    placeholder="Briefly describe this template..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                  <select
                    value={publishCat}
                    onChange={e=>setPublishCat(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition-colors bg-white">
                    <option value="">None</option>
                    <option value="portfolio">Portfolio</option>
                    <option value="agency">Agency</option>
                    <option value="blog">Blog / Writing</option>
                    <option value="ecommerce">E-Commerce</option>
                    <option value="landing">Landing Page</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>
              </div>
              <button
                onClick={publishTemplate}
                disabled={!publishName.trim()||publishing}
                className="mt-5 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                style={{background:"linear-gradient(135deg,#8b5cf6,#6366f1)"}}>
                {publishing?<span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/>Publishing…</span>:"Publish Template"}
              </button>
            </>
          )}
        </div>
      </div>
    )}
    </>
  );
}

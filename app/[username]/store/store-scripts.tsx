"use client";

import { useEffect } from "react";

interface Props {
  ga?: string | null;
  pixel?: string | null;
  headCode?: string | null;
  bodyCode?: string | null;
  /** When false (owner preview), tracking is not fired. */
  enabled?: boolean;
}

// Append raw HTML to a target, recreating <script> nodes so they execute
// (innerHTML-inserted scripts don't run on their own).
function injectRaw(target: HTMLElement, html: string, marker: string) {
  if (!html.trim()) return;
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  Array.from(tpl.content.childNodes).forEach((node) => {
    if (node.nodeName === "SCRIPT") {
      const src = document.createElement("script");
      Array.from((node as HTMLScriptElement).attributes).forEach((a) => src.setAttribute(a.name, a.value));
      src.textContent = (node as HTMLScriptElement).textContent;
      src.setAttribute("data-sellora-inject", marker);
      target.appendChild(src);
    } else if (node.nodeType === 1) {
      (node as HTMLElement).setAttribute?.("data-sellora-inject", marker);
      target.appendChild(node);
    } else {
      target.appendChild(node);
    }
  });
}

function loadScript(src: string, marker: string) {
  if (document.querySelector(`script[data-sellora-inject="${marker}"]`)) return;
  const s = document.createElement("script");
  s.src = src;
  s.async = true;
  s.setAttribute("data-sellora-inject", marker);
  document.head.appendChild(s);
}

/**
 * Injects store-owner analytics & custom code into the live storefront.
 * Runs once on mount; skipped during owner preview so editing doesn't pollute
 * the owner's own analytics.
 */
export function StoreScripts({ ga, pixel, headCode, bodyCode, enabled = true }: Props) {
  useEffect(() => {
    if (!enabled) return;
    // Guard against double-injection across remounts.
    if ((window as unknown as { __selloraScripts?: boolean }).__selloraScripts) return;
    (window as unknown as { __selloraScripts?: boolean }).__selloraScripts = true;

    // Google Analytics 4
    if (ga && /^G-[A-Z0-9]+$/i.test(ga)) {
      loadScript(`https://www.googletagmanager.com/gtag/js?id=${ga}`, "ga-lib");
      const init = document.createElement("script");
      init.setAttribute("data-sellora-inject", "ga-init");
      init.textContent =
        `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`;
      document.head.appendChild(init);
    }

    // Meta (Facebook) Pixel
    if (pixel && /^\d+$/.test(pixel)) {
      const fb = document.createElement("script");
      fb.setAttribute("data-sellora-inject", "meta-pixel");
      fb.textContent =
        `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?` +
        `n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;` +
        `n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;` +
        `t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}` +
        `(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');` +
        `fbq('init','${pixel}');fbq('track','PageView');`;
      document.head.appendChild(fb);
    }

    // Raw custom code
    if (headCode) injectRaw(document.head, headCode, "head-code");
    if (bodyCode) injectRaw(document.body, bodyCode, "body-code");
  }, [enabled, ga, pixel, headCode, bodyCode]);

  return null;
}

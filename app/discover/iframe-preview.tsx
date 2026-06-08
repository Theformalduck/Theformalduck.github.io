"use client";

import { useRef, useState, useEffect } from "react";

// Scaled, non-interactive live preview of a page (used for portfolios that don't
// use the canvas editor — we render the real public page in a clipped iframe).
export function IframePreview({ src, height = 184, baseWidth = 1440 }: {
  src: string; height?: number; baseWidth?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(height / 900);

  useEffect(() => {
    const update = () => {
      if (ref.current) {
        const w = ref.current.offsetWidth;
        if (w > 0) setScale(w / baseWidth);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, [baseWidth]);

  return (
    <div ref={ref} style={{ width: "100%", height, overflow: "hidden", position: "relative", background: "#f3f4f6" }}>
      <iframe
        src={src}
        loading="lazy"
        scrolling="no"
        tabIndex={-1}
        aria-hidden
        style={{
          width: baseWidth,
          height: 1100,
          border: "none",
          transformOrigin: "top left",
          transform: `scale(${scale})`,
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { Bold, Italic, Underline, List, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Lightweight rich-text editor (contentEditable + execCommand) for short
 * formatted content like a newsletter body. Uncontrolled: it reports HTML via
 * onChange but isn't re-written from props, so the cursor never jumps. Remount
 * it with a `key` to reset/clear.
 */
export function RichTextEditor({
  initialHtml = "",
  onChange,
  placeholder,
  className,
}: {
  initialHtml?: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Load the starting HTML exactly once, imperatively. We deliberately do NOT
  // use `dangerouslySetInnerHTML`: under React 19 that keeps the contentEditable
  // node "React-managed", so React re-commits it on parent re-renders (every
  // keystroke updates the parent's value) and ends up swallowing typed input /
  // resetting the caret. Setting innerHTML by hand on mount leaves the DOM fully
  // uncontrolled. Remount with a `key` to load new content or clear it.
  useEffect(() => {
    if (ref.current && initialHtml) ref.current.innerHTML = initialHtml;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const emit = () => onChange(ref.current?.innerHTML ?? "");

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  };

  const addLink = () => {
    const url = window.prompt("Link URL (https://…)");
    if (url) exec("createLink", url.trim());
  };

  const Btn = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()} // keep the editor selection
      onClick={onClick}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
    >
      {children}
    </button>
  );

  return (
    <div className={cn("rounded-xl border border-gray-200 bg-gray-50 overflow-hidden focus-within:ring-2 focus-within:ring-nexus-500", className)}>
      <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-gray-200 bg-white">
        <Btn onClick={() => exec("bold")} title="Bold"><Bold className="w-4 h-4" /></Btn>
        <Btn onClick={() => exec("italic")} title="Italic"><Italic className="w-4 h-4" /></Btn>
        <Btn onClick={() => exec("underline")} title="Underline"><Underline className="w-4 h-4" /></Btn>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <Btn onClick={() => exec("insertUnorderedList")} title="Bullet list"><List className="w-4 h-4" /></Btn>
        <Btn onClick={addLink} title="Add link"><Link2 className="w-4 h-4" /></Btn>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        data-placeholder={placeholder}
        className="min-h-[170px] max-h-[360px] overflow-y-auto px-3 py-2.5 text-sm text-gray-900 outline-none leading-relaxed
          [&_a]:text-nexus-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
          empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none"
      />
    </div>
  );
}

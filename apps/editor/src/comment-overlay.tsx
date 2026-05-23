import { useCallback, useRef, useState, useEffect, type ReactNode } from "react";
import type { CommentAnchor } from "./comment-state.js";
import { useCommentState } from "./comment-state.js";
import { CommentBox } from "./comment-box.js";
import type { PlanSource } from "./grep-source.js";

type CommentTarget = {
  anchor: CommentAnchor;
  position: { x: number; y: number };
} | null;

type CommentOverlayProps = {
  children: ReactNode;
  planFile: string;
};

export function CommentOverlay({ children, planFile }: CommentOverlayProps) {
  const { mode } = useCommentState();
  const [target, setTarget] = useState<CommentTarget>(null);
  const [source, setSource] = useState<PlanSource | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mode) return;
    const slug = planFile.replace(/\.mdx$/, "");
    import(/* @vite-ignore */ `/__plannar/plan-source/${slug}.js`)
      .then((m) => setSource({ source: m.source, lines: m.lines }))
      .catch(() => setSource(null));
  }, [mode, planFile]);

  useEffect(() => {
    if (!mode || !overlayRef.current) return;
    const container = overlayRef.current;
    const els = container.querySelectorAll("[data-commentable]");
    for (const el of els) el.classList.remove("plannar-section-highlight");

    const headings = container.querySelectorAll(
      "h1[data-commentable], h2[data-commentable], h3[data-commentable], h4[data-commentable], h5[data-commentable], h6[data-commentable]",
    );
    for (const heading of headings) {
      const level = parseInt(heading.tagName[1]);
      let next: Element | null = heading.nextElementSibling;
      while (next) {
        if (/^H[1-6]$/.test(next.tagName) && parseInt(next.tagName[1]) <= level) break;
        next.classList.add("plannar-section-highlight");
        next = next.nextElementSibling;
      }
    }
  }, [mode]);

  const handleMouseUp = useCallback(() => {
    if (!mode) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const text = sel.toString().trim();
    if (!text) return;

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setTarget({
      anchor: { type: "text", text },
      position: { x: rect.left + rect.width / 2, y: rect.bottom + 8 },
    });

    sel.removeAllRanges();
  }, [mode]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!mode) return;

      const el = (e.target as HTMLElement).closest("[data-commentable]") as HTMLElement | null;
      if (!el) return;

      const tag = el.dataset.commentable || "element";
      const text = el.textContent?.replace(/\s+/g, " ").trim() || el.dataset.commentableText || "";

      clearHighlights();
      if (tag === "heading") {
        highlightSection(el);
      }

      const rect = el.getBoundingClientRect();

      setTarget({
        anchor: { type: "element", tag, text },
        position: { x: rect.left + rect.width / 2, y: rect.bottom + 8 },
      });
    },
    [mode],
  );

  const closeBox = useCallback(() => {
    setTarget(null);
    clearHighlights();
  }, []);

  return (
    <div
      ref={overlayRef}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      className={mode ? "cursor-crosshair" : undefined}
    >
      {children}
      {target && (
        <CommentBox
          anchor={target.anchor}
          position={target.position}
          file={planFile}
          source={source}
          onClose={closeBox}
        />
      )}
    </div>
  );
}

function clearHighlights() {
  for (const el of document.querySelectorAll(".plannar-section-selected")) {
    el.classList.remove("plannar-section-selected");
  }
}

function highlightSection(heading: Element) {
  heading.classList.add("plannar-section-selected");
  const level = parseInt(heading.tagName[1]);
  let next: Element | null = heading.nextElementSibling;
  while (next) {
    if (/^H[1-6]$/.test(next.tagName) && parseInt(next.tagName[1]) <= level) break;
    next.classList.add("plannar-section-selected");
    next = next.nextElementSibling;
  }
}

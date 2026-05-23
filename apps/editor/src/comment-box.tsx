import { useState, useRef, useEffect, useCallback } from "react";
import { Send, X } from "lucide-react";
import { Textarea } from "./components/ui/textarea.js";
import { useCommentState, type CommentAnchor } from "./comment-state.js";
import { findLineRange, type PlanSource } from "./grep-source.js";
import { cn } from "./lib/utils.js";

type CommentBoxProps = {
  anchor: CommentAnchor;
  position: { x: number; y: number };
  file: string;
  source: PlanSource | null;
  onClose: () => void;
};

export function CommentBox({ anchor, position, file, source, onClose }: CommentBoxProps) {
  const { addComment } = useCommentState();
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleSubmit = useCallback(() => {
    if (!text.trim()) return;
    const range = source ? findLineRange(anchor, source) : null;
    addComment(anchor, text, file, range?.start, range?.end);
    onClose();
  }, [text, anchor, file, source, addComment, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        handleSubmit();
      }
    },
    [onClose, handleSubmit],
  );

  const quoted =
    anchor.type === "text"
      ? anchor.text.length > 100
        ? anchor.text.slice(0, 97) + "..."
        : anchor.text
      : anchor.text;

  return (
    <div
      ref={boxRef}
      className="fixed z-50 w-80 rounded-xl border border-border bg-popover p-3.5 text-sm shadow-lg ring-1 ring-foreground/5"
      style={{
        left: Math.min(position.x, window.innerWidth - 340),
        top: Math.min(position.y, window.innerHeight - 200),
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {anchor.type === "text" ? "Commenting on selected text" : `Commenting on ${anchor.tag}`}
        </span>
        <button
          onClick={onClose}
          className="inline-flex size-5 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-3" />
        </button>
      </div>

      <div className="mb-3 rounded-md border-l-2 border-primary/30 bg-muted/50 px-2.5 py-1.5 text-xs italic text-muted-foreground">
        &ldquo;{quoted}&rdquo;
      </div>

      <Textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="Type your comment..."
        className="mb-2.5 min-h-12 text-xs"
      />

      <div className="flex items-center justify-end">
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className={cn(
            "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
            text.trim()
              ? "bg-primary text-primary-foreground hover:bg-primary/80"
              : "bg-muted text-muted-foreground cursor-not-allowed",
          )}
        >
          <Send className="size-3" />
          Submit
        </button>
      </div>
    </div>
  );
}

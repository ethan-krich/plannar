import { MessageSquarePlus, MessageSquare } from "lucide-react";
import { useCommentState } from "./comment-state.js";
import { cn } from "./lib/utils.js";

export function CommentToggle() {
  const { mode, toggleMode, comments } = useCommentState();

  return (
    <button
      onClick={toggleMode}
      title={mode ? "Exit comment mode" : "Enter comment mode"}
      aria-label={mode ? "Exit comment mode" : "Enter comment mode"}
      className={cn(
        "fixed bottom-6 right-6 z-40 inline-flex size-10 items-center justify-center rounded-xl border bg-background shadow-lg transition-all hover:scale-105 active:scale-95",
        mode
          ? "border-primary/40 bg-primary/10 text-primary ring-2 ring-primary/20"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {mode ? <MessageSquare className="size-4.5" /> : <MessageSquarePlus className="size-4.5" />}
      {comments.length > 0 && (
        <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
          {comments.length}
        </span>
      )}
    </button>
  );
}

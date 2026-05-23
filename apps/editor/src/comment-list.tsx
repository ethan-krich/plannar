import { useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { useCommentState } from "./comment-state.js";
import { cn } from "./lib/utils.js";

export function CommentList() {
  const { mode, comments, removeComment, editComment } = useCommentState();

  if (!mode || comments.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-6 z-40 w-80 max-h-[50vh] overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
      <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-3.5 py-2.5 rounded-t-xl">
        <span className="text-xs font-medium text-foreground">Comments ({comments.length})</span>
      </div>
      <div className="space-y-1 p-2">
        {comments.map((c) => (
          <CommentItem key={c.id} comment={c} onRemove={removeComment} onEdit={editComment} />
        ))}
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  onRemove,
  onEdit,
}: {
  comment: ReturnType<typeof useCommentState>["comments"][number];
  onRemove: (id: string) => void;
  onEdit: (id: string, content: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  const quoted =
    comment.anchor.type === "text"
      ? comment.anchor.text.length > 60
        ? comment.anchor.text.slice(0, 57) + "..."
        : comment.anchor.text
      : comment.anchor.text;

  return (
    <div className="rounded-lg border border-border bg-background p-2.5 text-sm">
      <div className="mb-1 flex items-center gap-1.5">
        {comment.line && (
          <span className="inline-flex h-4 items-center rounded border border-border px-1 text-[9px] font-mono text-muted-foreground">
            {comment.lineEnd && comment.lineEnd > comment.line
              ? `L${comment.line}-${comment.lineEnd}`
              : `L${comment.line}`}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground truncate">{comment.file}</span>
      </div>
      <div className="mb-1.5 rounded border-l-2 border-primary/30 bg-muted/50 px-2 py-1 text-[11px] italic text-muted-foreground leading-snug">
        &ldquo;{quoted}&rdquo;
      </div>

      {editing ? (
        <div className="space-y-1.5">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full rounded border border-input bg-background px-2 py-1 text-[11px] outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
            rows={2}
          />
          <div className="flex gap-1">
            <button
              onClick={() => {
                onEdit(comment.id, editText);
                setEditing(false);
              }}
              disabled={!editText.trim()}
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] transition-colors",
                editText.trim()
                  ? "bg-primary text-primary-foreground hover:bg-primary/80"
                  : "bg-muted text-muted-foreground",
              )}
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditText(comment.content);
                setEditing(false);
              }}
              className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-[11px] text-foreground leading-snug">{comment.content}</p>
          <div className="mt-1.5 flex gap-1">
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Pencil className="size-2.5" />
              Edit
            </button>
            <button
              onClick={() => onRemove(comment.id)}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-2.5" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

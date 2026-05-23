import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { toast } from "sonner";

export type CommentAnchor =
  | { type: "text"; text: string }
  | { type: "element"; tag: string; text: string };

export type Comment = {
  id: string;
  anchor: CommentAnchor;
  content: string;
  file: string;
  line: number | null;
  lineEnd: number | null;
  timestamp: number;
};

type CommentContextType = {
  mode: boolean;
  toggleMode: () => void;
  comments: Comment[];
  addComment: (
    anchor: CommentAnchor,
    content: string,
    file: string,
    line?: number,
    lineEnd?: number,
  ) => void;
  removeComment: (id: string) => void;
  editComment: (id: string, content: string) => void;
  clearComments: () => void;
};

const CommentContext = createContext<CommentContextType | null>(null);

let nextId = 0;

const TIP_TOAST_ID = "comment-tip";
const TIP_COOKIE = "plannar-comment-tip-seen";

function hasSeenTip(): boolean {
  return document.cookie.includes(`${TIP_COOKIE}=1`);
}

function markTipSeen(): void {
  document.cookie = `${TIP_COOKIE}=1; max-age=31536000; path=/; SameSite=Lax`;
}

export function CommentProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);

  const toggleMode = useCallback(() => {
    setMode((m) => {
      const next = !m;
      if (next) {
        if (!hasSeenTip()) {
          toast("Highlight text or click on a section to comment", {
            id: TIP_TOAST_ID,
            duration: Infinity,
            dismissible: true,
            onDismiss: markTipSeen,
            onAutoClose: markTipSeen,
          });
        }
      } else {
        toast.dismiss(TIP_TOAST_ID);
      }
      return next;
    });
  }, []);

  const addComment = useCallback(
    (anchor: CommentAnchor, content: string, file: string, line?: number, lineEnd?: number) => {
      if (!content.trim()) return;
      toast.dismiss(TIP_TOAST_ID);
      const id = `comment-${++nextId}`;
      setComments((prev) => [
        ...prev,
        {
          id,
          anchor,
          content: content.trim(),
          file,
          line: line ?? null,
          lineEnd: lineEnd ?? null,
          timestamp: Date.now(),
        },
      ]);
      return id;
    },
    [],
  );

  const removeComment = useCallback((id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const editComment = useCallback((id: string, content: string) => {
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, content: content.trim() } : c)));
  }, []);

  const clearComments = useCallback(() => {
    setComments([]);
  }, []);

  return (
    <CommentContext.Provider
      value={{ mode, toggleMode, comments, addComment, removeComment, editComment, clearComments }}
    >
      {children}
    </CommentContext.Provider>
  );
}

export function useCommentState(): CommentContextType {
  const ctx = useContext(CommentContext);
  if (!ctx) throw new Error("useCommentState must be used within CommentProvider");
  return ctx;
}

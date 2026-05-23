import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

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

export function CommentProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);

  const toggleMode = useCallback(() => setMode((m) => !m), []);

  const addComment = useCallback(
    (anchor: CommentAnchor, content: string, file: string, line?: number, lineEnd?: number) => {
      if (!content.trim()) return;
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

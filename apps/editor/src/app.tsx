import { useState, useEffect, useCallback } from "react";
import { TooltipProvider } from "./components/ui/tooltip.js";
import { Toaster } from "./components/ui/sonner.js";
import { CommentProvider, useCommentState } from "./comment-state.js";
import { CommentToggle } from "./comment-toggle.js";
import { CommentList } from "./comment-list.js";
import { generatePrompt } from "./grep-source.js";
import { PlanList } from "./plan-list.js";
import { PlanView } from "./plan-view.js";
import { Check, Copy } from "lucide-react";

function useRoute() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((to: string) => {
    window.history.pushState(null, "", to);
    setPath(to);
  }, []);

  return { path, navigate };
}

function CommentTools() {
  const { mode, comments } = useCommentState();
  const [copied, setCopied] = useState(false);

  const handleCopyPrompt = useCallback(() => {
    const prompt = generatePrompt(comments);
    void navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [comments]);

  if (!mode) return <CommentToggle />;

  return (
    <>
      <CommentToggle />
      <CommentList />
      {comments.length > 0 && (
        <button
          onClick={handleCopyPrompt}
          className="fixed bottom-6 right-20 z-40 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-lg hover:bg-primary/80 transition-colors"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : `Generate prompt (${comments.length})`}
        </button>
      )}
    </>
  );
}

export function App() {
  const { path, navigate } = useRoute();

  const slug = path.slice(1);

  return (
    <TooltipProvider delay={300}>
      <CommentProvider>
        {!slug ? (
          <main className="mdx-content">
            <PlanList navigate={navigate} />
          </main>
        ) : (
          <main className="mdx-content">
            <PlanView slug={slug} navigate={navigate} />
          </main>
        )}
        <CommentTools />
        <Toaster />
      </CommentProvider>
    </TooltipProvider>
  );
}

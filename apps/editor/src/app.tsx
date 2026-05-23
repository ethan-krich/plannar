import { useState, useEffect, useCallback } from "react";
import { TooltipProvider } from "./components/ui/tooltip.js";
import { CommentProvider, useCommentState } from "./comment-state.js";
import { CommentToggle } from "./comment-toggle.js";
import { CommentList } from "./comment-list.js";
import { PromptDialog } from "./prompt-dialog.js";
import { PlanList } from "./plan-list.js";
import { PlanView } from "./plan-view.js";

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
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!mode) return <CommentToggle />;

  return (
    <>
      <CommentToggle />
      <CommentList />
      {comments.length > 0 && (
        <button
          onClick={() => setDialogOpen(true)}
          className="fixed bottom-6 right-20 z-40 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-lg hover:bg-primary/80 transition-colors"
        >
          Generate prompt ({comments.length})
        </button>
      )}
      <PromptDialog open={dialogOpen} onOpenChange={setDialogOpen} />
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
      </CommentProvider>
    </TooltipProvider>
  );
}

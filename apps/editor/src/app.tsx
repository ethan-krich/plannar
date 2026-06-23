import { useState, useEffect, useCallback } from "react";
import { TooltipProvider } from "./components/ui/tooltip.js";
import { Toaster } from "./components/ui/sonner.js";
import { CommentProvider, useCommentState } from "./comment-state.js";
import { CommentToggle } from "./comment-toggle.js";
import { CommentList } from "./comment-list.js";
import { GenerateButton } from "./generate-button.js";
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
  const { mode } = useCommentState();

  if (!mode) return <CommentToggle />;

  return (
    <>
      <CommentToggle />
      <CommentList />
      <GenerateButton />
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

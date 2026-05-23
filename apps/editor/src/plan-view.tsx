import { Suspense, lazy, useMemo, useEffect, useRef } from "react";
import { useCommentState } from "./comment-state.js";
import { CommentOverlay } from "./comment-overlay.js";

interface PlanViewProps {
  slug: string;
  navigate: (to: string) => void;
}

function PlanNotFound({ slug, navigate }: { slug: string; navigate: (to: string) => void }) {
  return (
    <div>
      <h1>Plan not found</h1>
      <p>
        No plan named <code>{slug}</code> found.
      </p>
      <p>
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
        >
          &larr; Back
        </a>
      </p>
    </div>
  );
}

function Loading() {
  return <p>Loading plan...</p>;
}

function createPlanComponent(slug: string, navigate: (to: string) => void) {
  return lazy(() =>
    import(/* @vite-ignore */ `/__plannar/plan/${slug}.js`).catch(() => ({
      default: () => <PlanNotFound slug={slug} navigate={navigate} />,
    })),
  );
}

function clearCommentable(root: HTMLElement) {
  for (const el of root.querySelectorAll("[data-commentable]")) {
    delete (el as HTMLElement).dataset.commentable;
    delete (el as HTMLElement).dataset.commentableText;
  }
}

function MarkCommentable({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { mode } = useCommentState();

  useEffect(() => {
    if (!ref.current) return;
    clearCommentable(ref.current);
    if (!mode) return;
    const headings = ref.current.querySelectorAll("h1, h2, h3, h4, h5, h6");
    for (const el of headings) {
      (el as HTMLElement).dataset.commentable = "heading";
      (el as HTMLElement).dataset.commentableText = el.textContent?.slice(0, 120) || "";
    }
    const codeBlocks = ref.current.querySelectorAll("figure[data-rehype-pretty-code-figure], pre");
    for (const el of codeBlocks) {
      (el as HTMLElement).dataset.commentable = "code";
      (el as HTMLElement).dataset.commentableText = el.textContent?.slice(0, 120) || "";
    }
    const allChildren = ref.current.querySelectorAll(
      "p, ul, ol, blockquote, table, input, textarea, button, select, label",
    );
    for (const el of allChildren) {
      if ((el as HTMLElement).dataset.commentable) continue;
      (el as HTMLElement).dataset.commentable = "block";
      (el as HTMLElement).dataset.commentableText = el.textContent?.slice(0, 120) || "";
    }
  }, [mode, children]);

  return <div ref={ref}>{children}</div>;
}

export function PlanView({ slug, navigate }: PlanViewProps) {
  const PlanComponent = useMemo(() => createPlanComponent(slug, navigate), [slug, navigate]);

  return (
    <div>
      <p>
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
        >
          &larr; All plans
        </a>
      </p>
      <CommentOverlay planFile={`${slug}.mdx`}>
        <MarkCommentable>
          <Suspense fallback={<Loading />}>
            <PlanComponent />
          </Suspense>
        </MarkCommentable>
      </CommentOverlay>
    </div>
  );
}

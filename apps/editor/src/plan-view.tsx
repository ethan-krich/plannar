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

function MarkCommentable({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { mode } = useCommentState();

  useEffect(() => {
    if (!ref.current || !mode) return;
    const els = ref.current.querySelectorAll(
      "h1, h2, h3, h4, h5, h6, figure[data-rehype-pretty-code-figure], .playground, pre",
    );
    for (const el of els) {
      const tag = el.tagName.toLowerCase();
      let text = el.textContent?.slice(0, 120) || "";
      if (tag.startsWith("h")) {
        (el as HTMLElement).dataset.commentable = "heading";
        (el as HTMLElement).dataset.commentableText = text;
      } else if (el.matches("figure[data-rehype-pretty-code-figure]") || el.tagName === "PRE") {
        (el as HTMLElement).dataset.commentable = "code";
        (el as HTMLElement).dataset.commentableText = text;
      }
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

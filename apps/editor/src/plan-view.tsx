import { Suspense, lazy } from "react";

interface PlanViewProps {
  slug: string;
  navigate: (to: string) => void;
}

function PlanNotFound({ slug }: { slug: string }) {
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
            window.history.pushState(null, "", "/");
            window.dispatchEvent(new PopStateEvent("popstate"));
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

function createPlanComponent(slug: string) {
  return lazy(() =>
    import(/* @vite-ignore */ `/__plannar/plan/${slug}.js`).catch(() => ({
      default: () => <PlanNotFound slug={slug} />,
    })),
  );
}

export function PlanView({ slug }: PlanViewProps) {
  const PlanComponent = createPlanComponent(slug);

  return (
    <div>
      <p>
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState(null, "", "/");
            window.dispatchEvent(new PopStateEvent("popstate"));
          }}
        >
          &larr; All plans
        </a>
      </p>
      <Suspense fallback={<Loading />}>
        <PlanComponent />
      </Suspense>
    </div>
  );
}

import { Suspense, lazy } from "react";

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

export function PlanView({ slug, navigate }: PlanViewProps) {
  const PlanComponent = createPlanComponent(slug, navigate);

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
      <Suspense fallback={<Loading />}>
        <PlanComponent />
      </Suspense>
    </div>
  );
}

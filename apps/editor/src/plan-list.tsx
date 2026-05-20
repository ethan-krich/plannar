import { plans, plansDir } from "virtual:plannar-plans";

interface PlanListProps {
  navigate: (to: string) => void;
}

export function PlanList({ navigate }: PlanListProps) {
  const planList = plans.map((f) => f.replace(/\.mdx$/, ""));

  if (planList.length === 0) {
    return (
      <div>
        <h1>Plannar Editor</h1>
        <p>No plans found in {plansDir}.</p>
        <p>
          Run <code>plannar init</code> to create your first plan.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Plans</h1>
      <ul>
        {planList.map((name) => (
          <li key={name}>
            <a
              href={`/${name}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/${name}`);
              }}
            >
              {name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

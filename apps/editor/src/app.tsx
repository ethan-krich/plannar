import { useState, useEffect, useCallback } from "react";
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

export function App() {
  const { path, navigate } = useRoute();

  const slug = path.slice(1);

  if (!slug) {
    return (
      <main className="mdx-content">
        <PlanList navigate={navigate} />
      </main>
    );
  }

  return (
    <main className="mdx-content">
      <PlanView slug={slug} navigate={navigate} />
    </main>
  );
}

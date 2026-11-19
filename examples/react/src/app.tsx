import type { Placement } from "@zealakit/omniselect-react";

const placement: Placement = "bottom-start";

export function App() {
  return (
    <main className="page" data-placement={placement}>
      <p className="eyebrow">@zealakit/omniselect-react</p>
      <h1>Omniselect examples</h1>
      <p>
        Placeholder page. The Select and Combobox demos arrive with the
        component plans.
      </p>
    </main>
  );
}

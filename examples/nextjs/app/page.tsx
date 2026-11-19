import type { Placement } from "@zealakit/omniselect-react";

const placement: Placement = "bottom-start";

// Server Component shell. Interactive demos land with the component plans.
export default function Page() {
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

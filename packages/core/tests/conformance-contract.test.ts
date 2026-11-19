import { runConformance } from "./conformance/index.ts";
import type { Driver, Mounted, Scenario } from "./conformance/index.ts";

/** Stub driver proving the contract: a button that toggles `aria-expanded`. */
const stub: Driver = {
  mount(scenario: Scenario): Mounted {
    const form = document.createElement("form");
    const button = document.createElement("button");
    button.setAttribute("aria-expanded", "false");
    form.append(button);
    document.body.append(form);
    const calls: { name: string; args: unknown[] }[] = [];
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      calls.push({ name: "onOpenChange", args: [open] });
    });
    return {
      query: (ref) => (ref === "trigger" ? button : null),
      act(step) {
        if (step.type === "click") {
          (step.target === "trigger" ? button : button).dispatchEvent(
            new window.MouseEvent("click", { bubbles: true }),
          );
        }
        if (step.type === "focus") {
          button.focus();
        }
      },
      calls: () => calls,
      formData: () => [],
      value: () => scenario.props?.value ?? null,
      visibleItems: () => [],
      unmount: () => form.remove(),
    };
  },
};

const scenarios: Scenario[] = [
  {
    name: "contract: click toggles aria-expanded and logs the callback",
    primitive: "select",
    callbacks: ["onOpenChange"],
    tree: [{ part: "trigger" }],
    steps: [
      {
        type: "expect",
        expect: { attrs: { trigger: { "aria-expanded": "false" } } },
      },
      { type: "click", target: "trigger" },
      {
        type: "expect",
        expect: {
          attrs: { trigger: { "aria-expanded": "true" } },
          lastCall: { name: "onOpenChange", args: [true] },
          present: ["trigger"],
          absent: ["popover"],
          value: null,
        },
      },
      { type: "focus", target: "trigger" },
      { type: "expect", expect: { active: "trigger" } },
    ],
  },
];

runConformance("stub", stub, scenarios);

import { after } from "node:test";
import type {
  Driver,
  PartNode,
  Scenario,
} from "../../core/tests/conformance/index.ts";
import {
  performSelectDomStep,
  querySelectPart,
  readSelectVisibleItems,
  runConformance,
  comboboxScenarios,
  selectScenarios,
  withCallbacks,
} from "../../core/tests/conformance/index.ts";
import { createSelect } from "../dist/select/index.js";

const tags: Record<string, string> = {
  label: "span",
  control: "div",
  input: "input",
  trigger: "button",
  value: "span",
  clear: "button",
  indicator: "span",
  popover: "div",
  list: "div",
  group: "div",
  groupLabel: "div",
  item: "div",
  itemIndicator: "span",
  empty: "div",
  outside: "button",
};

function build(node: PartNode): Node {
  if (node.part === "itemText") {
    return document.createTextNode(node.text ?? "");
  }
  const element = document.createElement(tags[node.part] as string);
  const kebab = node.part.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  element.setAttribute("data-part", kebab);
  const props = node.props ?? {};
  if (node.part === "item") {
    element.setAttribute("data-value", String(props.value));
    if (props.disabled) element.setAttribute("data-disabled", "");
  }
  if (node.part === "group" && props.disabled) {
    element.setAttribute("data-disabled", "");
  }
  if (node.part === "input") {
    element.setAttribute("type", "text");
  }
  if (node.part === "value") {
    element.textContent = String(props.placeholder ?? "");
  } else if (node.children) {
    for (const child of node.children) element.append(build(child));
  } else if (node.text !== undefined) {
    element.textContent = node.text;
  }
  if (
    node.part === "trigger" ||
    node.part === "clear" ||
    node.part === "outside"
  ) {
    element.setAttribute("type", "button");
  }
  return element;
}

const hiddenAncestor = (element: Element | null): boolean =>
  element?.closest("[hidden]") != null;

const driver: Driver = {
  mount(scenario: Scenario) {
    const calls: { name: string; args: unknown[] }[] = [];
    const props = withCallbacks(scenario, calls);
    const host = document.createElement("div");
    for (const node of scenario.tree) host.append(build(node));
    document.body.append(host);
    const log =
      (name: string) =>
      (...args: unknown[]) =>
        (props[name] as ((...a: unknown[]) => void) | undefined)?.(...args);
    const handle = createSelect(host, {
      defaultValue: (props.defaultValue as string | undefined) ?? null,
      disabled: props.disabled as boolean | undefined,
      required: props.required as boolean | undefined,
      loop: props.loop as boolean | undefined,
      closeOnSelect: props.closeOnSelect as boolean | undefined,
      allowsEmptyCollection: props.allowsEmptyCollection as boolean | undefined,
      onValueChange: log("onValueChange"),
      onOpenChange: log("onOpenChange"),
      onInputChange: log("onInputChange"),
      filter: props.filter as false | undefined,
      openOnFocus: props.openOnFocus as boolean | undefined,
      openOnInput: props.openOnInput as boolean | undefined,
      selectionBehavior: props.selectionBehavior as never,
      autoHighlight: props.autoHighlight as boolean | undefined,
    });
    return {
      query(ref) {
        const element = querySelectPart(host, ref);
        return ref === "clear" ||
          ref.startsWith("group:") ||
          !hiddenAncestor(element)
          ? element
          : null;
      },
      async act(step) {
        if (step.type === "setProps") {
          throw new Error("vanilla has no controlled props");
        }
        performSelectDomStep(host, step);
        await new Promise((resolve) => setTimeout(resolve, 0));
      },
      calls: () => calls,
      formData: () => [],
      value: () => handle.getValue(),
      visibleItems: () =>
        readSelectVisibleItems(host).filter((key) => {
          const element = querySelectPart(host, `item:${key}`);
          return !hiddenAncestor(element);
        }),
      unmount: () => {
        handle.destroy();
        host.remove();
        for (const leftover of Array.from(
          document.querySelectorAll("[data-part=popover]"),
        )) {
          leftover.remove();
        }
      },
    };
  },
};

after(() => {
  document.body.replaceChildren();
});
runConformance("vanilla", driver, selectScenarios);
runConformance("vanilla", driver, comboboxScenarios);

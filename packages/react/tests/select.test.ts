import { after } from "node:test";
import { act, cleanup, render } from "@testing-library/react";
import { createElement as h, type ReactElement, type ReactNode } from "react";
import type {
  Driver,
  PartNode,
  Scenario,
} from "../../core/tests/conformance/index.ts";
import {
  performSelectDomStep,
  readFormData,
  querySelectPart,
  readSelectVisibleItems,
  runConformance,
  comboboxScenarios,
  formScenarios,
  multiScenarios,
  selectScenarios,
  withCallbacks,
} from "../../core/tests/conformance/index.ts";
import { Select } from "../dist/select/index.js";

const components = {
  label: Select.Label,
  control: Select.Control,
  input: Select.Input,
  trigger: Select.Trigger,
  value: Select.Value,
  clear: Select.Clear,
  indicator: Select.Indicator,
  popover: Select.Popover,
  list: Select.List,
  group: Select.Group,
  groupLabel: Select.GroupLabel,
  item: Select.Item,
  itemIndicator: Select.ItemIndicator,
  empty: Select.Empty,
} as const;

function build(node: PartNode, index: number): ReactNode {
  if (node.part === "itemText") {
    return node.text;
  }
  if (node.part === "outside") {
    return h(
      "button",
      { key: index, "data-part": "outside", type: "button" },
      node.text,
    );
  }
  const component = components[node.part as keyof typeof components];
  const children = node.children
    ? node.children.map(build)
    : node.text !== undefined
      ? [node.text]
      : [];
  return h(component as never, { key: index, ...node.props }, ...children);
}

const flush = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const driver: Driver = {
  mount(scenario: Scenario) {
    const calls: { name: string; args: unknown[] }[] = [];
    let props = withCallbacks(scenario, calls);
    const tree = (): ReactElement => {
      const root = h(Select.Root as never, props, ...scenario.tree.map(build));
      return h("div", null, scenario.form ? h("form", null, root) : root);
    };
    const view = render(tree());
    const container = view.container;
    return {
      query: (ref) => querySelectPart(container, ref),
      async act(step) {
        await act(async () => {
          if (step.type === "setProps") {
            props = { ...props, ...step.props };
            view.rerender(tree());
          } else {
            performSelectDomStep(container, step);
          }
        });
        await flush();
      },
      calls: () => calls,
      formData: () => readFormData(container),
      value: () => null,
      visibleItems: () => readSelectVisibleItems(container),
      unmount: () => view.unmount(),
    };
  },
};

after(() => cleanup());
runConformance("react", driver, selectScenarios);
runConformance("react", driver, comboboxScenarios);
runConformance("react", driver, multiScenarios);
runConformance("react", driver, formScenarios);

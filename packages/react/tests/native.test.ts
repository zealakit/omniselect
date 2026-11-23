import { after } from "node:test";
import { act, cleanup, render } from "@testing-library/react";
import { createElement as h, type ReactElement } from "react";
import type { Driver, PartNode, Scenario } from "../../core/tests/conformance/index.ts";
import {
  nativeScenarios,
  performNativeDomStep,
  queryNativePart,
  readFormData,
  readNativeValue,
  runConformance,
  withCallbacks,
} from "../../core/tests/conformance/index.ts";
import { NativeSelect } from "../dist/native/index.js";

const components = {
  label: NativeSelect.Label,
  control: NativeSelect.Control,
  option: NativeSelect.Option,
  optionGroup: NativeSelect.OptionGroup,
  indicator: NativeSelect.Indicator,
} as const;

function build(node: PartNode, index: number): ReactElement {
  const component = components[node.part as keyof typeof components];
  const children = node.children
    ? node.children.map(build)
    : node.text !== undefined
      ? [node.text]
      : [];
  return h(component as never, { key: index, ...node.props }, ...children);
}

const driver: Driver = {
  mount(scenario: Scenario) {
    const calls: { name: string; args: unknown[] }[] = [];
    let props = withCallbacks(scenario, calls);
    const tree = (): ReactElement => {
      const root = h(NativeSelect.Root as never, props, ...scenario.tree.map(build));
      return scenario.form ? h("form", null, root) : root;
    };
    const view = render(tree());
    const container = view.container;
    return {
      query: (ref) => queryNativePart(container, ref),
      async act(step) {
        await act(async () => {
          if (step.type === "setProps") {
            props = { ...props, ...step.props };
            view.rerender(tree());
          } else {
            performNativeDomStep(container, step);
          }
        });
      },
      calls: () => calls,
      formData: () => readFormData(container),
      value: () => readNativeValue(container),
      visibleItems: () => [],
      unmount: () => view.unmount(),
    };
  },
};

after(() => cleanup());
runConformance("react", driver, nativeScenarios);

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
  installIntersectionObserver,
  loadMoreScenarios,
  multiScenarios,
  popoverSearchScenarios,
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
  loadMore: Select.LoadMore,
} as const;

type Extra = { loadMore: Record<string, unknown>; onLoadMore: unknown };

function build(node: PartNode, index: number, extra: Extra): ReactNode {
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
    ? node.children.map((child, i) => build(child, i, extra))
    : node.text !== undefined
      ? [node.text]
      : [];
  const own =
    node.part === "loadMore"
      ? { ...extra.loadMore, onLoadMore: extra.onLoadMore }
      : node.props;
  return h(component as never, { key: index, ...own }, ...children);
}

installIntersectionObserver();

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
      const { onLoadMore, loadMore, ...rootProps } = props as Record<
        string,
        unknown
      >;
      const extra: Extra = {
        loadMore: (loadMore ?? {}) as Record<string, unknown>,
        onLoadMore,
      };
      const root = h(
        Select.Root as never,
        rootProps,
        ...scenario.tree.map((node, i) => build(node, i, extra)),
      );
      return h("div", null, scenario.form ? h("form", null, root) : root);
    };
    const view = render(tree());
    const container = view.container;
    return {
      query: (ref) => querySelectPart(container, ref),
      async act(step) {
        await act(async () => {
          if (step.type === "setProps") {
            const next = { ...step.props } as Record<string, unknown>;
            if (next.loadMore) {
              next.loadMore = {
                ...((props as Record<string, unknown>).loadMore as object),
                ...(next.loadMore as object),
              };
            }
            props = { ...props, ...next };
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
runConformance("react", driver, loadMoreScenarios);
runConformance("react", driver, popoverSearchScenarios);

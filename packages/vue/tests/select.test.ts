import { after } from "node:test";
import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, reactive, type VNode } from "vue";
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
  selectScenarios,
  withCallbacks,
} from "../../core/tests/conformance/index.ts";
import { Select } from "../dist/select/index.js";

const components = {
  label: Select.Label,
  control: Select.Control,
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

function build(node: PartNode, index: number): VNode | string | undefined {
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
    ? () => node.children?.map(build)
    : () => node.text;
  return h(
    component as never,
    { key: index, ...node.props },
    { default: children },
  );
}

const mounted: VueWrapper[] = [];
const settle = async () => {
  for (let i = 0; i < 3; i += 1) {
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
};

const driver: Driver = {
  mount(scenario: Scenario) {
    const calls: { name: string; args: unknown[] }[] = [];
    const rootProps = reactive<Record<string, unknown>>({});
    const apply = (props: Record<string, unknown>) => {
      for (const [key, value] of Object.entries(props)) {
        rootProps[key === "value" ? "modelValue" : key] = value;
      }
    };
    apply(withCallbacks(scenario, calls));
    const Wrapper = defineComponent({
      render: () =>
        h("div", null, [
          h(
            Select.Root as never,
            { ...rootProps },
            { default: () => scenario.tree.map(build) },
          ),
        ]),
    });
    const wrapper = mount(Wrapper, { attachTo: document.body });
    mounted.push(wrapper);
    const container = wrapper.element as HTMLElement;
    return {
      query: (ref) => querySelectPart(container, ref),
      async act(step) {
        if (step.type === "setProps") {
          apply(step.props);
        } else {
          performSelectDomStep(container, step);
        }
        await settle();
      },
      calls: () => calls,
      formData: () => [],
      value: () => null,
      visibleItems: () => readSelectVisibleItems(container),
      unmount: () => wrapper.unmount(),
    };
  },
};

after(() => {
  for (const wrapper of mounted) {
    try {
      wrapper.unmount();
    } catch {}
  }
});
runConformance("vue", driver, selectScenarios);

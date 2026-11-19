import { after } from "node:test";
import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, reactive, type VNode } from "vue";
import type {
  Driver,
  PartNode,
  Scenario,
} from "../../core/tests/conformance/index.ts";
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

function build(node: PartNode, index: number): VNode {
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

const driver: Driver = {
  mount(scenario: Scenario) {
    const calls: { name: string; args: unknown[] }[] = [];
    const base = withCallbacks(scenario, calls);
    const rootProps = reactive<Record<string, unknown>>({});
    const apply = (props: Record<string, unknown>) => {
      for (const [key, value] of Object.entries(props)) {
        rootProps[key === "value" ? "modelValue" : key] = value;
      }
    };
    apply(base);
    const Wrapper = defineComponent({
      render() {
        const root = h(
          NativeSelect.Root as never,
          { ...rootProps },
          {
            default: () => scenario.tree.map(build),
          },
        );
        return scenario.form ? h("form", null, [root]) : root;
      },
    });
    const wrapper = mount(Wrapper, { attachTo: document.body });
    mounted.push(wrapper);
    const container = wrapper.element.parentElement as HTMLElement;
    const root = (): ParentNode => container;
    return {
      query: (ref) => queryNativePart(root(), ref),
      async act(step) {
        if (step.type === "setProps") {
          apply(step.props);
        } else {
          performNativeDomStep(root(), step);
        }
        await nextTick();
        await nextTick();
      },
      calls: () => calls,
      formData: () => readFormData(root()),
      value: () => readNativeValue(root()),
      visibleItems: () => [],
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
runConformance("vue", driver, nativeScenarios);

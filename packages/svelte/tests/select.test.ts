import { flushSync, mount, unmount } from "svelte";
import type { Driver, Scenario } from "../../core/tests/conformance/index.ts";
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
  selectScenarios,
  withCallbacks,
} from "../../core/tests/conformance/index.ts";
import Harness from "./fixtures/select-harness.svelte";

installIntersectionObserver();

const settle = async () => {
  for (let i = 0; i < 3; i += 1) {
    flushSync();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
};

const driver: Driver = {
  async mount(scenario: Scenario) {
    const calls: { name: string; args: unknown[] }[] = [];
    const target = document.createElement("div");
    document.body.append(target);
    const instance = mount(Harness, {
      target,
      props: {
        tree: scenario.tree,
        initial: withCallbacks(scenario, calls),
        form: scenario.form ?? false,
      },
    }) as { setRootProps: (props: Record<string, unknown>) => void };
    await settle();
    return {
      query: (ref) => querySelectPart(target, ref),
      async act(step) {
        if (step.type === "setProps") {
          instance.setRootProps(step.props);
        } else {
          performSelectDomStep(target, step);
        }
        await settle();
      },
      calls: () => calls,
      formData: () => readFormData(target),
      value: () => null,
      visibleItems: () => readSelectVisibleItems(target),
      unmount: () => {
        void unmount(instance);
        target.remove();
      },
    };
  },
};

runConformance("svelte", driver, selectScenarios);
runConformance("svelte", driver, comboboxScenarios);
runConformance("svelte", driver, multiScenarios);
runConformance("svelte", driver, formScenarios);
runConformance("svelte", driver, loadMoreScenarios);

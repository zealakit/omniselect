import { flushSync, mount, unmount } from "svelte";
import type { Driver, Scenario } from "../../core/tests/conformance/index.ts";
import {
  nativeScenarios,
  performNativeDomStep,
  queryNativePart,
  readFormData,
  readNativeValue,
  runConformance,
  withCallbacks,
} from "../../core/tests/conformance/index.ts";
import Harness from "./fixtures/native-harness.svelte";

const driver: Driver = {
  mount(scenario: Scenario) {
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
    flushSync();
    return {
      query: (ref) => queryNativePart(target, ref),
      async act(step) {
        if (step.type === "setProps") {
          instance.setRootProps(step.props);
        } else {
          performNativeDomStep(target, step);
        }
        flushSync();
        await Promise.resolve();
        flushSync();
      },
      calls: () => calls,
      formData: () => readFormData(target),
      value: () => readNativeValue(target),
      visibleItems: () => [],
      unmount: () => {
        void unmount(instance);
        target.remove();
      },
    };
  },
};

runConformance("svelte", driver, nativeScenarios);

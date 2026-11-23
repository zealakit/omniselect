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
import { createNativeSelect } from "../dist/native/index.js";

const defaultKeys = (props: Record<string, unknown>): Set<string> => {
  const value = props.defaultValue;
  if (value === undefined) {
    return new Set();
  }
  return new Set(Array.isArray(value) ? (value as string[]) : [value as string]);
};

function build(node: PartNode, props: Record<string, unknown>): HTMLElement {
  const tag = {
    label: "label",
    control: "select",
    option: "option",
    optionGroup: "optgroup",
    indicator: "span",
  }[node.part] as string;
  const element = document.createElement(tag);
  const own = node.props ?? {};
  if (node.part === "option") {
    const key = own.value === null || own.value === undefined ? "" : String(own.value);
    element.setAttribute("value", key);
    if (own.disabled) {
      element.setAttribute("disabled", "");
    }
    // A disabled placeholder must carry `selected`, or browsers pick the next option.
    const isDefault =
      props.defaultValue !== undefined ? defaultKeys(props).has(key) : own.value === null;
    if (isDefault) {
      element.setAttribute("selected", "");
    }
  } else if (node.part === "optionGroup") {
    element.setAttribute("label", String(own.label));
    if (own.disabled) {
      element.setAttribute("disabled", "");
    }
  } else if (node.part === "control") {
    for (const name of ["name", "required", "disabled"]) {
      if (props[name] !== undefined && props[name] !== false) {
        element.setAttribute(name, props[name] === true ? "" : String(props[name]));
      }
    }
    if (props.multiple) {
      element.setAttribute("multiple", "");
    }
  } else if (node.part === "indicator") {
    element.setAttribute("data-part", "indicator");
  }
  if (node.children) {
    for (const child of node.children) {
      element.append(build(child, props));
    }
  } else if (node.text !== undefined) {
    element.textContent = node.text;
  }
  return element;
}

const driver: Driver = {
  mount(scenario: Scenario) {
    const calls: { name: string; args: unknown[] }[] = [];
    const props = withCallbacks(scenario, calls);
    const host = document.createElement("div");
    const container = scenario.form ? document.createElement("form") : host;
    for (const node of scenario.tree) {
      container.append(build(node, props));
    }
    if (container !== host) {
      host.append(container);
    }
    document.body.append(host);
    const handle = createNativeSelect(container, {
      onValueChange: (value) => {
        (props.onValueChange as ((v: unknown) => void) | undefined)?.(value);
      },
    });
    return {
      query: (ref) => queryNativePart(host, ref),
      async act(step) {
        if (step.type === "setProps") {
          throw new Error("vanilla has no controlled props");
        }
        performNativeDomStep(host, step);
        await Promise.resolve();
      },
      calls: () => calls,
      formData: () => readFormData(host),
      value: () => readNativeValue(host),
      visibleItems: () => [],
      unmount: () => {
        handle.destroy();
        host.remove();
      },
    };
  },
};

runConformance("vanilla", driver, nativeScenarios);

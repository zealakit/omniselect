<script lang="ts">
import { tick, type Snippet } from "svelte";
import type { HTMLSelectAttributes } from "svelte/elements";
import { getNativeContext } from "./context.js";

type Props = Omit<
  HTMLSelectAttributes,
  "value" | "multiple" | "name" | "form" | "required" | "disabled"
> & {
  children?: Snippet;
};
let { children, onchange, oninvalid, ...rest }: Props = $props();

const context = getNativeContext("Control");
const { controller, snapshot } = context;
let element: HTMLSelectElement | undefined = $state();

$effect(() => {
  const select = element;
  const owner = select?.form;
  if (!select || !owner) {
    return;
  }
  const onReset = () => {
    queueMicrotask(() => {
      controller.reset();
      controller.toDom(select);
    });
  };
  owner.addEventListener("reset", onReset);
  return () => owner.removeEventListener("reset", onReset);
});

function handleChange(
  event: Event & { currentTarget: EventTarget & HTMLSelectElement },
) {
  (onchange as ((e: Event) => void) | undefined)?.(event);
  const select = event.currentTarget;
  controller.fromDom(select);
  if (controller.isControlled()) {
    void tick().then(() => controller.toDom(select));
  }
}

const placeholder = $derived(
  !context.props.multiple && controller.selection.isEmpty($snapshot.value),
);
</script>

<select
  id={context.controlId}
  {...rest}
  bind:this={element}
  name={context.props.name}
  form={context.props.form}
  multiple={context.props.multiple}
  required={context.props.required}
  disabled={context.props.disabled}
  autocomplete={context.props.autocomplete as any}
  data-disabled={context.props.disabled ? "" : undefined}
  data-required={context.props.required ? "" : undefined}
  data-invalid={$snapshot.invalid || $snapshot.invalidProp ? "" : undefined}
  aria-invalid={$snapshot.invalid || $snapshot.invalidProp ? "true" : undefined}
  data-placeholder={placeholder ? "" : undefined}
  onchange={handleChange}
  oninvalid={(event) => {
    (oninvalid as ((e: Event) => void) | undefined)?.(event);
    controller.setInvalid(true);
  }}
>
  {@render children?.()}
</select>

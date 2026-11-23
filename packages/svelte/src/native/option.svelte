<script lang="ts" generics="T">
  import { getContext, type Snippet } from "svelte";
  import type { HTMLOptionAttributes } from "svelte/elements";
  import { getNativeContext, GROUP_KEY } from "./context.js";

  type Props = Omit<HTMLOptionAttributes, "value" | "selected"> & {
    /** `null` is the placeholder option (key `""`). */
    value: T | null;
    /** Label used when the option text is not plain text. */
    textValue?: string;
    children?: Snippet;
  };
  let { value, textValue, disabled = false, children, ...rest }: Props = $props();

  const context = getNativeContext("Option");
  const group = getContext<{ readonly disabled: boolean } | undefined>(GROUP_KEY);
  const { controller, snapshot } = context;
  let element: HTMLOptionElement | undefined = $state();

  const key = $derived(controller.keyOf(value));
  const isDisabled = $derived(disabled === true || group?.disabled === true);
  const selected = $derived(
    $snapshot.value !== undefined && controller.selectedKeys().includes(key),
  );

  $effect(() => {
    const node = element;
    if (!node) {
      return;
    }
    return controller.collection.register({
      key,
      value,
      textValue: textValue ?? node.textContent ?? "",
      disabled: isDisabled,
      node,
    });
  });
</script>

<option
  {...rest}
  bind:this={element}
  value={key}
  {selected}
  disabled={isDisabled}
  data-disabled={isDisabled ? "" : undefined}
>
  {@render children?.()}
</option>

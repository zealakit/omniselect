<script lang="ts">
  import { createCompositionGuard, isImeComposing } from "@zealakit/ui-engine/keyboard";
  import type { CompositionGuard } from "@zealakit/ui-engine/keyboard";
  import { onMount, tick } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";
  import { getSelectContext } from "./context.js";

  type Props = Omit<HTMLInputAttributes, "value"> & {
    oninput?: HTMLInputAttributes["oninput"];
  };
  let { oninput, onkeydown, onfocus, onclick, onblur, ...rest }: Props = $props();

  const context = getSelectContext("Input");
  const { machine, snapshot } = context;
  let element: HTMLInputElement | undefined = $state();
  // E30/E31: the engine guard owns composition state for this input.
  let composition: CompositionGuard | null = null;
  const composing = () => composition?.composing ?? false;
  const attrs = $derived.by(() => {
    void $snapshot;
    return machine.attrs.input();
  });
  const text = $derived.by(() => {
    void $snapshot;
    return machine.store.get().inputValue;
  });

  onMount(() => {
    const off = machine.registerInput({
      inPopover: element?.closest('[data-part="popover"]') != null,
    });
    return () => {
      off();
      composition?.destroy();
      composition = null;
    };
  });
  // The input node exists after mount; a separate effect keeps the guard in step.
  $effect(() => {
    if (!element) return;
    const guard = createCompositionGuard(element);
    composition = guard;
    return () => {
      guard.destroy();
      if (composition === guard) composition = null;
    };
  });
  const open = $derived.by(() => {
    void $snapshot;
    return machine.isOpen();
  });
  // Search-in-popover: focus the input as soon as the popover opens.
  $effect(() => {
    // After a tick: the popover's portal moves the node once the popover's own effects have run.
    if (open && element && machine.store.get().inputInPopover) {
      const target = element;
      void tick().then(() => target.focus({ preventScroll: true }));
    }
  });
  $effect(() => {
    context.setInputEl(element ?? null);
    return () => context.setInputEl(null);
  });
  // A controlled parent may reject the text; show the machine's value again.
  $effect(() => {
    if (element && !composing() && element.value !== text) element.value = text;
  });
</script>

<input
  type="text"
  data-part="input"
  {...rest}
  {...attrs}
  disabled={attrs["aria-disabled"] === "true"}
  bind:this={element}
  value={text}
  oninput={(event) => {
    (oninput as ((e: Event) => void) | undefined)?.(event);
    const el = event.currentTarget as HTMLInputElement;
    machine.onInput(el.value, { composing: composing() });
    if (!composing() && el.value !== machine.store.get().inputValue) {
      el.value = machine.store.get().inputValue;
    }
  }}
  oncompositionend={(event) => {
    // The guard tracks the lifecycle; this only commits the IME text.
    machine.onInput((event.currentTarget as HTMLInputElement).value);
  }}
  onkeydown={(event) => {
    (onkeydown as ((e: KeyboardEvent) => void) | undefined)?.(event as KeyboardEvent);
    if (event.defaultPrevented) return;
    const result = machine.onInputKeyDown({
      key: event.key,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      isComposing: isImeComposing(event) || composing() || (composition?.justEnded(event) ?? false),
    });
    if (result.preventDefault) event.preventDefault();
  }}
  onfocus={(event) => {
    (onfocus as ((e: FocusEvent) => void) | undefined)?.(event as FocusEvent);
    machine.onInputFocus();
  }}
  onclick={(event) => {
    (onclick as ((e: MouseEvent) => void) | undefined)?.(event as MouseEvent);
    machine.onInputClick();
  }}
  onblur={(event) => {
    (onblur as ((e: FocusEvent) => void) | undefined)?.(event as FocusEvent);
    machine.onInputBlur();
  }}
/>

import { checkStructure } from "@zealakit/omniselect-core";
import {
  forwardRef,
  type HTMLAttributes,
  type ReactElement,
  type Ref,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useMergedRef } from "../internal/merge-refs.js";
import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect.js";
import { GroupContext, ItemContext, useSelectContext } from "./context.js";
import { reactAttrs, useSnapshot } from "./internal.js";

export type SelectItemProps<T> = Omit<
  HTMLAttributes<HTMLDivElement>,
  "onSelect"
> & {
  value: T;
  disabled?: boolean;
  /** Label used for the Value and type-ahead. Defaults to the item's text. */
  textValue?: string;
  ref?: Ref<HTMLDivElement>;
};

function ItemImpl<T>(
  {
    value,
    disabled = false,
    textValue,
    onClick,
    onPointerMove,
    onPointerDown,
    ...rest
  }: SelectItemProps<T>,
  ref: Ref<HTMLDivElement>,
) {
  const { machine } = useSelectContext("Item");
  const group = useContext(GroupContext);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const mergedRef = useMergedRef(ref, elementRef);
  const valueRef = useRef(value);
  valueRef.current = value;
  const key = machine.itemToKey(value);
  const groupId = group?.groupId ?? null;

  useEffect(() => checkStructure("Item", elementRef.current), []);

  useIsomorphicLayoutEffect(
    () =>
      machine.collection.register({
        key,
        value: valueRef.current,
        textValue: textValue ?? elementRef.current?.textContent?.trim() ?? "",
        disabled,
        groupId,
        node: elementRef.current,
      }),
    [machine, key, textValue, disabled, groupId],
  );

  const snapshot = useSnapshot(machine, (m) => {
    const s = m.store.get();
    return `${m.isSelected(key)}|${s.highlightedKey === key}|${m.collection.get(key)?.disabled}|${s.highlightSource}`;
  });
  const highlightedByKeyboard =
    snapshot.includes("|true|") && snapshot.endsWith("keyboard");
  useEffect(() => {
    if (highlightedByKeyboard) {
      elementRef.current?.scrollIntoView?.({ block: "nearest" });
    }
  }, [highlightedByKeyboard]);

  const attrs = machine.attrs.item(key);
  const itemContext = useMemo(() => ({ key }), [key]);
  return (
    <ItemContext.Provider value={itemContext}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: role=option comes from machine attrs; keyboard handling lives on the trigger (aria-activedescendant) */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: keys are handled by the trigger */}
      <div
        data-part="item"
        {...rest}
        {...reactAttrs(attrs)}
        ref={mergedRef}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          // Keep focus on the trigger/input.
          event.preventDefault();
        }}
        onPointerMove={(event) => {
          onPointerMove?.(event);
          if (event.pointerType !== "touch") {
            machine.highlight(key, "pointer");
          }
        }}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) {
            machine.selectKey(key);
          }
        }}
      />
    </ItemContext.Provider>
  );
}

/** One option. Registers with the Root; exposes `data-highlighted`, `data-selected`, `data-disabled`. */
export const Item = forwardRef(ItemImpl) as <T>(
  props: SelectItemProps<T>,
) => ReactElement | null;

export type SelectItemIndicatorProps = HTMLAttributes<HTMLSpanElement> & {
  /** Keep mounted while unselected (for animated checkmarks). */
  forceMount?: boolean;
};

/** Renders only while its Item is selected. */
export const ItemIndicator = forwardRef<
  HTMLSpanElement,
  SelectItemIndicatorProps
>(function SelectItemIndicator({ forceMount = false, ...rest }, ref) {
  const { machine } = useSelectContext("ItemIndicator");
  const item = useContext(ItemContext);
  if (!item) {
    throw new Error(
      "Select.ItemIndicator must be rendered inside Select.Item.",
    );
  }
  const selected =
    useSnapshot(machine, (m) => String(m.isSelected(item.key))) === "true";
  if (!selected && !forceMount) {
    return null;
  }
  return (
    <span
      data-part="item-indicator"
      {...rest}
      aria-hidden="true"
      data-state={selected ? "checked" : "unchecked"}
      ref={ref}
    />
  );
});

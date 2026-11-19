import {
  forwardRef,
  type SelectHTMLAttributes,
  useCallback,
  useRef,
  useSyncExternalStore,
} from "react";
import { mergeRefs } from "../internal/merge-refs.js";
import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect.js";
import { useNativeContext } from "./context.js";

export type NativeSelectControlProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  | "value"
  | "defaultValue"
  | "multiple"
  | "name"
  | "form"
  | "required"
  | "disabled"
>;

/** The semantic `<select>`. The only focusable element. */
export const Control = forwardRef<HTMLSelectElement, NativeSelectControlProps>(
  function NativeSelectControl({ onChange, onInvalid, ...rest }, ref) {
    const context = useNativeContext("Control");
    const { controller, multiple, controlledKeys, defaultKeys } = context;
    const selectRef = useRef<HTMLSelectElement | null>(null);
    const state = useSyncExternalStore(
      controller.store.subscribe,
      controller.store.get,
      controller.store.get,
    );

    useIsomorphicLayoutEffect(() => {
      const select = selectRef.current;
      const owner = select?.form;
      if (!select || !owner) {
        return;
      }
      const onReset = () => {
        // The browser resets controls after the event; read the result afterwards.
        queueMicrotask(() => {
          controller.reset();
          controller.toDom(select);
        });
      };
      owner.addEventListener("reset", onReset);
      return () => owner.removeEventListener("reset", onReset);
    }, [controller]);

    const handleChange = useCallback(
      (event: React.ChangeEvent<HTMLSelectElement>) => {
        onChange?.(event);
        if (!event.defaultPrevented) {
          controller.fromDom(event.currentTarget);
        }
      },
      [controller, onChange],
    );

    const valueProps =
      controlledKeys === undefined
        ? { defaultValue: multiple ? defaultKeys : defaultKeys[0] }
        : { value: multiple ? controlledKeys : (controlledKeys[0] ?? "") };

    const isPlaceholder =
      !multiple && controller.selection.isEmpty(state.value);

    return (
      <select
        {...rest}
        {...valueProps}
        ref={mergeRefs(ref, selectRef)}
        id={rest.id ?? context.controlId}
        name={context.name}
        form={context.form}
        multiple={multiple}
        required={context.required}
        disabled={context.disabled}
        autoComplete={context.autoComplete}
        data-disabled={context.disabled ? "" : undefined}
        data-required={context.required ? "" : undefined}
        data-invalid={state.invalid || state.invalidProp ? "" : undefined}
        aria-invalid={state.invalid || state.invalidProp ? true : undefined}
        data-placeholder={isPlaceholder ? "" : undefined}
        onChange={handleChange}
        onInvalid={(event) => {
          onInvalid?.(event);
          controller.setInvalid(true);
        }}
      />
    );
  },
);

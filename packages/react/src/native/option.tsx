import {
  forwardRef,
  type OptionHTMLAttributes,
  type ReactElement,
  type Ref,
  useContext,
  useRef,
} from "react";
import { mergeRefs } from "../internal/merge-refs.js";
import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect.js";
import { OptionGroupContext, useNativeContext } from "./context.js";

export type NativeSelectOptionProps<T> = Omit<
  OptionHTMLAttributes<HTMLOptionElement>,
  "value" | "selected"
> & {
  /** `null` is the placeholder option (key `""`). */
  value: T | null;
  /** Label used when the option text is not plain text. */
  textValue?: string;
  ref?: Ref<HTMLOptionElement>;
};

function OptionImpl<T>(
  { value, textValue, disabled, ...rest }: NativeSelectOptionProps<T>,
  ref: Ref<HTMLOptionElement>,
) {
  const context = useNativeContext("Option");
  const group = useContext(OptionGroupContext);
  const elementRef = useRef<HTMLOptionElement | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const key = context.controller.keyOf(value);
  const isDisabled = disabled === true || group.disabled;

  useIsomorphicLayoutEffect(() => {
    const element = elementRef.current;
    return context.controller.collection.register({
      key,
      value: valueRef.current,
      textValue: textValue ?? element?.textContent ?? "",
      disabled: isDisabled,
      node: element,
    });
  }, [context.controller, key, textValue, isDisabled]);

  return (
    <option
      {...rest}
      ref={mergeRefs(ref, elementRef)}
      value={key}
      disabled={isDisabled}
      data-disabled={isDisabled ? "" : undefined}
    />
  );
}

/** `<option>` that registers its value with the Root. */
export const Option = forwardRef(OptionImpl) as <T>(
  props: NativeSelectOptionProps<T>,
) => ReactElement | null;

/** A part is addressed by name: "trigger", "input", "item:apple", "group:fruit". */
export type PartRef = string;

export type Mods = {
  shift?: boolean;
  alt?: boolean;
  ctrl?: boolean;
  meta?: boolean;
};

export type CallLog = { name: string; args: unknown[] };

export type Expectation = {
  /** Attribute snapshot per part. `null` means the attribute must be absent. */
  attrs?: Record<PartRef, Record<string, string | null>>;
  /** The part that owns `document.activeElement` (`null` = none of the parts). */
  active?: PartRef | null;
  present?: PartRef[];
  absent?: PartRef[];
  /** Trimmed `textContent` per part. */
  text?: Record<PartRef, string>;
  /** Exact callback log so far. */
  calls?: CallLog[];
  /** Last callback only. */
  lastCall?: CallLog;
  /** `FormData` entries of the scenario form, in order. */
  formData?: [string, string][];
  /** Current value as the primitive reports it (see `Mounted.value`). */
  value?: unknown;
  /** Visible item keys in order (items that render). */
  visibleItems?: string[];
};

export type Step =
  | { type: "press"; key: string; target?: PartRef; mods?: Mods }
  | { type: "type"; text: string; target?: PartRef }
  | { type: "click"; target: PartRef }
  | { type: "hover"; target: PartRef }
  | { type: "focus"; target: PartRef }
  | { type: "blur"; target?: PartRef }
  | { type: "select"; target: PartRef; values: string[] }
  | { type: "invalid"; target: PartRef }
  | { type: "setProps"; props: Record<string, unknown> }
  | { type: "intersect"; target: PartRef }
  | { type: "resolveLoad" }
  | { type: "submitForm" }
  | { type: "resetForm" }
  | { type: "expect"; expect: Expectation };

export type PartNode = {
  part: string;
  props?: Record<string, unknown>;
  text?: string;
  children?: PartNode[];
};

export type Scenario = {
  name: string;
  primitive: "native" | "select";
  /** Root props. Values are data; see `callbacks` for functions. */
  props?: Record<string, unknown>;
  /** Names of callback props the driver replaces with logging functions. */
  callbacks?: string[];
  /** Wrap the tree in a <form> so FormData and reset steps work. */
  form?: boolean;
  /** Build `itemToKey` as `String(value[keyBy])` (`null` stays `""`). */
  keyBy?: string;
  /** Build `itemToString` as `String(value[labelBy])`. */
  labelBy?: string;
  /** Adapters that cannot express this scenario (documented, not silent). */
  skip?: Partial<Record<"vanilla" | "react" | "vue" | "svelte", string>>;
  tree: PartNode[];
  steps: Step[];
};

export type Mounted = {
  query: (ref: PartRef) => Element | null;
  act: (step: Exclude<Step, { type: "expect" }>) => void | Promise<void>;
  calls: () => CallLog[];
  formData: () => [string, string][];
  value: () => unknown;
  visibleItems: () => string[];
  unmount: () => void;
};

export type Driver = {
  mount: (scenario: Scenario) => Mounted | Promise<Mounted>;
};

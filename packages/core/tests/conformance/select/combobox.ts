import type { PartNode, Scenario } from "../types.ts";

const item = (
  value: string,
  text: string,
  props: Record<string, unknown> = {},
): PartNode => ({
  part: "item",
  props: { value, ...props },
  text,
});

const control: PartNode = {
  part: "control",
  children: [
    { part: "input", props: { placeholder: "Search fruit" } },
    { part: "trigger", children: [{ part: "indicator", text: "▾" }] },
    { part: "clear", text: "×" },
  ],
};

const fruit = (): PartNode[] => [
  item("apple", "Apple"),
  item("banana", "Banana"),
  item("cherry", "Cherry"),
  item("date", "Date"),
];

const popover = (mounted: boolean, ...children: PartNode[]): PartNode => ({
  part: "popover",
  props: mounted ? { forceMount: true } : undefined,
  children: [
    {
      part: "list",
      children: [...children, { part: "empty", text: "No results" }],
    },
  ],
});

const tree = (mounted = false, items: PartNode[] = fruit()): PartNode[] => [
  { part: "label", text: "Fruit" },
  control,
  popover(mounted, ...items),
];

const base = (
  props: Record<string, unknown> = {},
  mounted = false,
): Partial<Scenario> => ({
  primitive: "select",
  props,
  callbacks: ["onValueChange", "onOpenChange", "onInputChange"],
  tree: tree(mounted),
});

export const comboboxScenarios: Scenario[] = [
  {
    ...(base() as Scenario),
    name: "combobox: the input owns the combobox role; the trigger becomes a plain button",
    steps: [
      {
        type: "expect",
        expect: {
          attrs: {
            input: {
              role: "combobox",
              "aria-autocomplete": "list",
              "aria-expanded": "false",
              "aria-controls": null,
              autocomplete: "off",
            },
            trigger: {
              role: null,
              tabindex: "-1",
              "aria-label": "Show options",
              "aria-expanded": "false",
            },
          },
          absent: ["popover"],
        },
      },
    ],
  },
  {
    ...(base() as Scenario),
    name: "typing opens, filters, and highlights the first match; focus stays on the input",
    steps: [
      { type: "focus", target: "input" },
      { type: "fill", text: "an" },
      {
        type: "expect",
        expect: {
          visibleItems: ["banana"],
          attrs: {
            input: {
              "aria-expanded": "true",
              "aria-controls": "@id:list",
              "aria-activedescendant": "@id:item:banana",
            },
            "item:banana": { "data-highlighted": "" },
          },
          active: "input",
          inputValue: "an",
          includesCalls: [{ name: "onInputChange", args: ["an", "input"] }],
        },
      },
    ],
  },
  {
    ...(base() as Scenario),
    name: "typing is diacritic-insensitive",
    tree: tree(false, [item("v", "Việt Nam"), item("u", "Uruguay")]),
    steps: [
      { type: "fill", text: "viet" },
      { type: "expect", expect: { visibleItems: ["v"] } },
    ],
  },
  {
    ...(base() as Scenario),
    name: "Enter selects the highlighted match; the input shows its label",
    steps: [
      { type: "focus", target: "input" },
      { type: "fill", text: "ch" },
      { type: "press", key: "Enter", target: "input" },
      {
        type: "expect",
        expect: {
          absent: ["popover"],
          inputValue: "Cherry",
          calls: [
            { name: "onInputChange", args: ["ch", "input"] },
            { name: "onOpenChange", args: [true, "keyboard"] },
            { name: "onValueChange", args: ["cherry"] },
            { name: "onInputChange", args: ["Cherry", "select"] },
            { name: "onOpenChange", args: [false, "select"] },
          ],
        },
      },
    ],
  },
  {
    ...(base() as Scenario),
    name: "ArrowDown / ArrowUp open and move the highlight",
    steps: [
      { type: "focus", target: "input" },
      { type: "press", key: "ArrowDown", target: "input" },
      {
        type: "expect",
        expect: {
          attrs: { "item:apple": { "data-highlighted": "" } },
          active: "input",
        },
      },
      { type: "press", key: "ArrowDown", target: "input" },
      {
        type: "expect",
        expect: { attrs: { "item:banana": { "data-highlighted": "" } } },
      },
      { type: "press", key: "ArrowUp", target: "input" },
      {
        type: "expect",
        expect: { attrs: { "item:apple": { "data-highlighted": "" } } },
      },
    ],
  },
  {
    ...(base({ defaultValue: "banana" }, true) as Scenario),
    name: "Escape closed clears the input; Escape open closes and restores the label",
    steps: [
      { type: "expect", expect: { inputValue: "Banana" } },
      { type: "focus", target: "input" },
      { type: "press", key: "Escape", target: "input" },
      { type: "expect", expect: { inputValue: "" } },
      { type: "fill", text: "ch" },
      { type: "press", key: "Escape", target: "input" },
      {
        type: "expect",
        expect: {
          inputValue: "Banana",
          attrs: { input: { "aria-expanded": "false" } },
        },
      },
    ],
  },
  {
    ...(base({ defaultValue: "banana" }, true) as Scenario),
    name: "blur without a pick restores the selected label",
    steps: [
      { type: "focus", target: "input" },
      { type: "fill", text: "zz" },
      { type: "blur" },
      {
        type: "expect",
        expect: {
          inputValue: "Banana",
          attrs: { input: { "aria-expanded": "false" } },
        },
      },
    ],
  },
  {
    ...(base({ selectionBehavior: "keep-input" }) as Scenario),
    name: "selectionBehavior keep-input leaves the typed text",
    steps: [
      { type: "fill", text: "ap" },
      { type: "press", key: "Enter", target: "input" },
      {
        type: "expect",
        expect: {
          inputValue: "ap",
          includesCalls: [{ name: "onOpenChange", args: [false, "select"] }],
        },
      },
    ],
  },
  {
    ...(base({ filter: false }) as Scenario),
    name: "filter=false shows every item (manual filtering)",
    steps: [
      { type: "fill", text: "zzz" },
      {
        type: "expect",
        expect: {
          visibleItems: ["apple", "banana", "cherry", "date"],
          absent: ["empty"],
        },
      },
    ],
  },
  {
    ...(base() as Scenario),
    name: "Empty shows when nothing matches",
    steps: [
      { type: "fill", text: "zzz" },
      {
        type: "expect",
        expect: {
          present: ["empty"],
          visibleItems: [],
          text: { empty: "No results" },
        },
      },
    ],
  },
  {
    ...(base() as Scenario),
    name: "a group with no matching items hides itself",
    tree: [
      { part: "label", text: "L" },
      control,
      popover(
        false,
        {
          part: "group",
          children: [
            { part: "groupLabel", text: "Citrus" },
            item("lemon", "Lemon"),
          ],
        },
        item("apple", "Apple"),
      ),
    ],
    steps: [
      { type: "fill", text: "app" },
      {
        type: "expect",
        expect: {
          visibleItems: ["apple"],
          attrs: { "group:first": { hidden: "" } },
        },
      },
      { type: "fill", text: "lem" },
      {
        type: "expect",
        expect: {
          visibleItems: ["lemon"],
          attrs: { "group:first": { hidden: null } },
        },
      },
    ],
  },
  {
    ...(base() as Scenario),
    name: "Space types a space instead of selecting",
    steps: [
      { type: "fill", text: "ap" },
      { type: "press", key: " ", target: "input" },
      { type: "expect", expect: { present: ["popover"], text: {} } },
    ],
  },
  {
    ...(base({ defaultValue: "banana" }, true) as Scenario),
    name: "Clear resets value and input and focuses the input",
    steps: [
      { type: "click", target: "clear" },
      {
        type: "expect",
        expect: {
          inputValue: "",
          active: "input",
          includesCalls: [{ name: "onInputChange", args: ["", "clear"] }],
        },
      },
    ],
  },
  {
    ...(base() as Scenario),
    name: "the trigger toggles the list and focuses the input",
    steps: [
      { type: "click", target: "trigger" },
      { type: "expect", expect: { present: ["popover"], active: "input" } },
      { type: "click", target: "trigger" },
      { type: "expect", expect: { absent: ["popover"] } },
    ],
  },
  {
    ...(base() as Scenario),
    name: "Tab closes without selecting",
    steps: [
      { type: "fill", text: "ap" },
      { type: "press", key: "Tab", target: "input" },
      {
        type: "expect",
        expect: {
          absent: ["popover"],
          includesCalls: [{ name: "onOpenChange", args: [false, "tab"] }],
        },
      },
    ],
  },
  {
    ...(base({ autoHighlight: false }) as Scenario),
    name: "autoHighlight=false leaves nothing highlighted while typing",
    steps: [
      { type: "fill", text: "an" },
      {
        type: "expect",
        expect: {
          visibleItems: ["banana"],
          attrs: { input: { "aria-activedescendant": null } },
        },
      },
    ],
  },
  {
    ...(base({ openOnFocus: true }) as Scenario),
    name: "openOnFocus opens the list when the input gains focus",
    steps: [
      { type: "focus", target: "input" },
      { type: "expect", expect: { present: ["popover"] } },
    ],
  },
  {
    ...(base({ openOnInput: false }) as Scenario),
    name: "openOnInput=false keeps the list closed while typing",
    steps: [
      { type: "fill", text: "an" },
      { type: "expect", expect: { absent: ["popover"], inputValue: "an" } },
    ],
  },
  {
    ...(base({ inputValue: "" }) as Scenario),
    name: "controlled inputValue waits for the parent",
    skip: {
      vanilla: "no controlled mode",
      svelte: "bindable props are overwritten locally",
    },
    steps: [
      { type: "fill", text: "a" },
      {
        type: "expect",
        expect: {
          inputValue: "",
          includesCalls: [{ name: "onInputChange", args: ["a", "input"] }],
        },
      },
      { type: "setProps", props: { inputValue: "a" } },
      { type: "expect", expect: { inputValue: "a" } },
    ],
  },
  {
    ...(base() as Scenario),
    name: "IME: filtering waits for composition to end",
    steps: [
      { type: "compose", text: "an" },
      {
        type: "expect",
        expect: { visibleItems: ["banana"], inputValue: "an" },
      },
    ],
  },
  {
    ...(base() as Scenario),
    name: "clicking the control (not a button) focuses the input and opens the list",
    steps: [
      { type: "click", target: "control" },
      { type: "expect", expect: { present: ["popover"], active: "input" } },
    ],
  },
];

const searchItems = (): PartNode[] => [
  item("apple", "Apple"),
  item("banana", "Banana"),
  item("cherry", "Cherry"),
  item("date", "Date"),
];

const searchTree = (): PartNode[] => [
  { part: "label", text: "Fruit" },
  {
    part: "control",
    children: [
      {
        part: "trigger",
        children: [
          { part: "value", props: { placeholder: "Pick a fruit" } },
          { part: "indicator", text: "▾" },
        ],
      },
    ],
  },
  {
    part: "popover",
    props: { forceMount: undefined },
    children: [
      { part: "input", props: { placeholder: "Search" } },
      {
        part: "list",
        children: [...searchItems(), { part: "empty", text: "No results" }],
      },
    ],
  },
];

const search = (props: Record<string, unknown> = {}): Scenario =>
  ({
    primitive: "select",
    props,
    callbacks: ["onValueChange", "onOpenChange"],
    tree: searchTree(),
  }) as unknown as Scenario;

/** Search input inside the popover (the trigger stays a plain select control). */
export const popoverSearchScenarios: Scenario[] = [
  {
    ...search(),
    name: "popover search: opening focuses the input; the trigger stays a labelled button",
    steps: [
      {
        type: "expect",
        expect: {
          absent: ["popover", "input"],
          attrs: { trigger: { role: "combobox" } },
        },
      },
      { type: "click", target: "trigger" },
      {
        type: "expect",
        expect: {
          present: ["popover", "input"],
          active: "input",
          attrs: {
            trigger: {
              role: null,
              "aria-expanded": "true",
              "aria-label": null,
            },
            input: {
              role: "combobox",
              "aria-autocomplete": "list",
              "aria-controls": "@id:list",
            },
          },
        },
      },
    ],
  },
  {
    ...search(),
    name: "popover search: typing filters, arrows and Enter pick, focus returns to the trigger, the box resets",
    steps: [
      { type: "click", target: "trigger" },
      { type: "fill", text: "an" },
      {
        type: "expect",
        expect: {
          visibleItems: ["banana"],
          attrs: { input: { "aria-activedescendant": "@id:item:banana" } },
          active: "input",
        },
      },
      { type: "press", key: "Enter", target: "input" },
      {
        type: "expect",
        expect: {
          absent: ["popover"],
          text: { value: "Banana" },
          active: "trigger",
          attrs: { trigger: { role: "combobox", "aria-expanded": "false" } },
          includesCalls: [{ name: "onValueChange", args: ["banana"] }],
        },
      },
      { type: "click", target: "trigger" },
      {
        type: "expect",
        expect: {
          inputValue: "",
          visibleItems: ["apple", "banana", "cherry", "date"],
          active: "input",
        },
      },
      // Reopening highlights the selected item (Banana); ArrowUp moves to Apple.
      { type: "press", key: "ArrowUp", target: "input" },
      { type: "press", key: "Enter", target: "input" },
      {
        type: "expect",
        expect: { text: { value: "Apple" }, absent: ["popover"] },
      },
    ],
  },
  {
    ...search(),
    name: "popover search: Escape closes, clears the box, and returns focus to the trigger",
    steps: [
      { type: "click", target: "trigger" },
      { type: "fill", text: "zz" },
      { type: "press", key: "Escape", target: "input" },
      { type: "expect", expect: { absent: ["popover"], active: "trigger" } },
      { type: "click", target: "trigger" },
      { type: "expect", expect: { inputValue: "" } },
    ],
  },
  {
    ...search({ multiple: true }),
    name: "popover search + multiple: picks stay in the trigger, the box clears, Backspace does not remove chips",
    steps: [
      { type: "click", target: "trigger" },
      { type: "fill", text: "ap" },
      { type: "press", key: "Enter", target: "input" },
      { type: "fill", text: "ban" },
      { type: "press", key: "Enter", target: "input" },
      {
        type: "expect",
        expect: {
          present: ["popover"],
          inputValue: "",
          text: { value: "Apple, Banana" },
          active: "input",
        },
      },
      { type: "press", key: "Backspace", target: "input" },
      { type: "expect", expect: { text: { value: "Apple, Banana" } } },
    ],
  },
];

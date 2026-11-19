import type { PartNode, Scenario } from "../types.ts";

const item = (
  value: unknown,
  text: string,
  props: Record<string, unknown> = {},
): PartNode => ({
  part: "item",
  props: { value, ...props },
  text,
  children: undefined,
});

/** Item whose children include an ItemIndicator. */
const itemWithIndicator = (value: string, text: string): PartNode => ({
  part: "item",
  props: { value },
  children: [
    { part: "itemText", text },
    { part: "itemIndicator", text: "✓" },
  ],
});

const trigger: PartNode = {
  part: "control",
  children: [
    {
      part: "trigger",
      children: [
        { part: "value", props: { placeholder: "Pick a fruit" } },
        { part: "indicator", text: "▾" },
      ],
    },
    { part: "clear", text: "×" },
  ],
};

const popover = (...children: PartNode[]): PartNode => ({
  part: "popover",
  children: [{ part: "list", children }],
});

/** Items stay registered while closed, so labels and closed type-ahead work. */
const mountedPopover = (...children: PartNode[]): PartNode => ({
  part: "popover",
  props: { forceMount: true },
  children: [{ part: "list", children }],
});

const fruitItems = (): PartNode[] => [
  item("apple", "Apple"),
  item("banana", "Banana"),
  item("cherry", "Cherry", { disabled: true }),
  item("date", "Date"),
];

const basic: PartNode[] = [
  { part: "label", text: "Fruit" },
  trigger,
  popover(...fruitItems()),
];
const basicMounted: PartNode[] = [
  { part: "label", text: "Fruit" },
  trigger,
  mountedPopover(...fruitItems()),
];

const open = (props: Record<string, unknown> = {}): Partial<Scenario> => ({
  primitive: "select",
  props,
  callbacks: ["onValueChange", "onOpenChange"],
  tree: basic,
});

export const selectScenarios: Scenario[] = [
  {
    ...(open() as Scenario),
    name: "closed: select-only combobox ARIA, placeholder, no popover",
    steps: [
      {
        type: "expect",
        expect: {
          attrs: {
            trigger: {
              role: "combobox",
              "aria-haspopup": "listbox",
              "aria-expanded": "false",
              "aria-controls": null,
              "aria-activedescendant": null,
              "data-state": "closed",
              "data-placeholder": "",
            },
            value: { "data-placeholder": "" },
            indicator: { "aria-hidden": "true", "data-state": "closed" },
          },
          text: { value: "Pick a fruit", label: "Fruit" },
          absent: ["popover", "list"],
          calls: [],
        },
      },
    ],
  },
  {
    ...(open() as Scenario),
    name: "click opens: listbox ARIA, nothing highlighted, focus stays",
    steps: [
      { type: "click", target: "trigger" },
      {
        type: "expect",
        expect: {
          attrs: {
            trigger: {
              "aria-expanded": "true",
              "aria-controls": "@id:list",
              "aria-activedescendant": null,
              "data-state": "open",
            },
            list: { role: "listbox" },
            "item:apple": {
              role: "option",
              "aria-selected": "false",
              "data-highlighted": null,
            },
            "item:cherry": { "aria-disabled": "true", "data-disabled": "" },
          },
          present: ["popover", "list"],
          visibleItems: ["apple", "banana", "cherry", "date"],
          lastCall: { name: "onOpenChange", args: [true, "trigger"] },
        },
      },
    ],
  },
  {
    ...(open() as Scenario),
    name: "ArrowDown opens on the first item; focus stays on the trigger",
    steps: [
      { type: "focus", target: "trigger" },
      { type: "press", key: "ArrowDown" },
      {
        type: "expect",
        expect: {
          attrs: {
            trigger: {
              "aria-expanded": "true",
              "aria-activedescendant": "@id:item:apple",
            },
            "item:apple": { "data-highlighted": "" },
          },
          active: "trigger",
          lastCall: { name: "onOpenChange", args: [true, "keyboard"] },
        },
      },
    ],
  },
  {
    ...(open() as Scenario),
    name: "ArrowUp opens on the last enabled item",
    steps: [
      { type: "press", key: "ArrowUp" },
      {
        type: "expect",
        expect: { attrs: { "item:date": { "data-highlighted": "" } } },
      },
    ],
  },
  {
    ...(open() as Scenario),
    name: "arrows skip disabled; Enter selects and closes; focus on trigger",
    steps: [
      { type: "focus", target: "trigger" },
      { type: "press", key: "ArrowDown" },
      { type: "press", key: "ArrowDown" },
      {
        type: "expect",
        expect: { attrs: { "item:banana": { "data-highlighted": "" } } },
      },
      { type: "press", key: "ArrowDown" },
      {
        type: "expect",
        expect: { attrs: { "item:date": { "data-highlighted": "" } } },
      },
      { type: "press", key: "Home" },
      {
        type: "expect",
        expect: { attrs: { "item:apple": { "data-highlighted": "" } } },
      },
      { type: "press", key: "End" },
      {
        type: "expect",
        expect: { attrs: { "item:date": { "data-highlighted": "" } } },
      },
      { type: "press", key: "ArrowUp" },
      { type: "press", key: "Enter" },
      {
        type: "expect",
        expect: {
          absent: ["popover"],
          text: { value: "Banana" },
          attrs: {
            trigger: { "aria-expanded": "false", "data-placeholder": null },
          },
          active: "trigger",
          calls: [
            { name: "onOpenChange", args: [true, "keyboard"] },
            { name: "onValueChange", args: ["banana"] },
            { name: "onOpenChange", args: [false, "select"] },
          ],
        },
      },
    ],
  },
  {
    ...(open({ defaultValue: "banana" }) as Scenario),
    name: "reopening highlights the selected item; selected item has aria-selected",
    tree: basicMounted,
    steps: [
      { type: "press", key: "ArrowDown" },
      {
        type: "expect",
        expect: {
          attrs: {
            "item:banana": {
              "data-highlighted": "",
              "aria-selected": "true",
              "data-selected": "",
              "data-state": "checked",
            },
            "item:apple": {
              "aria-selected": "false",
              "data-state": "unchecked",
            },
          },
          text: { value: "Banana" },
        },
      },
    ],
  },
  {
    ...(open() as Scenario),
    name: "Escape closes without changing the value; focus returns to the trigger",
    steps: [
      { type: "focus", target: "trigger" },
      { type: "press", key: "ArrowDown" },
      { type: "press", key: "Escape" },
      {
        type: "expect",
        expect: {
          absent: ["popover"],
          active: "trigger",
          text: { value: "Pick a fruit" },
          lastCall: { name: "onOpenChange", args: [false, "escape"] },
        },
      },
    ],
  },
  {
    ...(open() as Scenario),
    name: "Tab selects the highlighted item and closes",
    steps: [
      { type: "press", key: "ArrowDown" },
      { type: "press", key: "Tab" },
      {
        type: "expect",
        expect: {
          absent: ["popover"],
          text: { value: "Apple" },
          lastCall: { name: "onOpenChange", args: [false, "tab"] },
        },
      },
    ],
  },
  {
    ...(open() as Scenario),
    name: "type-ahead selects while closed without opening (items stay mounted)",
    tree: basicMounted,
    steps: [
      { type: "type", text: "b" },
      {
        type: "expect",
        expect: {
          text: { value: "Banana" },
          attrs: { trigger: { "aria-expanded": "false" } },
          lastCall: { name: "onValueChange", args: ["banana"] },
        },
      },
    ],
  },
  {
    ...(open() as Scenario),
    name: "type-ahead highlights while open",
    steps: [
      { type: "press", key: "ArrowDown" },
      { type: "type", text: "d" },
      {
        type: "expect",
        expect: {
          attrs: { "item:date": { "data-highlighted": "" } },
          text: { value: "Pick a fruit" },
        },
      },
    ],
  },
  {
    ...(open() as Scenario),
    name: "click on an item selects it and closes",
    steps: [
      { type: "click", target: "trigger" },
      { type: "click", target: "item:banana" },
      {
        type: "expect",
        expect: {
          absent: ["popover"],
          text: { value: "Banana" },
          active: "trigger",
          lastCall: { name: "onOpenChange", args: [false, "select"] },
        },
      },
    ],
  },
  {
    ...(open() as Scenario),
    name: "disabled item cannot be selected by click",
    steps: [
      { type: "click", target: "trigger" },
      { type: "click", target: "item:cherry" },
      {
        type: "expect",
        expect: { present: ["popover"], text: { value: "Pick a fruit" } },
      },
    ],
  },
  {
    ...(open() as Scenario),
    name: "pointer move highlights an item",
    steps: [
      { type: "click", target: "trigger" },
      { type: "hover", target: "item:banana" },
      {
        type: "expect",
        expect: {
          attrs: {
            "item:banana": { "data-highlighted": "" },
            trigger: { "aria-activedescendant": "@id:item:banana" },
          },
        },
      },
    ],
  },
  {
    ...(open() as Scenario),
    name: "outside press closes without moving focus",
    tree: [...basic, { part: "outside", text: "outside" }],
    steps: [
      { type: "click", target: "trigger" },
      { type: "click", target: "outside" },
      {
        type: "expect",
        expect: {
          absent: ["popover"],
          lastCall: { name: "onOpenChange", args: [false, "outside"] },
        },
      },
    ],
  },
  {
    ...(open() as Scenario),
    name: "clicking the trigger again closes",
    steps: [
      { type: "click", target: "trigger" },
      { type: "click", target: "trigger" },
      {
        type: "expect",
        expect: {
          absent: ["popover"],
          lastCall: { name: "onOpenChange", args: [false, "toggle"] },
        },
      },
    ],
  },
  {
    ...(open({ defaultValue: "banana" }) as Scenario),
    name: "Clear resets the value and returns focus to the trigger",
    tree: basicMounted,
    steps: [
      {
        type: "expect",
        expect: {
          attrs: { clear: { "aria-label": "Clear selection", tabindex: "-1" } },
          text: { value: "Banana" },
        },
      },
      { type: "click", target: "clear" },
      {
        type: "expect",
        expect: {
          text: { value: "Pick a fruit" },
          active: "trigger",
          lastCall: { name: "onValueChange", args: [null] },
        },
      },
    ],
  },
  {
    ...(open() as Scenario),
    name: "Clear is hidden while nothing is selected",
    steps: [{ type: "expect", expect: { attrs: { clear: { hidden: "" } } } }],
  },
  {
    ...(open({ defaultValue: "banana" }) as Scenario),
    name: "Backspace on the trigger clears when a Clear is mounted",
    steps: [
      { type: "press", key: "Backspace" },
      { type: "expect", expect: { text: { value: "Pick a fruit" } } },
    ],
  },
  {
    ...(open({ value: "apple", open: false }) as Scenario),
    name: "controlled: rejected change keeps the old value; setProps applies",
    skip: {
      vanilla: "no controlled mode",
      svelte: "bindable props are overwritten locally",
    },
    steps: [
      { type: "click", target: "trigger" },
      {
        type: "expect",
        expect: {
          absent: ["popover"],
          lastCall: { name: "onOpenChange", args: [true, "trigger"] },
        },
      },
      { type: "setProps", props: { open: true } },
      { type: "expect", expect: { present: ["popover"] } },
      { type: "click", target: "item:banana" },
      {
        type: "expect",
        expect: {
          text: { value: "Apple" },
          lastCall: { name: "onOpenChange", args: [false, "select"] },
        },
      },
      { type: "setProps", props: { value: "banana", open: false } },
      {
        type: "expect",
        expect: { text: { value: "Banana" }, absent: ["popover"] },
      },
    ],
  },
  {
    ...(open({ loop: true }) as Scenario),
    name: "loop wraps around at the ends",
    steps: [
      { type: "press", key: "End" },
      { type: "press", key: "ArrowDown" },
      {
        type: "expect",
        expect: { attrs: { "item:apple": { "data-highlighted": "" } } },
      },
    ],
  },
  {
    ...(open({ closeOnSelect: false }) as Scenario),
    name: "closeOnSelect=false keeps the popover open",
    steps: [
      { type: "click", target: "trigger" },
      { type: "click", target: "item:banana" },
      {
        type: "expect",
        expect: { present: ["popover"], text: { value: "Banana" } },
      },
    ],
  },
  {
    ...(open({ disabled: true }) as Scenario),
    name: "disabled: trigger is disabled and does not open",
    steps: [
      { type: "click", target: "trigger" },
      { type: "press", key: "ArrowDown" },
      {
        type: "expect",
        expect: {
          absent: ["popover"],
          attrs: { trigger: { "aria-disabled": "true", "data-disabled": "" } },
          calls: [],
        },
      },
    ],
  },
  {
    ...(open() as Scenario),
    name: "required sets aria-required",
    props: { required: true },
    steps: [
      {
        type: "expect",
        expect: { attrs: { trigger: { "aria-required": "true" } } },
      },
    ],
  },
  {
    ...(open() as Scenario),
    name: "empty collection shows Empty; allowsEmptyCollection=false blocks opening",
    tree: [
      { part: "label", text: "L" },
      trigger,
      {
        part: "popover",
        children: [
          { part: "list", children: [{ part: "empty", text: "No options" }] },
        ],
      },
    ],
    steps: [
      { type: "click", target: "trigger" },
      {
        type: "expect",
        expect: {
          present: ["empty"],
          text: { empty: "No options" },
          attrs: { empty: { role: "option", "aria-disabled": "true" } },
        },
      },
    ],
  },
  {
    ...(open({ allowsEmptyCollection: false }) as Scenario),
    name: "allowsEmptyCollection=false does not open an empty list",
    tree: [
      { part: "label", text: "L" },
      trigger,
      {
        part: "popover",
        children: [
          { part: "list", children: [{ part: "empty", text: "No options" }] },
        ],
      },
    ],
    steps: [
      { type: "click", target: "trigger" },
      { type: "expect", expect: { absent: ["popover", "empty"], calls: [] } },
    ],
  },
  {
    ...(open() as Scenario),
    name: "groups: role group labelled by GroupLabel; group disabled cascades",
    tree: [
      { part: "label", text: "L" },
      trigger,
      popover(
        {
          part: "group",
          props: { disabled: true },
          children: [
            { part: "groupLabel", text: "Berries" },
            item("blueberry", "Blueberry"),
          ],
        },
        item("fig", "Fig"),
      ),
    ],
    steps: [
      { type: "click", target: "trigger" },
      {
        type: "expect",
        expect: {
          attrs: {
            "group:first": {
              role: "group",
              "aria-labelledby": "@id:groupLabel",
            },
            "item:blueberry": { "aria-disabled": "true" },
          },
          text: { groupLabel: "Berries" },
        },
      },
    ],
  },
  {
    ...(open({ defaultValue: "banana" }) as Scenario),
    name: "ItemIndicator renders only inside the selected item",
    tree: [
      { part: "label", text: "L" },
      trigger,
      popover(
        itemWithIndicator("apple", "Apple"),
        itemWithIndicator("banana", "Banana"),
      ),
    ],
    steps: [
      { type: "click", target: "trigger" },
      {
        type: "expect",
        expect: {
          present: ["itemIndicator:banana"],
          absent: ["itemIndicator:apple"],
        },
      },
    ],
  },
  {
    ...(open({ defaultValue: { id: 2, name: "Two" } }) as Scenario),
    name: "object values: itemToKey/itemToString, label cache survives a closed popover",
    keyBy: "id",
    labelBy: "name",
    skip: { vanilla: "values are strings in vanilla" },
    tree: [
      { part: "label", text: "L" },
      trigger,
      popover(
        item({ id: 1, name: "One" }, "One"),
        item({ id: 2, name: "Two" }, "Two"),
      ),
    ],
    steps: [
      { type: "expect", expect: { text: { value: "Two" } } },
      { type: "click", target: "trigger" },
      {
        type: "expect",
        expect: { attrs: { "item:2": { "aria-selected": "true" } } },
      },
      { type: "click", target: "item:1" },
      {
        type: "expect",
        expect: {
          text: { value: "One" },
          lastCall: { name: "onOpenChange", args: [false, "select"] },
        },
      },
    ],
  },
  {
    ...(open({ invalid: true }) as Scenario),
    name: "invalid prop: marks the trigger and control until it is cleared, even after a pick",
    skip: { vanilla: "imperative setInvalid is covered by the vanilla tests" },
    steps: [
      {
        type: "expect",
        expect: {
          attrs: {
            trigger: { "data-invalid": "", "aria-invalid": "true" },
            control: { "data-invalid": "" },
          },
        },
      },
      { type: "click", target: "trigger" },
      { type: "click", target: "item:apple" },
      {
        type: "expect",
        expect: {
          attrs: { trigger: { "data-invalid": "", "aria-invalid": "true" } },
        },
      },
      { type: "setProps", props: { invalid: false } },
      {
        type: "expect",
        expect: {
          attrs: { trigger: { "data-invalid": null, "aria-invalid": null } },
        },
      },
    ],
  },
];

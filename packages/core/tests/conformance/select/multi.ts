import type { PartNode, Scenario } from "../types.ts";

const item = (value: string, text: string, props: Record<string, unknown> = {}): PartNode => ({
  part: "item",
  props: { value, ...props },
  text,
});

const fruit = (): PartNode[] => [
  item("apple", "Apple"),
  item("banana", "Banana"),
  item("cherry", "Cherry"),
  item("date", "Date"),
];

const trigger: PartNode = {
  part: "control",
  children: [
    {
      part: "trigger",
      children: [{ part: "value", props: { placeholder: "Pick fruit" } }],
    },
    { part: "clear", text: "×" },
  ],
};

const popover = (mounted: boolean, ...children: PartNode[]): PartNode => ({
  part: "popover",
  props: mounted ? { forceMount: true } : undefined,
  children: [{ part: "list", children }],
});

const multi = (props: Record<string, unknown> = {}, mounted = true): Scenario =>
  ({
    primitive: "select",
    props: { multiple: true, ...props },
    callbacks: ["onValueChange", "onOpenChange"],
    tree: [{ part: "label", text: "Fruit" }, trigger, popover(mounted, ...fruit())],
  }) as unknown as Scenario;

const comboTree: PartNode[] = [
  { part: "label", text: "Fruit" },
  {
    part: "control",
    children: [
      { part: "input", props: { placeholder: "Search" } },
      { part: "trigger", children: [{ part: "indicator", text: "▾" }] },
    ],
  },
  popover(true, ...fruit()),
];

export const multiScenarios: Scenario[] = [
  {
    ...multi(),
    name: "multiple: picks toggle, the list stays open, Value joins the labels",
    steps: [
      { type: "click", target: "trigger" },
      {
        type: "expect",
        expect: {
          attrs: { list: { "aria-multiselectable": "true" } },
          present: ["popover"],
        },
      },
      { type: "click", target: "item:apple" },
      { type: "click", target: "item:banana" },
      {
        type: "expect",
        expect: {
          present: ["popover"],
          text: { value: "Apple, Banana" },
          attrs: {
            "item:apple": { "aria-selected": "true" },
            "item:cherry": { "aria-selected": "false" },
          },
          includesCalls: [
            { name: "onValueChange", args: [["apple"]] },
            { name: "onValueChange", args: [["apple", "banana"]] },
          ],
        },
      },
      { type: "click", target: "item:apple" },
      {
        type: "expect",
        expect: {
          text: { value: "Banana" },
          lastCall: { name: "onValueChange", args: [["banana"]] },
        },
      },
    ],
  },
  {
    ...multi(),
    name: "multiple: Enter and Space toggle the highlighted item and keep the list open",
    steps: [
      { type: "focus", target: "trigger" },
      { type: "press", key: "ArrowDown" },
      { type: "press", key: "Enter" },
      { type: "press", key: "ArrowDown" },
      { type: "press", key: " " },
      {
        type: "expect",
        expect: {
          present: ["popover"],
          text: { value: "Apple, Banana" },
          active: "trigger",
        },
      },
    ],
  },
  {
    ...multi({ maxSelected: 2 }),
    name: "maxSelected disables the remaining items until one is removed",
    steps: [
      { type: "click", target: "trigger" },
      { type: "click", target: "item:apple" },
      { type: "click", target: "item:banana" },
      {
        type: "expect",
        expect: {
          attrs: {
            "item:date": { "aria-disabled": "true" },
            "item:apple": { "aria-disabled": null },
          },
        },
      },
      { type: "click", target: "item:date" },
      { type: "expect", expect: { text: { value: "Apple, Banana" } } },
      { type: "click", target: "item:apple" },
      {
        type: "expect",
        expect: { attrs: { "item:date": { "aria-disabled": null } } },
      },
    ],
  },
  {
    ...multi({ defaultValue: ["banana", "apple"] }),
    name: "defaultValue lists the labels in selection order",
    steps: [{ type: "expect", expect: { text: { value: "Banana, Apple" } } }],
  },
  {
    ...multi(),
    name: "multiple: picks are announced in a polite live region",
    steps: [
      { type: "click", target: "trigger" },
      { type: "click", target: "item:apple" },
      {
        type: "expect",
        expect: {
          text: { liveRegion: "Apple added, 1 selected" },
          attrs: { liveRegion: { "aria-live": "polite", role: "status" } },
        },
      },
      { type: "click", target: "item:apple" },
      {
        type: "expect",
        expect: { text: { liveRegion: "Apple removed, 0 selected" } },
      },
    ],
  },
  {
    ...multi({ defaultValue: ["apple", "banana"] }),
    name: "multiple: Clear resets to an empty array",
    steps: [
      { type: "click", target: "clear" },
      {
        type: "expect",
        expect: {
          text: { value: "Pick fruit" },
          lastCall: { name: "onValueChange", args: [[]] },
        },
      },
    ],
  },
  {
    ...multi({}),
    name: "multiple + combobox: a pick clears the input and keeps the list open; Backspace removes the last value",
    tree: comboTree,
    callbacks: ["onValueChange", "onOpenChange", "onInputChange"],
    steps: [
      { type: "focus", target: "input" },
      { type: "fill", text: "ap" },
      { type: "press", key: "Enter", target: "input" },
      {
        type: "expect",
        expect: {
          inputValue: "",
          present: ["popover"],
          visibleItems: ["apple", "banana", "cherry", "date"],
          includesCalls: [{ name: "onValueChange", args: [["apple"]] }],
        },
      },
      { type: "press", key: "Backspace", target: "input" },
      {
        type: "expect",
        expect: { lastCall: { name: "onValueChange", args: [[]] } },
      },
    ],
  },
];

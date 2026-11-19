import type { PartNode, Scenario } from "../types.ts";

const item = (value: unknown, text: string): PartNode => ({
  part: "item",
  props: { value },
  text,
});

const trigger: PartNode = {
  part: "control",
  children: [
    {
      part: "trigger",
      children: [{ part: "value", props: { placeholder: "Pick" } }],
    },
  ],
};

const tree = (...items: PartNode[]): PartNode[] => [
  { part: "label", text: "Fruit" },
  trigger,
  {
    part: "popover",
    props: { forceMount: true },
    children: [{ part: "list", children: items }],
  },
];

const fruit = () => [
  item("apple", "Apple"),
  item("banana", "Banana"),
  item("cherry", "Cherry"),
];

const form = (
  props: Record<string, unknown>,
  items: PartNode[] = fruit(),
): Scenario =>
  ({
    primitive: "select",
    form: true,
    props,
    callbacks: ["onValueChange", "onOpenChange"],
    tree: tree(...items),
  }) as unknown as Scenario;

export const formScenarios: Scenario[] = [
  {
    ...form({ name: "fruit", defaultValue: "banana" }),
    name: "form: the single value is submitted under `name` while the list is closed",
    steps: [{ type: "expect", expect: { formData: [["fruit", "banana"]] } }],
  },
  {
    ...form({
      name: "fruit",
      multiple: true,
      defaultValue: ["apple", "banana"],
    }),
    name: "form: multiple values are submitted as repeated entries",
    steps: [
      {
        type: "expect",
        expect: {
          formData: [
            ["fruit", "apple"],
            ["fruit", "banana"],
          ],
        },
      },
    ],
  },
  {
    ...form({ name: "fruit" }),
    name: "form: nothing is submitted while empty; a pick is submitted",
    steps: [
      { type: "expect", expect: { formData: [] } },
      { type: "click", target: "trigger" },
      { type: "click", target: "item:cherry" },
      { type: "expect", expect: { formData: [["fruit", "cherry"]] } },
    ],
  },
  {
    ...form({ name: "fruit", defaultValue: { id: 2, name: "Two" } }, [
      item({ id: 1, name: "One" }, "One"),
      item({ id: 2, name: "Two" }, "Two"),
    ]),
    name: "form: object values submit their itemToKey",
    keyBy: "id",
    labelBy: "name",
    skip: { vanilla: "values are strings in vanilla" },
    steps: [{ type: "expect", expect: { formData: [["fruit", "2"]] } }],
  },
  {
    ...form({ name: "fruit", required: true }),
    name: "form: required marks the trigger invalid until a value is picked, and focus moves to it",
    steps: [
      { type: "expect", expect: { attrs: { hiddenSelect: { required: "" } } } },
      { type: "invalid", target: "hiddenSelect" },
      {
        type: "expect",
        expect: {
          attrs: { trigger: { "data-invalid": "", "aria-invalid": "true" } },
          active: "trigger",
        },
      },
      { type: "click", target: "trigger" },
      { type: "click", target: "item:apple" },
      {
        type: "expect",
        expect: {
          attrs: { trigger: { "data-invalid": null, "aria-invalid": null } },
        },
      },
    ],
  },
  {
    ...form({ name: "fruit", defaultValue: "apple" }),
    name: "form reset restores defaultValue and reports it (uncontrolled)",
    steps: [
      { type: "click", target: "trigger" },
      { type: "click", target: "item:banana" },
      {
        type: "expect",
        expect: { text: { value: "Banana" }, formData: [["fruit", "banana"]] },
      },
      { type: "resetForm" },
      {
        type: "expect",
        expect: {
          text: { value: "Apple" },
          formData: [["fruit", "apple"]],
          lastCall: { name: "onValueChange", args: ["apple"] },
        },
      },
    ],
  },
  {
    ...form({ name: "fruit", value: "banana", defaultValue: "apple" }),
    name: "form reset in controlled mode asks the parent",
    skip: {
      vanilla: "no controlled mode",
      svelte: "bindable props are overwritten locally",
    },
    steps: [
      { type: "resetForm" },
      {
        type: "expect",
        expect: {
          lastCall: { name: "onValueChange", args: ["apple"] },
          formData: [["fruit", "banana"]],
        },
      },
    ],
  },
  {
    ...form({ name: "fruit", disabled: true, defaultValue: "apple" }),
    name: "form: a disabled Select submits nothing",
    steps: [{ type: "expect", expect: { formData: [] } }],
  },
];

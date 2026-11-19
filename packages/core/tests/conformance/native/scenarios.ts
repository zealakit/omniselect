import type { PartNode, Scenario } from "../types.ts";

const opt = (
  value: unknown,
  text: string,
  props: Record<string, unknown> = {},
): PartNode => ({
  part: "option",
  props: { value, ...props },
  text,
});

const fruit: PartNode[] = [
  { part: "label", text: "Fruit" },
  {
    part: "control",
    children: [
      opt("apple", "Apple"),
      opt("banana", "Banana"),
      opt("cherry", "Cherry", { disabled: true }),
    ],
  },
];

export const nativeScenarios: Scenario[] = [
  {
    name: "label is linked to the control",
    primitive: "native",
    tree: fruit,
    steps: [
      {
        type: "expect",
        expect: {
          present: ["label", "control", "option:apple"],
          text: { label: "Fruit" },
        },
      },
    ],
  },
  {
    name: "uncontrolled single: defaultValue shows, change reports the value",
    primitive: "native",
    props: { defaultValue: "banana" },
    callbacks: ["onValueChange"],
    tree: fruit,
    steps: [
      { type: "expect", expect: { value: "banana", calls: [] } },
      { type: "select", target: "control", values: ["apple"] },
      {
        type: "expect",
        expect: {
          value: "apple",
          calls: [{ name: "onValueChange", args: ["apple"] }],
        },
      },
    ],
  },
  {
    name: "controlled single: rejected change reverts, setProps updates",
    primitive: "native",
    props: { value: "apple" },
    callbacks: ["onValueChange"],
    skip: {
      svelte: "bindable props are overwritten locally",
      vanilla: "no controlled mode",
    },
    tree: fruit,
    steps: [
      { type: "select", target: "control", values: ["banana"] },
      {
        type: "expect",
        expect: {
          value: "apple",
          lastCall: { name: "onValueChange", args: ["banana"] },
        },
      },
      { type: "setProps", props: { value: "banana" } },
      { type: "expect", expect: { value: "banana" } },
    ],
  },
  {
    name: "multiple: defaultValue, change reports an array",
    primitive: "native",
    props: { multiple: true, defaultValue: ["apple"] },
    callbacks: ["onValueChange"],
    tree: fruit,
    steps: [
      {
        type: "expect",
        expect: { value: ["apple"], attrs: { control: { multiple: "" } } },
      },
      { type: "select", target: "control", values: ["apple", "banana"] },
      {
        type: "expect",
        expect: {
          value: ["apple", "banana"],
          lastCall: { name: "onValueChange", args: [["apple", "banana"]] },
        },
      },
    ],
  },
  {
    name: "object values map through itemToKey",
    primitive: "native",
    keyBy: "id",
    props: { defaultValue: { id: 2, name: "Two" } },
    callbacks: ["onValueChange"],
    skip: { vanilla: "values are strings in vanilla" },
    tree: [
      {
        part: "control",
        children: [
          opt({ id: 1, name: "One" }, "One"),
          opt({ id: 2, name: "Two" }, "Two"),
        ],
      },
    ],
    steps: [
      { type: "expect", expect: { value: "2" } },
      { type: "select", target: "control", values: ["1"] },
      {
        type: "expect",
        expect: {
          lastCall: { name: "onValueChange", args: [{ id: 1, name: "One" }] },
        },
      },
    ],
  },
  {
    name: "disabled option, disabled group, and disabled control",
    primitive: "native",
    props: { disabled: true },
    tree: [
      { part: "label", text: "L" },
      {
        part: "control",
        children: [
          opt("a", "A", { disabled: true }),
          {
            part: "optionGroup",
            props: { label: "G", disabled: true },
            children: [opt("b", "B")],
          },
        ],
      },
      { part: "indicator", text: "v" },
    ],
    steps: [
      {
        type: "expect",
        expect: {
          attrs: {
            control: { disabled: "", "data-disabled": "" },
            "option:a": { disabled: "" },
            "group:G": { disabled: "" },
            indicator: { "aria-hidden": "true", "data-disabled": "" },
          },
        },
      },
    ],
  },
  {
    name: "required marks data-required; invalid marks data-invalid until change",
    primitive: "native",
    props: { required: true },
    tree: [
      {
        part: "control",
        children: [opt("", "Pick", { value: null }), opt("a", "A")],
      },
    ],
    steps: [
      {
        type: "expect",
        expect: {
          attrs: {
            control: {
              required: "",
              "data-required": "",
              "data-invalid": null,
            },
          },
        },
      },
      { type: "invalid", target: "control" },
      {
        type: "expect",
        expect: { attrs: { control: { "data-invalid": "" } } },
      },
      { type: "select", target: "control", values: ["a"] },
      {
        type: "expect",
        expect: { attrs: { control: { "data-invalid": null } } },
      },
    ],
  },
  {
    name: "placeholder: null value shows data-placeholder",
    primitive: "native",
    tree: [
      {
        part: "control",
        children: [opt(null, "Choose…", { disabled: true }), opt("a", "A")],
      },
    ],
    steps: [
      {
        type: "expect",
        expect: { attrs: { control: { "data-placeholder": "" } }, value: "" },
      },
      { type: "select", target: "control", values: ["a"] },
      {
        type: "expect",
        expect: { attrs: { control: { "data-placeholder": null } } },
      },
    ],
  },
  {
    name: "form: single value is submitted by name",
    primitive: "native",
    form: true,
    props: { name: "fruit", defaultValue: "banana" },
    tree: fruit,
    steps: [{ type: "expect", expect: { formData: [["fruit", "banana"]] } }],
  },
  {
    name: "form: multiple values are submitted as repeated entries",
    primitive: "native",
    form: true,
    props: { name: "fruit", multiple: true, defaultValue: ["apple", "banana"] },
    tree: fruit,
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
    name: "form reset restores defaultValue and reports it (uncontrolled)",
    primitive: "native",
    form: true,
    props: { name: "fruit", defaultValue: "apple" },
    callbacks: ["onValueChange"],
    tree: fruit,
    steps: [
      { type: "select", target: "control", values: ["banana"] },
      { type: "expect", expect: { value: "banana" } },
      { type: "resetForm" },
      {
        type: "expect",
        expect: {
          value: "apple",
          lastCall: { name: "onValueChange", args: ["apple"] },
        },
      },
    ],
  },
  {
    name: "form reset in controlled mode asks the parent",
    primitive: "native",
    form: true,
    props: { name: "fruit", value: "banana", defaultValue: "apple" },
    callbacks: ["onValueChange"],
    skip: {
      svelte: "bindable props are overwritten locally",
      vanilla: "no controlled mode",
    },
    tree: fruit,
    steps: [
      { type: "resetForm" },
      {
        type: "expect",
        expect: {
          lastCall: { name: "onValueChange", args: ["apple"] },
          value: "banana",
        },
      },
    ],
  },
];

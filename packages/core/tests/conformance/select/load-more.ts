import type { PartNode, Scenario } from "../types.ts";

const item = (value: string, text: string): PartNode => ({
  part: "item",
  props: { value },
  text,
});

const tree = (): PartNode[] => [
  { part: "label", text: "Fruit" },
  {
    part: "control",
    children: [
      {
        part: "trigger",
        children: [{ part: "value", props: { placeholder: "Pick" } }],
      },
    ],
  },
  {
    part: "popover",
    children: [
      {
        part: "list",
        children: [
          item("apple", "Apple"),
          item("banana", "Banana"),
          { part: "empty", text: "No results" },
          { part: "loadMore", text: "Loading…" },
        ],
      },
    ],
  },
];

const base = (loadMore: Record<string, unknown>): Partial<Scenario> => ({
  primitive: "select",
  props: { loadMore },
  callbacks: ["onLoadMore"],
  tree: tree(),
});

const load = { name: "onLoadMore", args: [] };

export const loadMoreScenarios: Scenario[] = [
  {
    ...(base({ hasMore: true, isLoading: false }) as Scenario),
    name: "LoadMore: fires once when the sentinel intersects; duplicate events are ignored",
    steps: [
      { type: "click", target: "trigger" },
      {
        type: "expect",
        expect: {
          present: ["loadMore"],
          attrs: { loadMore: { "aria-hidden": "true", "data-has-more": "" } },
          calls: [],
        },
      },
      { type: "intersect", target: "loadMore" },
      { type: "intersect", target: "loadMore" },
      { type: "expect", expect: { calls: [load] } },
    ],
  },
  {
    ...(base({ hasMore: false, isLoading: false }) as Scenario),
    name: "LoadMore: never fires without more pages",
    steps: [
      { type: "click", target: "trigger" },
      { type: "intersect", target: "loadMore" },
      {
        type: "expect",
        expect: { calls: [], attrs: { loadMore: { "data-has-more": null } } },
      },
    ],
  },
  {
    ...(base({ hasMore: true, isLoading: false }) as Scenario),
    name: "LoadMore: waits while loading, then loads again if the sentinel is still visible (short page)",
    steps: [
      { type: "click", target: "trigger" },
      { type: "intersect", target: "loadMore" },
      { type: "setProps", props: { loadMore: { isLoading: true } } },
      { type: "intersect", target: "loadMore" },
      {
        type: "expect",
        expect: {
          calls: [load],
          attrs: {
            loadMore: { "data-loading": "" },
            list: { "aria-busy": "true" },
          },
        },
      },
      { type: "setProps", props: { loadMore: { isLoading: false } } },
      {
        type: "expect",
        expect: {
          calls: [load, load],
          attrs: {
            loadMore: { "data-loading": null },
            list: { "aria-busy": null },
          },
        },
      },
    ],
  },
  {
    ...(base({ hasMore: true, isLoading: false }) as Scenario),
    name: "LoadMore: reaching the last item with the keyboard asks for more without the sentinel",
    steps: [
      { type: "focus", target: "trigger" },
      { type: "press", key: "ArrowDown" },
      { type: "press", key: "ArrowDown" },
      {
        type: "expect",
        expect: {
          calls: [load],
          attrs: { "item:banana": { "data-highlighted": "" } },
        },
      },
      { type: "press", key: "ArrowDown" },
      { type: "expect", expect: { calls: [load] } },
    ],
  },
  {
    ...(base({ hasMore: true, isLoading: true }) as Scenario),
    name: "LoadMore: Empty is hidden while loading; the live region announces progress",
    tree: [
      { part: "label", text: "Fruit" },
      {
        part: "control",
        children: [
          {
            part: "trigger",
            children: [{ part: "value", props: { placeholder: "Pick" } }],
          },
        ],
      },
      {
        part: "popover",
        children: [
          {
            part: "list",
            children: [
              { part: "empty", text: "No results" },
              { part: "loadMore", text: "Loading…" },
            ],
          },
        ],
      },
    ],
    steps: [
      { type: "click", target: "trigger" },
      {
        type: "expect",
        expect: {
          absent: ["empty"],
          announcement: "Loading more results",
        },
      },
      {
        type: "setProps",
        props: { loadMore: { isLoading: false, hasMore: false } },
      },
      {
        type: "expect",
        expect: { present: ["empty"], announcement: "0 results" },
      },
    ],
  },
];

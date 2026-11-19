<script setup lang="ts">
import { NativeSelect } from "@zealakit/omniselect-vue/native";
import { Select } from "@zealakit/omniselect-vue/select";
import { ref } from "vue";

type Fruit = { id: number; name: string };

const fruits: Fruit[] = [
  { id: 1, name: "Apple" },
  { id: 2, name: "Banana" },
  { id: 3, name: "Cherry" },
];
const fruit = ref<Fruit | null>(null);
const submitted = ref("");
const ALL = Array.from({ length: 87 }, (_, i) => `Item ${i + 1}`);
const PAGE = 10;
const query = ref("");
const items = ref<string[]>([]);
const page = ref(0);
const more = ref(true);
const loading = ref(false);
let requestId = 0;
function fetchPage(
  q: string,
  p: number,
): Promise<{ rows: string[]; more: boolean }> {
  const all = ALL.filter((name) =>
    name.toLowerCase().includes(q.toLowerCase()),
  );
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          rows: all.slice(p * PAGE, (p + 1) * PAGE),
          more: (p + 1) * PAGE < all.length,
        }),
      300,
    ),
  );
}
function load(q: string, p: number) {
  const id = ++requestId;
  loading.value = true;
  void fetchPage(q, p).then(({ rows, more: hasMore }) => {
    if (id !== requestId) return;
    items.value = p === 0 ? rows : [...items.value, ...rows];
    page.value = p;
    more.value = hasMore;
    loading.value = false;
  });
}
load("", 0);
let timer: ReturnType<typeof setTimeout> | undefined;
function onInputChange(text: string, reason: string) {
  if (reason !== "input") return;
  query.value = text;
  clearTimeout(timer);
  timer = setTimeout(() => load(text, 0), 250);
}
const fruitName = ref<string | null>("apple");
const names = ["apple", "banana", "cherry", "date"];
const itemToKey = (value: Fruit) => String(value.id);

function onSubmit(event: Event) {
  submitted.value = JSON.stringify([
    ...new FormData(event.currentTarget as HTMLFormElement).entries(),
  ]);
}
</script>

<template>
  <main class="page">
    <p class="eyebrow">@zealakit/omniselect-vue</p>
    <h1>NativeSelect</h1>
    <form @submit.prevent="onSubmit">
      <div class="field">
        <NativeSelect.Root v-model="fruit" name="fruit" required :item-to-key="itemToKey as never">
          <NativeSelect.Label>Fruit</NativeSelect.Label>
          <NativeSelect.Control>
            <NativeSelect.Option :value="null" disabled>Choose a fruit…</NativeSelect.Option>
            <NativeSelect.Option v-for="item in fruits" :key="item.id" :value="item">
              {{ item.name }}
            </NativeSelect.Option>
          </NativeSelect.Control>
        </NativeSelect.Root>
        <button type="submit">Submit</button>
      </div>
    </form>
    <p>Value: {{ fruit?.name ?? "none" }}</p>
    <pre>{{ submitted }}</pre>
    <h2>Select</h2>
    <div class="field">
      <Select.Root v-model="fruitName" :item-to-string="(value: string) => value">
        <Select.Label>Fruit</Select.Label>
        <Select.Control>
          <span class="select-control">
            <Select.Trigger>
              <Select.Value placeholder="Pick a fruit" />
              <Select.Indicator>▾</Select.Indicator>
            </Select.Trigger>
            <Select.Clear>×</Select.Clear>
          </span>
        </Select.Control>
        <Select.Popover>
          <Select.List>
            <Select.Item v-for="name in names" :key="name" :value="name" :disabled="name === 'cherry'">
              {{ name }}
              <Select.ItemIndicator>✓</Select.ItemIndicator>
            </Select.Item>
          </Select.List>
        </Select.Popover>
      </Select.Root>
    </div>
    <h2>Combobox</h2>
    <div class="field">
      <Select.Root>
        <Select.Label>Search fruit</Select.Label>
        <Select.Control>
          <span class="select-control">
            <Select.Input placeholder="Type to filter" />
            <Select.Trigger><Select.Indicator>▾</Select.Indicator></Select.Trigger>
            <Select.Clear>×</Select.Clear>
          </span>
        </Select.Control>
        <Select.Popover>
          <Select.List>
            <Select.Item v-for="name in ['apple', 'apricot', 'banana', 'cherry', 'date']" :key="name" :value="name">{{ name }}</Select.Item>
            <Select.Empty>No results</Select.Empty>
          </Select.List>
        </Select.Popover>
      </Select.Root>
    </div>
    <h2>Multiple (with chips)</h2>
    <div class="field">
      <Select.Root multiple name="fruits" :default-value="['apple']" :item-to-string="(value: string) => value">
        <Select.Label>Fruits</Select.Label>
        <Select.Control>
          <Select.Trigger>
            <Select.Value placeholder="Pick fruit" v-slot="{ items, remove }">
              <button v-for="item in items" :key="item.key" type="button" class="chip" @click.stop="remove(item.value)">{{ item.label }} ×</button>
            </Select.Value>
          </Select.Trigger>
        </Select.Control>
        <Select.Popover>
          <Select.List>
            <Select.Item v-for="name in names" :key="name" :value="name">{{ name }}</Select.Item>
          </Select.List>
        </Select.Popover>
      </Select.Root>
    </div>
    <h2>Async search with LoadMore</h2>
    <div class="field">
      <Select.Root :filter="false" :item-to-string="(value: string) => value" @input-change="onInputChange">
        <Select.Label>Async search</Select.Label>
        <Select.Control>
          <span class="select-control">
            <Select.Input placeholder="Search 87 items" />
            <Select.Trigger><Select.Indicator>▾</Select.Indicator></Select.Trigger>
          </span>
        </Select.Control>
        <Select.Popover>
          <Select.List>
            <Select.Item v-for="name in items" :key="name" :value="name">{{ name }}</Select.Item>
            <Select.Empty>No results</Select.Empty>
            <Select.LoadMore :is-loading="loading" :has-more="more" @load-more="load(query, page + 1)">Loading…</Select.LoadMore>
          </Select.List>
        </Select.Popover>
      </Select.Root>
    </div>
  </main>
</template>

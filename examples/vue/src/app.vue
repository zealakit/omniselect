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
  </main>
</template>

<script setup lang="ts">
import { NativeSelect } from "@zealakit/omniselect-vue/native";
import { ref } from "vue";

type Fruit = { id: number; name: string };

const fruits: Fruit[] = [
  { id: 1, name: "Apple" },
  { id: 2, name: "Banana" },
  { id: 3, name: "Cherry" },
];
const fruit = ref<Fruit | null>(null);
const submitted = ref("");
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
  </main>
</template>

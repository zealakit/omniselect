<script lang="ts">
import { NativeSelect } from "@zealakit/omniselect-svelte/native";

type Fruit = { id: number; name: string };

const fruits: Fruit[] = [
  { id: 1, name: "Apple" },
  { id: 2, name: "Banana" },
  { id: 3, name: "Cherry" },
];
let fruit = $state<Fruit | null>(null);
let submitted = $state("");

function onSubmit(event: SubmitEvent) {
  event.preventDefault();
  submitted = JSON.stringify([
    ...new FormData(event.currentTarget as HTMLFormElement).entries(),
  ]);
}
</script>

<main class="page">
  <p class="eyebrow">@zealakit/omniselect-svelte</p>
  <h1>NativeSelect</h1>
  <form onsubmit={onSubmit}>
    <div class="field">
      <NativeSelect.Root bind:value={fruit} name="fruit" required itemToKey={(value: Fruit) => String(value.id)}>
        <NativeSelect.Label>Fruit</NativeSelect.Label>
        <NativeSelect.Control>
          <NativeSelect.Option value={null} disabled>Choose a fruit…</NativeSelect.Option>
          {#each fruits as item (item.id)}
            <NativeSelect.Option value={item}>{item.name}</NativeSelect.Option>
          {/each}
        </NativeSelect.Control>
      </NativeSelect.Root>
      <button type="submit">Submit</button>
    </div>
  </form>
  <p>Value: {fruit?.name ?? "none"}</p>
  <pre>{submitted}</pre>
</main>

<script lang="ts">
  import { NativeSelect } from "@zealakit/omniselect-svelte/native";
  import FormDemo from "./form-demo.svelte";
  import { Select } from "@zealakit/omniselect-svelte/select";

  type Fruit = { id: number; name: string };

  const fruits: Fruit[] = [
    { id: 1, name: "Apple" },
    { id: 2, name: "Banana" },
    { id: 3, name: "Cherry" },
  ];
  let fruit = $state<Fruit | null>(null);
  let submitted = $state("");
  const ALL = Array.from({ length: 87 }, (_, i) => `Item ${i + 1}`);
  const PAGE = 10;
  let query = $state("");
  let asyncItems = $state<string[]>([]);
  let page = $state(0);
  let more = $state(true);
  let loading = $state(false);
  let requestId = 0;
  function fetchPage(q: string, p: number): Promise<{ rows: string[]; more: boolean }> {
    const all = ALL.filter((name) => name.toLowerCase().includes(q.toLowerCase()));
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
    loading = true;
    void fetchPage(q, p).then(({ rows, more: hasMore }) => {
      if (id !== requestId) return;
      asyncItems = p === 0 ? rows : [...asyncItems, ...rows];
      page = p;
      more = hasMore;
      loading = false;
    });
  }
  load("", 0);
  let timer: ReturnType<typeof setTimeout> | undefined;
  function onInputChange(text: string, reason: string) {
    if (reason !== "input") return;
    query = text;
    clearTimeout(timer);
    timer = setTimeout(() => load(text, 0), 250);
  }
  const searchFruits = [
    "apple",
    "apricot",
    "banana",
    "blueberry",
    "cherry",
    "date",
    "elderberry",
    "fig",
    "grape",
  ];
  let fruitName = $state<string | null>("apple");
  const names = ["apple", "banana", "cherry", "date"];

  function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    submitted = JSON.stringify([...new FormData(event.currentTarget as HTMLFormElement).entries()]);
  }
</script>

<main class="page">
  <p class="eyebrow">@zealakit/omniselect-svelte</p>
  <h1>NativeSelect</h1>
  <form onsubmit={onSubmit}>
    <div class="field">
      <NativeSelect.Root
        bind:value={fruit}
        name="fruit"
        required
        itemToKey={(value: Fruit) => String(value.id)}
      >
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
  <h2>Select</h2>
  <div class="field">
    <Select.Root bind:value={fruitName} itemToString={(value: string) => value}>
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
          {#each names as name (name)}
            <Select.Item value={name} disabled={name === "cherry"}>
              {name}
              <Select.ItemIndicator>✓</Select.ItemIndicator>
            </Select.Item>
          {/each}
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
          {#each ["apple", "apricot", "banana", "cherry", "date"] as name (name)}
            <Select.Item value={name}>{name}</Select.Item>
          {/each}
          <Select.Empty>No results</Select.Empty>
        </Select.List>
      </Select.Popover>
    </Select.Root>
  </div>
  <h2>Multiple (with chips)</h2>
  <div class="field">
    <Select.Root
      multiple
      name="fruits"
      defaultValue={["apple"]}
      itemToString={(value: string) => value}
    >
      <Select.Label>Fruits</Select.Label>
      <Select.Control>
        <Select.Trigger>
          <Select.Value placeholder="Pick fruit">
            {#snippet children({ items, remove })}
              {#each items as item (item.key)}
                <button
                  type="button"
                  class="chip"
                  onclick={(event) => {
                    event.stopPropagation();
                    remove(item.value);
                  }}>{item.label} ×</button
                >
              {/each}
            {/snippet}
          </Select.Value>
        </Select.Trigger>
      </Select.Control>
      <Select.Popover>
        <Select.List>
          {#each names as name (name)}
            <Select.Item value={name}>{name}</Select.Item>
          {/each}
        </Select.List>
      </Select.Popover>
    </Select.Root>
  </div>
  <h2>Async search with LoadMore</h2>
  <div class="field">
    <Select.Root filter={false} itemToString={(value: string) => value} {onInputChange}>
      <Select.Label>Async search</Select.Label>
      <Select.Control>
        <span class="select-control">
          <Select.Input placeholder="Search 87 items" />
          <Select.Trigger><Select.Indicator>▾</Select.Indicator></Select.Trigger>
        </span>
      </Select.Control>
      <Select.Popover>
        <Select.List>
          {#each asyncItems as name (name)}
            <Select.Item value={name}>{name}</Select.Item>
          {/each}
          <Select.Empty>No results</Select.Empty>
          <Select.LoadMore
            isLoading={loading}
            hasMore={more}
            onLoadMore={() => load(query, page + 1)}>Loading…</Select.LoadMore
          >
        </Select.List>
      </Select.Popover>
    </Select.Root>
  </div>
  <h2>Popover search</h2>
  <div class="field">
    <Select.Root itemToString={(value: string) => value}>
      <Select.Label>Fruit (search in the popover)</Select.Label>
      <Select.Control>
        <Select.Trigger>
          <Select.Value placeholder="Pick a fruit" />
          <Select.Indicator>▾</Select.Indicator>
        </Select.Trigger>
      </Select.Control>
      <Select.Popover>
        <div class="search">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg
          >
          <Select.Input placeholder="Search fruit…" />
        </div>
        <Select.List>
          {#each searchFruits as name (name)}
            <Select.Item value={name}
              >{name}<Select.ItemIndicator>✓</Select.ItemIndicator></Select.Item
            >
          {/each}
          <Select.Empty>No results</Select.Empty>
        </Select.List>
      </Select.Popover>
    </Select.Root>
  </div>
  <div class="field">
    <Select.Root multiple defaultValue={["apple"]} itemToString={(value: string) => value}>
      <Select.Label>Fruits (search in the popover, multiple)</Select.Label>
      <Select.Control>
        <Select.Trigger>
          <Select.Value placeholder="Pick fruits">
            {#snippet children({ items, remove })}
              {#each items as item (item.key)}
                <button
                  type="button"
                  class="chip"
                  onclick={(event) => {
                    event.stopPropagation();
                    remove(item.value);
                  }}>{item.label} ×</button
                >
              {/each}
            {/snippet}
          </Select.Value>
          <Select.Indicator>▾</Select.Indicator>
        </Select.Trigger>
      </Select.Control>
      <Select.Popover>
        <div class="search">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg
          >
          <Select.Input placeholder="Search fruit…" />
        </div>
        <Select.List>
          {#each searchFruits as name (name)}
            <Select.Item value={name}
              >{name}<Select.ItemIndicator>✓</Select.ItemIndicator></Select.Item
            >
          {/each}
          <Select.Empty>No results</Select.Empty>
        </Select.List>
      </Select.Popover>
    </Select.Root>
  </div>
  <h2>Forms: TanStack Form + zod</h2>
  <FormDemo />
</main>

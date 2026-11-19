<script lang="ts">
import { NativeSelect } from "@zealakit/omniselect-svelte/native";
import { Select } from "@zealakit/omniselect-svelte/select";
import { createForm } from "@tanstack/svelte-form";
import { onMount } from "svelte";
import { z } from "zod";

const COUNTRIES: Record<string, string> = {
  vn: "Việt Nam",
  us: "United States",
  fr: "France",
  jp: "Japan",
  de: "Germany",
  br: "Brazil",
};
const FRUITS = ["apple", "banana", "cherry", "date", "elderberry"];
const PEOPLE = Array.from({ length: 42 }, (_, i) => ({
  id: `u${i + 1}`,
  name: `Person ${i + 1}`,
}));
const PAGE = 8;

const schema = z.object({
  country: z.string().min(1, "Pick a country"),
  fruits: z
    .array(z.string())
    .min(1, "Pick at least one fruit")
    .max(3, "Pick at most three fruits"),
  size: z.string().min(1, "Pick a size"),
  assignee: z.string().min(1, "Pick an assignee"),
});
const defaults = {
  country: "",
  fruits: [] as string[],
  size: "",
  assignee: "",
};
const ORDER = ["country", "fruits", "size", "assignee"];

let result = $state("");
let root: HTMLFormElement | undefined = $state();

const form = createForm(() => ({
  defaultValues: defaults,
  validators: { onChange: schema, onSubmit: schema },
  onSubmit: ({ value }) => {
    result = JSON.stringify(value, null, 2);
  },
  // TanStack does not move focus: focus the first invalid field ourselves.
  onSubmitInvalid: ({ formApi }) => {
    const first = ORDER.find(
      (name) => (formApi.getFieldMeta(name as never)?.errors.length ?? 0) > 0,
    );
    root
      ?.querySelector<HTMLElement>(
        `[data-field="${first}"] input, [data-field="${first}"] [data-part="trigger"], [data-field="${first}"] select`,
      )
      ?.focus();
  },
}));

const messages = (errors: unknown[]): string =>
  errors
    .map((e) =>
      typeof e === "string" ? e : ((e as { message?: string })?.message ?? ""),
    )
    .filter(Boolean)[0] ?? "";

// Fake paginated API for the async field.
let people = $state<typeof PEOPLE>([]);
let page = $state(0);
let more = $state(true);
let loading = $state(false);
const names: Record<string, string> = {};
function loadPage(next: number) {
  loading = true;
  setTimeout(() => {
    const rows = PEOPLE.slice(next * PAGE, (next + 1) * PAGE);
    for (const row of rows) names[row.id] = row.name;
    people = next === 0 ? rows : [...people, ...rows];
    page = next;
    more = (next + 1) * PAGE < PEOPLE.length;
    loading = false;
  }, 250);
}
onMount(() => loadPage(0));
</script>

<form
  bind:this={root}
  novalidate
  onsubmit={(event) => {
    event.preventDefault();
    void form.handleSubmit();
  }}
  onreset={(event) => {
    event.preventDefault();
    form.reset();
    result = "";
  }}
>
  <div class="field" data-field="country">
    <form.Field name="country">
      {#snippet children(field)}
        {@const error = field.state.meta.isTouched ? messages(field.state.meta.errors) : ""}
        <Select.Root
          value={field.state.value || null}
          onValueChange={(v) => field.handleChange((v as string | null) ?? "")}
          invalid={!!error}
          name="country"
          itemToString={(code: string) => COUNTRIES[code] ?? code}
        >
          <Select.Label>Country (searchable)</Select.Label>
          <Select.Control>
            <span class="select-control">
              <Select.Input placeholder="Type to search" onblur={field.handleBlur} aria-describedby={error ? "country-error" : undefined} />
              <Select.Trigger><Select.Indicator>▾</Select.Indicator></Select.Trigger>
              <Select.Clear>×</Select.Clear>
            </span>
          </Select.Control>
          <Select.Popover>
            <Select.List>
              {#each Object.entries(COUNTRIES) as [code, name] (code)}
                <Select.Item value={code}>{name}</Select.Item>
              {/each}
              <Select.Empty>No countries</Select.Empty>
            </Select.List>
          </Select.Popover>
        </Select.Root>
        {#if error}<p id="country-error" class="error" role="alert">{error}</p>{/if}
      {/snippet}
    </form.Field>
  </div>

  <div class="field" data-field="fruits">
    <form.Field name="fruits">
      {#snippet children(field)}
        {@const error = field.state.meta.isTouched ? messages(field.state.meta.errors) : ""}
        <Select.Root
          multiple
          maxSelected={4}
          value={field.state.value}
          onValueChange={(v) => field.handleChange(v as string[])}
          invalid={!!error}
          name="fruits"
          itemToString={(value: string) => value}
        >
          <Select.Label>Fruits (pick up to 3)</Select.Label>
          <Select.Control>
            <Select.Trigger onblur={field.handleBlur} aria-describedby={error ? "fruits-error" : undefined}>
              <Select.Value placeholder="Pick fruits">
                {#snippet children({ items, remove })}
                  {#each items as item (item.key)}
                    <button type="button" class="chip" onclick={(event) => { event.stopPropagation(); remove(item.value); }}>{item.label} ×</button>
                  {/each}
                {/snippet}
              </Select.Value>
            </Select.Trigger>
          </Select.Control>
          <Select.Popover>
            <Select.List>
              {#each FRUITS as name (name)}
                <Select.Item value={name}>{name}<Select.ItemIndicator>✓</Select.ItemIndicator></Select.Item>
              {/each}
            </Select.List>
          </Select.Popover>
        </Select.Root>
        {#if error}<p id="fruits-error" class="error" role="alert">{error}</p>{/if}
      {/snippet}
    </form.Field>
  </div>

  <div class="field" data-field="size">
    <form.Field name="size">
      {#snippet children(field)}
        {@const error = field.state.meta.isTouched ? messages(field.state.meta.errors) : ""}
        <NativeSelect.Root
          value={field.state.value || null}
          onValueChange={(v) => field.handleChange((v as string | null) ?? "")}
          invalid={!!error}
          name="size"
        >
          <NativeSelect.Label>Size (native)</NativeSelect.Label>
          <NativeSelect.Control onblur={field.handleBlur} aria-describedby={error ? "size-error" : undefined}>
            <NativeSelect.Option value={null} disabled>Choose a size…</NativeSelect.Option>
            {#each ["S", "M", "L"] as size (size)}
              <NativeSelect.Option value={size}>{size}</NativeSelect.Option>
            {/each}
          </NativeSelect.Control>
        </NativeSelect.Root>
        {#if error}<p id="size-error" class="error" role="alert">{error}</p>{/if}
      {/snippet}
    </form.Field>
  </div>

  <div class="field" data-field="assignee">
    <form.Field name="assignee">
      {#snippet children(field)}
        {@const error = field.state.meta.isTouched ? messages(field.state.meta.errors) : ""}
        <Select.Root
          value={field.state.value || null}
          onValueChange={(v) => field.handleChange((v as string | null) ?? "")}
          invalid={!!error}
          name="assignee"
          itemToString={(id: string) => names[id] ?? id}
        >
          <Select.Label>Assignee (async, paginated)</Select.Label>
          <Select.Control>
            <Select.Trigger onblur={field.handleBlur} aria-describedby={error ? "assignee-error" : undefined}>
              <Select.Value placeholder="Pick a person" />
              <Select.Indicator>▾</Select.Indicator>
            </Select.Trigger>
          </Select.Control>
          <Select.Popover>
            <Select.List>
              {#each people as person (person.id)}
                <Select.Item value={person.id}>{person.name}</Select.Item>
              {/each}
              <Select.LoadMore isLoading={loading} hasMore={more} onLoadMore={() => loadPage(page + 1)}>Loading…</Select.LoadMore>
            </Select.List>
          </Select.Popover>
        </Select.Root>
        {#if error}<p id="assignee-error" class="error" role="alert">{error}</p>{/if}
      {/snippet}
    </form.Field>
  </div>

  <div class="actions">
    <button type="submit">Submit</button>
    <button type="reset">Reset</button>
  </div>
  <pre aria-live="polite">{result || "Submit to see the validated values."}</pre>
</form>

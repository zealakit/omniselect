<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { NativeSelect } from "@zealakit/omniselect-vue/native";
import { Select } from "@zealakit/omniselect-vue/select";
import { useField, useForm } from "vee-validate";
import { onMounted, ref } from "vue";
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

const schema = toTypedSchema(
  z.object({
    country: z.string().min(1, "Pick a country"),
    fruits: z
      .array(z.string())
      .min(1, "Pick at least one fruit")
      .max(3, "Pick at most three fruits"),
    size: z.string().min(1, "Pick a size"),
    assignee: z.string().min(1, "Pick an assignee"),
  }),
);
const initialValues = {
  country: "",
  fruits: [] as string[],
  size: "",
  assignee: "",
};

const { handleSubmit, resetForm } = useForm({
  validationSchema: schema,
  initialValues,
});
const country = useField<string>("country");
const fruits = useField<string[]>("fruits");
const size = useField<string>("size");
const assignee = useField<string>("assignee");

const result = ref("");
const root = ref<HTMLElement | null>(null);

const onSubmit = handleSubmit(
  (values) => {
    result.value = JSON.stringify(values, null, 2);
  },
  ({ errors }) => {
    // vee-validate does not move focus: focus the first invalid field ourselves.
    const first = ["country", "fruits", "size", "assignee"].find(
      (name) => name in errors,
    );
    root.value
      ?.querySelector<HTMLElement>(
        `[data-field="${first}"] input, [data-field="${first}"] [data-part="trigger"], [data-field="${first}"] select`,
      )
      ?.focus();
  },
);
function onReset() {
  resetForm({ values: initialValues });
  result.value = "";
}

// Fake paginated API for the async field.
const people = ref<typeof PEOPLE>([]);
const page = ref(0);
const more = ref(true);
const loading = ref(false);
const names: Record<string, string> = {};
function loadPage(next: number) {
  loading.value = true;
  setTimeout(() => {
    const rows = PEOPLE.slice(next * PAGE, (next + 1) * PAGE);
    for (const row of rows) names[row.id] = row.name;
    people.value = next === 0 ? rows : [...people.value, ...rows];
    page.value = next;
    more.value = (next + 1) * PAGE < PEOPLE.length;
    loading.value = false;
  }, 250);
}
onMounted(() => loadPage(0));
</script>

<template>
  <form ref="root" novalidate @submit.prevent="onSubmit" @reset.prevent="onReset">
    <div class="field" data-field="country">
      <Select.Root
        :model-value="country.value.value || null"
        :invalid="!!country.errorMessage.value"
        name="country"
        :item-to-string="(code: string) => COUNTRIES[code] ?? code"
        @update:model-value="(v: unknown) => (country.value.value = (v as string | null) ?? '')"
      >
        <Select.Label>Country (searchable)</Select.Label>
        <Select.Control>
          <span class="select-control">
            <Select.Input
              placeholder="Type to search"
              :aria-describedby="country.errorMessage.value ? 'country-error' : undefined"
              @blur="country.handleBlur"
            />
            <Select.Trigger><Select.Indicator>▾</Select.Indicator></Select.Trigger>
            <Select.Clear>×</Select.Clear>
          </span>
        </Select.Control>
        <Select.Popover>
          <Select.List>
            <Select.Item v-for="(name, code) in COUNTRIES" :key="code" :value="code">{{ name }}</Select.Item>
            <Select.Empty>No countries</Select.Empty>
          </Select.List>
        </Select.Popover>
      </Select.Root>
      <p v-if="country.errorMessage.value" id="country-error" class="error" role="alert">{{ country.errorMessage.value }}</p>
    </div>

    <div class="field" data-field="fruits">
      <Select.Root
        multiple
        :max-selected="4"
        :model-value="fruits.value.value"
        :invalid="!!fruits.errorMessage.value"
        name="fruits"
        :item-to-string="(value: string) => value"
        @update:model-value="(v: unknown) => (fruits.value.value = v as string[])"
      >
        <Select.Label>Fruits (pick up to 3)</Select.Label>
        <Select.Control>
          <Select.Trigger :aria-describedby="fruits.errorMessage.value ? 'fruits-error' : undefined" @blur="fruits.handleBlur">
            <Select.Value placeholder="Pick fruits" v-slot="{ items, remove }">
              <button v-for="item in items" :key="item.key" type="button" class="chip" @click.stop="remove(item.value)">{{ item.label }} ×</button>
            </Select.Value>
          </Select.Trigger>
        </Select.Control>
        <Select.Popover>
          <Select.List>
            <Select.Item v-for="name in FRUITS" :key="name" :value="name">
              {{ name }}
              <Select.ItemIndicator>✓</Select.ItemIndicator>
            </Select.Item>
          </Select.List>
        </Select.Popover>
      </Select.Root>
      <p v-if="fruits.errorMessage.value" id="fruits-error" class="error" role="alert">{{ fruits.errorMessage.value }}</p>
    </div>

    <div class="field" data-field="size">
      <NativeSelect.Root
        :model-value="size.value.value || null"
        :invalid="!!size.errorMessage.value"
        name="size"
        @update:model-value="(v: unknown) => (size.value.value = (v as string | null) ?? '')"
      >
        <NativeSelect.Label>Size (native)</NativeSelect.Label>
        <NativeSelect.Control :aria-describedby="size.errorMessage.value ? 'size-error' : undefined" @blur="size.handleBlur">
          <NativeSelect.Option :value="null" disabled>Choose a size…</NativeSelect.Option>
          <NativeSelect.Option v-for="s in ['S', 'M', 'L']" :key="s" :value="s">{{ s }}</NativeSelect.Option>
        </NativeSelect.Control>
      </NativeSelect.Root>
      <p v-if="size.errorMessage.value" id="size-error" class="error" role="alert">{{ size.errorMessage.value }}</p>
    </div>

    <div class="field" data-field="assignee">
      <Select.Root
        :model-value="assignee.value.value || null"
        :invalid="!!assignee.errorMessage.value"
        name="assignee"
        :item-to-string="(id: string) => names[id] ?? id"
        @update:model-value="(v: unknown) => (assignee.value.value = (v as string | null) ?? '')"
      >
        <Select.Label>Assignee (async, paginated)</Select.Label>
        <Select.Control>
          <Select.Trigger :aria-describedby="assignee.errorMessage.value ? 'assignee-error' : undefined" @blur="assignee.handleBlur">
            <Select.Value placeholder="Pick a person" />
            <Select.Indicator>▾</Select.Indicator>
          </Select.Trigger>
        </Select.Control>
        <Select.Popover>
          <Select.List>
            <Select.Item v-for="person in people" :key="person.id" :value="person.id">{{ person.name }}</Select.Item>
            <Select.LoadMore :is-loading="loading" :has-more="more" @load-more="loadPage(page + 1)">Loading…</Select.LoadMore>
          </Select.List>
        </Select.Popover>
      </Select.Root>
      <p v-if="assignee.errorMessage.value" id="assignee-error" class="error" role="alert">{{ assignee.errorMessage.value }}</p>
    </div>

    <div class="actions">
      <button type="submit">Submit</button>
      <button type="reset">Reset</button>
    </div>
    <pre aria-live="polite">{{ result || "Submit to see the validated values." }}</pre>
  </form>
</template>

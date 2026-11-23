"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { NativeSelect } from "@zealakit/omniselect-react/native";
import { Select } from "@zealakit/omniselect-react/select";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
  fruits: z.array(z.string()).min(1, "Pick at least one fruit").max(3, "Pick at most three fruits"),
  size: z.string().min(1, "Pick a size"),
  assignee: z.string().min(1, "Pick an assignee"),
});
type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  country: "",
  fruits: [],
  size: "",
  assignee: "",
};

/** Label, control, and the error message wired with `aria-describedby`. */
function Field({ id, error, children }: { id: string; error?: string; children: ReactNode }) {
  return (
    <div className="field">
      {children}
      {error ? (
        <p id={id} className="error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Fake paginated API. */
function fetchPeople(page: number): Promise<{ rows: typeof PEOPLE; more: boolean }> {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          rows: PEOPLE.slice(page * PAGE, (page + 1) * PAGE),
          more: (page + 1) * PAGE < PEOPLE.length,
        }),
      250,
    ),
  );
}

export function FormDemo() {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
    mode: "onTouched",
  });
  const [result, setResult] = useState("");

  const [people, setPeople] = useState<typeof PEOPLE>([]);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const names = useRef<Record<string, string>>({});
  function loadPage(next: number) {
    setLoading(true);
    void fetchPeople(next).then(({ rows, more: hasMore }) => {
      for (const row of rows) names.current[row.id] = row.name;
      setPeople((current) => (next === 0 ? rows : [...current, ...rows]));
      setPage(next);
      setMore(hasMore);
      setLoading(false);
    });
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: load the first page once
  useEffect(() => loadPage(0), []);

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => setResult(JSON.stringify(values, null, 2)))}
      onReset={(event) => {
        event.preventDefault();
        reset(defaults);
        setResult("");
      }}
    >
      <Field id="country-error" error={errors.country?.message}>
        <Controller
          name="country"
          control={control}
          render={({ field, fieldState }) => (
            <Select.Root
              value={field.value || null}
              onValueChange={(value) => field.onChange(value ?? "")}
              invalid={fieldState.invalid}
              name={field.name}
              itemToString={(code: string) => COUNTRIES[code] ?? code}
            >
              <Select.Label>Country (searchable)</Select.Label>
              <Select.Control>
                <span className="select-control">
                  <Select.Input
                    ref={field.ref}
                    onBlur={field.onBlur}
                    placeholder="Type to search"
                    aria-describedby={errors.country ? "country-error" : undefined}
                  />
                  <Select.Trigger>
                    <Select.Indicator>▾</Select.Indicator>
                  </Select.Trigger>
                  <Select.Clear>×</Select.Clear>
                </span>
              </Select.Control>
              <Select.Popover>
                <Select.List>
                  {Object.entries(COUNTRIES).map(([code, name]) => (
                    <Select.Item key={code} value={code}>
                      {name}
                    </Select.Item>
                  ))}
                  <Select.Empty>No countries</Select.Empty>
                </Select.List>
              </Select.Popover>
            </Select.Root>
          )}
        />
      </Field>

      <Field id="fruits-error" error={errors.fruits?.message}>
        <Controller
          name="fruits"
          control={control}
          render={({ field, fieldState }) => (
            <Select.Root
              multiple
              maxSelected={4}
              value={field.value}
              onValueChange={field.onChange}
              invalid={fieldState.invalid}
              name={field.name}
              itemToString={(value: string) => value}
            >
              <Select.Label>Fruits (pick up to 3)</Select.Label>
              <Select.Control>
                <Select.Trigger
                  ref={field.ref}
                  onBlur={field.onBlur}
                  aria-describedby={errors.fruits ? "fruits-error" : undefined}
                >
                  <Select.Value placeholder="Pick fruits">
                    {({ items, remove }) =>
                      items.map((item) => (
                        <button
                          type="button"
                          key={item.key}
                          className="chip"
                          onClick={(event) => {
                            event.stopPropagation();
                            remove(item.value);
                          }}
                        >
                          {item.label} ×
                        </button>
                      ))
                    }
                  </Select.Value>
                </Select.Trigger>
              </Select.Control>
              <Select.Popover>
                <Select.List>
                  {FRUITS.map((name) => (
                    <Select.Item key={name} value={name}>
                      {name}
                      <Select.ItemIndicator>✓</Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popover>
            </Select.Root>
          )}
        />
      </Field>

      <Field id="size-error" error={errors.size?.message}>
        <Controller
          name="size"
          control={control}
          render={({ field, fieldState }) => (
            <NativeSelect.Root
              value={field.value || null}
              onValueChange={(value) => field.onChange(value ?? "")}
              invalid={fieldState.invalid}
              name={field.name}
            >
              <NativeSelect.Label>Size (native)</NativeSelect.Label>
              <NativeSelect.Control
                ref={field.ref}
                onBlur={field.onBlur}
                aria-describedby={errors.size ? "size-error" : undefined}
              >
                <NativeSelect.Option value={null} disabled>
                  Choose a size…
                </NativeSelect.Option>
                {["S", "M", "L"].map((size) => (
                  <NativeSelect.Option key={size} value={size}>
                    {size}
                  </NativeSelect.Option>
                ))}
              </NativeSelect.Control>
            </NativeSelect.Root>
          )}
        />
      </Field>

      <Field id="assignee-error" error={errors.assignee?.message}>
        <Controller
          name="assignee"
          control={control}
          render={({ field, fieldState }) => (
            <Select.Root
              value={field.value || null}
              onValueChange={(value) => field.onChange(value ?? "")}
              invalid={fieldState.invalid}
              name={field.name}
              itemToString={(id: string) => names.current[id] ?? id}
            >
              <Select.Label>Assignee (async, paginated)</Select.Label>
              <Select.Control>
                <Select.Trigger
                  ref={field.ref}
                  onBlur={field.onBlur}
                  aria-describedby={errors.assignee ? "assignee-error" : undefined}
                >
                  <Select.Value placeholder="Pick a person" />
                  <Select.Indicator>▾</Select.Indicator>
                </Select.Trigger>
              </Select.Control>
              <Select.Popover>
                <Select.List>
                  {people.map((person) => (
                    <Select.Item key={person.id} value={person.id}>
                      {person.name}
                    </Select.Item>
                  ))}
                  <Select.LoadMore
                    isLoading={loading}
                    hasMore={more}
                    onLoadMore={() => loadPage(page + 1)}
                  >
                    Loading…
                  </Select.LoadMore>
                </Select.List>
              </Select.Popover>
            </Select.Root>
          )}
        />
      </Field>

      <div className="actions">
        <button type="submit">Submit</button>
        <button type="reset">Reset</button>
      </div>
      <pre aria-live="polite">{result || "Submit to see the validated values."}</pre>
    </form>
  );
}

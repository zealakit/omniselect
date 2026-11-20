"use client";

import { NativeSelect } from "@zealakit/omniselect-react/native";
import { Select } from "@zealakit/omniselect-react/select";
import { AsyncSelect } from "./async-select";
import { FormDemo } from "./form-demo";
import { PopoverSearch } from "./popover-search";
import { type FormEvent, useState } from "react";

const fruits = ["apple", "banana", "cherry"];

export function NativeDemo() {
  const [fruit, setFruit] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(
      JSON.stringify([...new FormData(event.currentTarget).entries()]),
    );
  }

  return (
    <>
      <form onSubmit={onSubmit}>
        <div className="field">
          <NativeSelect.Root<string>
            name="fruit"
            required
            value={fruit}
            onValueChange={setFruit}
          >
            <NativeSelect.Label>Fruit</NativeSelect.Label>
            <NativeSelect.Control>
              <NativeSelect.Option value={null} disabled>
                Choose a fruit…
              </NativeSelect.Option>
              {fruits.map((item) => (
                <NativeSelect.Option key={item} value={item}>
                  {item}
                </NativeSelect.Option>
              ))}
            </NativeSelect.Control>
          </NativeSelect.Root>
          <button type="submit">Submit</button>
        </div>
        <p>Value: {fruit ?? "none"}</p>
        <pre>{submitted}</pre>
      </form>
      <h2>Select</h2>
      <div className="field">
        <Select.Root
          defaultValue="apple"
          itemToString={(value: string) => value}
        >
          <Select.Label>Fruit</Select.Label>
          <Select.Control>
            <span className="select-control">
              <Select.Trigger>
                <Select.Value placeholder="Pick a fruit" />
                <Select.Indicator>▾</Select.Indicator>
              </Select.Trigger>
              <Select.Clear>×</Select.Clear>
            </span>
          </Select.Control>
          <Select.Popover>
            <Select.List>
              {["apple", "banana", "cherry", "date"].map((name) => (
                <Select.Item
                  key={name}
                  value={name}
                  disabled={name === "cherry"}
                >
                  {name}
                  <Select.ItemIndicator>✓</Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popover>
        </Select.Root>
      </div>
      <h2>Combobox</h2>
      <div className="field">
        <Select.Root>
          <Select.Label>Search fruit</Select.Label>
          <Select.Control>
            <span className="select-control">
              <Select.Input placeholder="Type to filter" />
              <Select.Trigger>
                <Select.Indicator>▾</Select.Indicator>
              </Select.Trigger>
              <Select.Clear>×</Select.Clear>
            </span>
          </Select.Control>
          <Select.Popover>
            <Select.List>
              {["apple", "apricot", "banana", "cherry", "date"].map((name) => (
                <Select.Item key={name} value={name}>
                  {name}
                </Select.Item>
              ))}
              <Select.Empty>No results</Select.Empty>
            </Select.List>
          </Select.Popover>
        </Select.Root>
      </div>
      <h2>Multiple (with chips)</h2>
      <div className="field">
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
              {["apple", "banana", "cherry", "date"].map((name) => (
                <Select.Item key={name} value={name}>
                  {name}
                  <Select.ItemIndicator>✓</Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popover>
        </Select.Root>
      </div>
      <h2>Async search with LoadMore</h2>
      <div className="field">
        <AsyncSelect />
      </div>
      <h2>Popover search</h2>
      <div className="field">
        <PopoverSearch />
      </div>
      <div className="field">
        <PopoverSearch multiple />
      </div>
      <h2>Forms: react-hook-form + zod</h2>
      <FormDemo />
    </>
  );
}

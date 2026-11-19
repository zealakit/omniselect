"use client";

import { NativeSelect } from "@zealakit/omniselect-react/native";
import { Select } from "@zealakit/omniselect-react/select";
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
    </>
  );
}

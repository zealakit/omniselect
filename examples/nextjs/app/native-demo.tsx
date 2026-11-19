"use client";

import { NativeSelect } from "@zealakit/omniselect-react/native";
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
  );
}

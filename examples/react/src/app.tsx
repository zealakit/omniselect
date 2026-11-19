import { NativeSelect } from "@zealakit/omniselect-react/native";
import { Select } from "@zealakit/omniselect-react/select";
import { type FormEvent, useState } from "react";

type Fruit = { id: number; name: string };

const fruits: Fruit[] = [
  { id: 1, name: "Apple" },
  { id: 2, name: "Banana" },
  { id: 3, name: "Cherry" },
];

export function App() {
  const [fruit, setFruit] = useState<Fruit | null>(null);
  const [submitted, setSubmitted] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(
      JSON.stringify([...new FormData(event.currentTarget).entries()]),
    );
  }

  return (
    <main className="page">
      <p className="eyebrow">@zealakit/omniselect-react</p>
      <h1>NativeSelect</h1>
      <form onSubmit={onSubmit}>
        <div className="field">
          <NativeSelect.Root<Fruit>
            name="fruit"
            required
            value={fruit}
            onValueChange={setFruit}
            itemToKey={(value) => String(value.id)}
          >
            <NativeSelect.Label>Fruit</NativeSelect.Label>
            <NativeSelect.Control>
              <NativeSelect.Option value={null} disabled>
                Choose a fruit…
              </NativeSelect.Option>
              {fruits.map((item) => (
                <NativeSelect.Option key={item.id} value={item}>
                  {item.name}
                </NativeSelect.Option>
              ))}
            </NativeSelect.Control>
          </NativeSelect.Root>
          <button type="submit">Submit</button>
        </div>
      </form>
      <p>Value: {fruit?.name ?? "none"}</p>
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
      <pre>{submitted}</pre>
    </main>
  );
}

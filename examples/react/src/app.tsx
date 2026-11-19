import { NativeSelect } from "@zealakit/omniselect-react/native";
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
      <pre>{submitted}</pre>
    </main>
  );
}

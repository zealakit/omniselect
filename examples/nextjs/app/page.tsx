import { NativeDemo } from "./native-demo";

// Server Component shell: the server renders the default option, the Client
// Component hydrates it.
export default function Page() {
  return (
    <main className="page">
      <p className="eyebrow">@zealakit/omniselect-react</p>
      <h1>NativeSelect</h1>
      <NativeDemo />
    </main>
  );
}

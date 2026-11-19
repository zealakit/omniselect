import { createNativeSelect } from "@zealakit/omniselect-vanilla/native";
import { createSelect } from "@zealakit/omniselect-vanilla/select";
import { z } from "zod";

const schema = z.object({
  country: z.string().min(1, "Pick a country"),
  fruits: z
    .array(z.string())
    .min(1, "Pick at least one fruit")
    .max(3, "Pick at most three fruits"),
  size: z.string().min(1, "Pick a size"),
  assignee: z.string().min(1, "Pick an assignee"),
});
const ORDER = ["country", "fruits", "size", "assignee"] as const;
type Field = (typeof ORDER)[number];

const form = document.getElementById("demo-form") as HTMLFormElement;
const result = document.getElementById("form-result") as HTMLElement;
const root = (id: string) => document.getElementById(id) as HTMLElement;

// `name` adds a hidden native <select> inside the root, so the values join FormData.
const country = createSelect(root("f-country"), { name: "country" });
const fruits = createSelect(root("f-fruits"), {
  name: "fruits",
  multiple: true,
  maxSelected: 4,
});
const size = createNativeSelect(root("f-size"));
const assignee = createSelect(root("f-assignee"), {
  name: "assignee",
  onLoadMore: () => loadPage(page + 1),
});

const handles: Record<Field, { setInvalid: (invalid: boolean) => void }> = {
  country,
  fruits,
  size,
  assignee,
};

// Fake paginated API for the async field.
const PEOPLE = Array.from({ length: 42 }, (_, i) => ({
  id: `u${i + 1}`,
  name: `Person ${i + 1}`,
}));
const PAGE = 8;
let page = 0;
function loadPage(next: number) {
  assignee.setLoadMore({ isLoading: true });
  setTimeout(() => {
    const list = root("f-assignee").ownerDocument.querySelector(
      "[data-part=list]:has([data-part=load-more])",
    ) as HTMLElement;
    const sentinel = list.querySelector("[data-part=load-more]") as HTMLElement;
    for (const person of PEOPLE.slice(next * PAGE, (next + 1) * PAGE)) {
      const item = document.createElement("div");
      item.dataset.part = "item";
      item.dataset.value = person.id;
      item.textContent = person.name;
      sentinel.before(item);
    }
    page = next;
    assignee.refresh();
    assignee.setLoadMore({
      isLoading: false,
      hasMore: (next + 1) * PAGE < PEOPLE.length,
    });
  }, 250);
}
assignee.setLoadMore({ hasMore: true });
loadPage(0);

function showErrors(errors: Partial<Record<Field, string>>): void {
  for (const name of ORDER) {
    const message = errors[name];
    const el = document.getElementById(`${name}-error`) as HTMLElement;
    el.hidden = !message;
    el.textContent = message ?? "";
    handles[name].setInvalid(!!message);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const parsed = schema.safeParse({
    country: String(data.get("country") ?? ""),
    fruits: data.getAll("fruits").map(String),
    size: String(data.get("size") ?? ""),
    assignee: String(data.get("assignee") ?? ""),
  });
  if (parsed.success) {
    showErrors({});
    result.textContent = JSON.stringify(parsed.data, null, 2);
    return;
  }
  const errors: Partial<Record<Field, string>> = {};
  for (const issue of parsed.error.issues) {
    const name = issue.path[0] as Field;
    errors[name] ??= issue.message;
  }
  showErrors(errors);
  result.textContent = "Submit to see the validated values.";
  const first = ORDER.find((name) => errors[name]) as Field;
  document
    .querySelector<HTMLElement>(
      `[data-field="${first}"] input, [data-field="${first}"] [data-part="trigger"], [data-field="${first}"] select`,
    )
    ?.focus();
});

form.addEventListener("reset", () => {
  showErrors({});
  result.textContent = "Submit to see the validated values.";
});

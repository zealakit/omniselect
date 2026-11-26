import { Select, type SelectRootProps } from "@zealakit/omniselect-react/select";

const FRUITS = [
  "apple",
  "apricot",
  "banana",
  "blueberry",
  "cherry",
  "date",
  "elderberry",
  "fig",
  "grape",
];

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

/** The search box lives inside the popover; the outer trigger stays a plain select control. */
export function PopoverSearch({ multiple = false }: { multiple?: boolean }) {
  return (
    <Select.Root
      {...((multiple
        ? { multiple: true, defaultValue: ["apple"] }
        : {}) as SelectRootProps<string>)}
      itemToString={(value: string) => value}
    >
      <Select.Label>
        {multiple ? "Fruits (search in the popover, multiple)" : "Fruit (search in the popover)"}
      </Select.Label>
      <Select.Control>
        <Select.Trigger>
          <Select.Value placeholder="Pick a fruit">
            {multiple
              ? ({ items, remove }) =>
                  items.map((item) => (
                    <span
                      key={item.key}
                      className="chip"
                      onClick={(event) => {
                        event.stopPropagation();
                        remove(item.value);
                      }}
                    >
                      {item.label} ×
                    </span>
                  ))
              : undefined}
          </Select.Value>
          <Select.Indicator>▾</Select.Indicator>
        </Select.Trigger>
      </Select.Control>
      <Select.Popover>
        <div className="search">
          <SearchIcon />
          <Select.Input placeholder="Search fruit…" />
        </div>
        <Select.List>
          {FRUITS.map((name) => (
            <Select.Item key={name} value={name}>
              {name}
              <Select.ItemIndicator>✓</Select.ItemIndicator>
            </Select.Item>
          ))}
          <Select.Empty>No results</Select.Empty>
        </Select.List>
      </Select.Popover>
    </Select.Root>
  );
}

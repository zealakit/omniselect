"use client";

import { Select } from "@zealakit/omniselect-react/select";
import { useEffect, useRef, useState } from "react";

const ALL = Array.from({ length: 87 }, (_, i) => `Item ${i + 1}`);
const PAGE = 10;

/** Fake API: filters by query and returns one page after a short delay. */
function fetchPage(query: string, page: number): Promise<{ rows: string[]; more: boolean }> {
  const all = ALL.filter((name) => name.toLowerCase().includes(query.toLowerCase()));
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          rows: all.slice(page * PAGE, (page + 1) * PAGE),
          more: (page + 1) * PAGE < all.length,
        }),
      300,
    ),
  );
}

export function AsyncSelect() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const request = useRef(0);

  function load(nextQuery: string, nextPage: number) {
    const id = ++request.current;
    setLoading(true);
    void fetchPage(nextQuery, nextPage).then(({ rows, more: hasMore }) => {
      if (id !== request.current) return; // a newer search superseded this one
      setItems((current) => (nextPage === 0 ? rows : [...current, ...rows]));
      setPage(nextPage);
      setMore(hasMore);
      setLoading(false);
    });
  }

  useEffect(() => {
    const timer = setTimeout(() => load(query, 0), 250); // debounce typing
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Select.Root
      filter={false}
      itemToString={(value: string) => value}
      onInputChange={(text, reason) => reason === "input" && setQuery(text)}
    >
      <Select.Label>Async search</Select.Label>
      <Select.Control>
        <span className="select-control">
          <Select.Input placeholder="Search 87 items" />
          <Select.Trigger>
            <Select.Indicator>▾</Select.Indicator>
          </Select.Trigger>
        </span>
      </Select.Control>
      <Select.Popover>
        <Select.List>
          {items.map((name) => (
            <Select.Item key={name} value={name}>
              {name}
            </Select.Item>
          ))}
          <Select.Empty>No results</Select.Empty>
          <Select.LoadMore
            isLoading={loading}
            hasMore={more}
            onLoadMore={() => load(query, page + 1)}
          >
            Loading…
          </Select.LoadMore>
        </Select.List>
      </Select.Popover>
    </Select.Root>
  );
}

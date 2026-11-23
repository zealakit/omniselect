import assert from "node:assert/strict";
import { test } from "node:test";
import { createLoadMoreGuard, createSelectMachine, findScrollParent } from "../dist/index.js";

function manualClock() {
  const tasks: { fn: () => void; id: number }[] = [];
  let nextId = 1;
  return {
    setTimeout: (fn: () => void) => {
      const id = nextId++;
      tasks.push({ fn, id });
      return id;
    },
    clearTimeout: (handle: unknown) => {
      const at = tasks.findIndex((t) => t.id === handle);
      if (at !== -1) tasks.splice(at, 1);
    },
    run: () => {
      for (const task of tasks.splice(0)) task.fn();
    },
  };
}

const open = (
  over: Partial<Parameters<ReturnType<typeof createLoadMoreGuard>["sync"]>[0]> = {},
) => ({
  open: true,
  hasMore: true,
  isLoading: false,
  onLoadMore: () => {},
  ...over,
});

test("fires once when intersecting and open", () => {
  let calls = 0;
  const guard = createLoadMoreGuard(manualClock());
  guard.sync(open({ onLoadMore: () => (calls += 1) }));
  guard.setIntersecting(true);
  guard.setIntersecting(true);
  assert.equal(calls, 1);
});

test("does not fire while closed, loading, or without more pages", () => {
  let calls = 0;
  const onLoadMore = () => (calls += 1);
  const guard = createLoadMoreGuard(manualClock());
  guard.sync(open({ open: false, onLoadMore }));
  guard.setIntersecting(true);
  guard.sync(open({ isLoading: true, onLoadMore }));
  guard.sync(open({ hasMore: false, onLoadMore }));
  assert.equal(calls, 0);
});

test("a loading cycle re-arms; a still-visible sentinel loads the next page", () => {
  let calls = 0;
  const onLoadMore = () => (calls += 1);
  const guard = createLoadMoreGuard(manualClock());
  guard.sync(open({ onLoadMore }));
  guard.setIntersecting(true);
  guard.sync(open({ isLoading: true, onLoadMore }));
  guard.setIntersecting(true);
  assert.equal(calls, 1);
  guard.sync(open({ isLoading: false, onLoadMore }));
  assert.equal(calls, 2);
});

test("a loader that never reports isLoading settles after the timeout", () => {
  const clock = manualClock();
  let calls = 0;
  const guard = createLoadMoreGuard(clock);
  guard.sync(open({ onLoadMore: () => (calls += 1) }));
  guard.setIntersecting(true);
  guard.setIntersecting(true);
  assert.equal(calls, 1);
  clock.run();
  assert.equal(calls, 2);
});

test("closing resets the guard; request() works without the sentinel", () => {
  let calls = 0;
  const onLoadMore = () => (calls += 1);
  const guard = createLoadMoreGuard(manualClock());
  guard.sync(open({ onLoadMore }));
  assert.equal(guard.request(), true);
  assert.equal(guard.request(), false);
  guard.sync(open({ open: false, onLoadMore }));
  guard.sync(open({ onLoadMore }));
  assert.equal(guard.request(), true);
  assert.equal(calls, 2);
  guard.destroy();
});

test("machine: reaching the last item asks for more; loading sets aria-busy and announces", () => {
  const machine = createSelectMachine<string>({ rootId: "r" });
  for (const k of ["a", "b"]) machine.collection.register({ key: k, value: k, textValue: k });
  let requests = 0;
  machine.registerLoadMore({
    request: () => {
      requests += 1;
      return true;
    },
  });
  machine.open("imperative", "first");
  machine.onTriggerKeyDown({ key: "ArrowDown" });
  assert.equal(requests, 1);
  machine.setLoading(true);
  assert.equal(machine.attrs.list()["aria-busy"], "true");
  assert.equal(machine.store.get().announcement, "Loading more results");
  machine.setLoading(false);
  assert.equal(machine.attrs.list()["aria-busy"], undefined);
  assert.equal(machine.store.get().announcement, "2 results");
});

test("findScrollParent finds the nearest scrolling ancestor", () => {
  const outer = document.createElement("div");
  outer.style.overflowY = "auto";
  const inner = document.createElement("div");
  const sentinel = document.createElement("div");
  outer.append(inner);
  inner.append(sentinel);
  document.body.append(outer);
  assert.equal(findScrollParent(sentinel), outer);
  assert.equal(findScrollParent(outer), null);
  outer.remove();
});

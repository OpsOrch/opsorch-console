import assert from "node:assert";
import test from "node:test";
import type React from "react";

test("useAsyncState exposes transitions and normalizes errors", async () => {
  const updates: unknown[] = [];
  const fakeUseState: typeof import("react").useState = <S,>(initial: S | (() => S)) => {
    const current = typeof initial === "function" ? (initial as () => S)() : initial;
    const setState = (next: React.SetStateAction<S>) => {
      const resolved = typeof next === "function" ? (next as (prev: S) => S)(current) : next;
      updates.push(resolved);
    };
    return [current, setState];
  };

  const { useAsyncState } = await import("../app/lib/hooks.ts");

  const asyncState = useAsyncState(fakeUseState);
  assert.equal(asyncState.loading, false);
  assert.equal(asyncState.error, "");

  asyncState.start();
  asyncState.fail(new Error("boom"));
  asyncState.setError("custom");
  asyncState.fail(42 as unknown as Error);
  asyncState.succeed();

  assert.deepEqual(updates, [
    { loading: true, error: "" },
    { loading: false, error: "boom" },
    { loading: false, error: "custom" },
    { loading: false, error: "42" },
    { loading: false, error: "" },
  ]);
});

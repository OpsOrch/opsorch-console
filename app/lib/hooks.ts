import { useMemo, useState } from "react";

type AsyncState = { loading: boolean; error: string };

type AsyncStateHooks = {
  stateHook?: typeof useState;
  memoHook?: typeof useMemo;
};

type AsyncStateArgs = typeof useState | AsyncStateHooks | undefined;

function resolveHooks(args: AsyncStateArgs) {
  if (typeof args === "function") {
    return { stateHook: args, memoHook: useMemo };
  }

  return {
    stateHook: args?.stateHook ?? useState,
    memoHook: args?.memoHook ?? useMemo,
  };
}

export function useAsyncState(args?: AsyncStateArgs) {
  const { stateHook, memoHook } = resolveHooks(args);
  const [state, setState] = stateHook<AsyncState>({ loading: false, error: "" });
  const controls = memoHook(
    () => ({
      start: () => setState({ loading: true, error: "" }),
      succeed: () => setState({ loading: false, error: "" }),
      fail: (err: unknown) =>
        setState({ loading: false, error: err instanceof Error ? err.message : String(err) }),
      setError: (msg: string) => setState({ loading: false, error: msg }),
    }),
    [setState],
  );

  return {
    ...state,
    ...controls,
  };
}

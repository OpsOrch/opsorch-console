import { useState } from "react";

type AsyncState = { loading: boolean; error: string };

export function useAsyncState(stateHook: typeof useState = useState) {
  const [state, setState] = stateHook<AsyncState>({ loading: false, error: "" });
  return {
    ...state,
    start: () => setState({ loading: true, error: "" }),
    succeed: () => setState({ loading: false, error: "" }),
    fail: (err: unknown) =>
      setState({ loading: false, error: err instanceof Error ? err.message : String(err) }),
    setError: (msg: string) => setState({ loading: false, error: msg }),
  };
}

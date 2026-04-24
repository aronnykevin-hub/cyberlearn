const HISTORY_NAMESPACE = "cyberlearn";

function getNamespaceState<T>(): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  const historyState = window.history.state;
  if (!historyState || typeof historyState !== "object") {
    return null;
  }

  return ((historyState as Record<string, unknown>)[HISTORY_NAMESPACE] as T) ?? null;
}

function writeNamespaceState<T>(state: T, method: "pushState" | "replaceState") {
  if (typeof window === "undefined") {
    return;
  }

  const nextState = {
    ...(window.history.state ?? {}),
    [HISTORY_NAMESPACE]: state,
  };

  window.history[method](nextState, "", window.location.href);
}

export function getCyberlearnHistoryState<T>(): T | null {
  return getNamespaceState<T>();
}

export function pushCyberlearnHistoryState<T>(state: T) {
  const currentState = getNamespaceState<T>();
  if (JSON.stringify(currentState) === JSON.stringify(state)) {
    return;
  }

  writeNamespaceState(state, "pushState");
}

export function replaceCyberlearnHistoryState<T>(state: T) {
  writeNamespaceState(state, "replaceState");
}

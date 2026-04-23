import type { ReactNode } from "react";

export function useQuery<T>(_queryRef: unknown, _args?: unknown): T | undefined {
  return undefined;
}

export function useMutation<TArgs = unknown, TResult = unknown>(
  _mutationRef: unknown,
): (args: TArgs) => Promise<TResult | undefined> {
  return async (_args: TArgs) => undefined;
}

export function useConvexAuth(): { isAuthenticated: boolean; isLoading: boolean } {
  return { isAuthenticated: false, isLoading: false };
}

export function Authenticated({ children }: { children: ReactNode }): ReactNode {
  return children;
}

export function Unauthenticated({ children }: { children: ReactNode }): ReactNode {
  return children;
}

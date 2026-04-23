type AnyFn = (...args: unknown[]) => unknown;

type ProxyFn = AnyFn & {
  [key: string]: ProxyFn;
};

function createDeepProxy(): ProxyFn {
  const fn: AnyFn = () => undefined;
  return new Proxy(fn as ProxyFn, {
    get: () => createDeepProxy(),
    apply: () => undefined,
  });
}

export const anyApi = createDeepProxy();

export function componentsGeneric(): ProxyFn {
  return createDeepProxy();
}

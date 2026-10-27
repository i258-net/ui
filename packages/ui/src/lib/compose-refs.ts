import * as React from "react";

type PossibleRef<T> = React.Ref<T> | undefined;

/** Attach `el` to one ref; returns how to detach it again. */
function attach<T>(ref: PossibleRef<T>, el: T): () => void {
  if (typeof ref === "function") {
    // React 19 callback refs may return their own cleanup; when they do,
    // React calls that instead of calling the ref with `null`.
    const cleanup = ref(el);
    return typeof cleanup === "function" ? cleanup : () => ref(null);
  }
  if (ref) {
    ref.current = el;
    return () => {
      ref.current = null;
    };
  }
  return () => {};
}

/**
 * One callback ref that feeds several refs (object or callback), so a
 * component can keep its own ref while forwarding the consumer's. Returns a
 * cleanup, so each ref is detached exactly once per element.
 */
export function composeRefs<T>(...refs: PossibleRef<T>[]): React.RefCallback<T> {
  return (el) => {
    const detach = refs.map((ref) => attach(ref, el));
    return () => {
      for (const d of detach) d();
    };
  };
}

/** `composeRefs`, stable while the refs are. */
export function useComposedRefs<T>(...refs: PossibleRef<T>[]): React.RefCallback<T> {
  // biome-ignore lint/correctness/useExhaustiveDependencies: the rest array is the dependency list by design; callers pass a fixed arity.
  return React.useCallback(composeRefs(...refs), refs);
}

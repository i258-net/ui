import * as React from "react";
import { describe, expect, it } from "vitest";

import { composeRefs } from "./compose-refs.js";

describe("composeRefs", () => {
  it("sets object refs and clears them on cleanup", () => {
    const a = React.createRef<string>() as React.RefObject<string | null>;
    const b = React.createRef<string>() as React.RefObject<string | null>;
    const cleanup = composeRefs(a, b)("el");
    expect([a.current, b.current]).toEqual(["el", "el"]);
    (cleanup as () => void)();
    expect([a.current, b.current]).toEqual([null, null]);
  });

  it("calls callback refs, then with null — or their own cleanup instead", () => {
    const log: string[] = [];
    const plain = (el: string | null) => {
      log.push(`plain:${el}`);
    };
    const withCleanup = (el: string | null) => {
      log.push(`cleanup-ref:${el}`);
      return () => {
        log.push("cleanup-ref:cleanup");
      };
    };
    const cleanup = composeRefs<string>(plain, withCleanup, undefined, null)("el");
    expect(log).toEqual(["plain:el", "cleanup-ref:el"]);
    (cleanup as () => void)();
    expect(log).toEqual(["plain:el", "cleanup-ref:el", "plain:null", "cleanup-ref:cleanup"]);
  });
});

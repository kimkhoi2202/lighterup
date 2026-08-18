"use client";

import { useEffect, type RefObject } from "react";

interface UseResizeObserverOptions {
  ref: RefObject<HTMLElement | null>;
  onResize: (entry: ResizeObserverEntry) => void;
  box?: ResizeObserverBoxOptions;
}

/**
 * Hook to observe element size changes using ResizeObserver
 */
export function useResizeObserver({ ref, onResize, box = "content-box" }: UseResizeObserverOptions): void {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        onResize(entry);
      }
    });

    observer.observe(element, { box });

    return () => {
      observer.disconnect();
    };
  }, [ref, onResize, box]);
}


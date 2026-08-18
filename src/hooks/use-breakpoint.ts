"use client";

import { useState, useEffect } from "react";

// Tailwind CSS breakpoints
const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

type BreakpointKey = keyof typeof breakpoints;

/**
 * Hook to check if the current viewport matches a minimum breakpoint
 * @param breakpoint - The breakpoint key to check against (sm, md, lg, xl, 2xl)
 * @returns boolean indicating if viewport is >= breakpoint width
 */
export function useBreakpoint(breakpoint: BreakpointKey): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const minWidth = breakpoints[breakpoint];
    const mediaQuery = window.matchMedia(`(min-width: ${minWidth}px)`);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Listen for changes
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [breakpoint]);

  return matches;
}


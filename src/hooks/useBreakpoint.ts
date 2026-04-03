import { useState, useEffect } from 'react';

export interface Breakpoints {
  /** ≤ 640px */
  isMobile: boolean;
  /** 641–1023px */
  isTablet: boolean;
  /** ≥ 1024px */
  isDesktop: boolean;
  /** Raw window width */
  width: number;
}

/**
 * Shared responsive breakpoint hook.
 * Replaces per-component `window.innerWidth` listeners with a single,
 * consistent source of truth for responsive behaviour.
 *
 * Breakpoints:
 *   mobile  → width ≤ 640
 *   tablet  → 641 ≤ width ≤ 1023
 *   desktop → width ≥ 1024
 */
export function useBreakpoint(): Breakpoints {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  useEffect(() => {
    let rafId: number;
    const handleResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setWidth(window.innerWidth);
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return {
    isMobile: width <= 640,
    isTablet: width > 640 && width < 1024,
    isDesktop: width >= 1024,
    width,
  };
}

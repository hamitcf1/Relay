import { useState, useEffect } from 'react'

/**
 * Custom hook that uses matchMedia API for responsive breakpoint detection.
 * More efficient than resize event listeners — only fires on actual breakpoint changes.
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(
        () => window.matchMedia(query).matches
    )

    useEffect(() => {
        const mql = window.matchMedia(query)
        const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
        mql.addEventListener('change', handler)
        return () => mql.removeEventListener('change', handler)
    }, [query])

    return matches
}

/**
 * Convenience hook for mobile detection (< 768px).
 * Replaces the duplicated pattern found across DashboardPage, UserNav, etc.
 */
export function useIsMobile(): boolean {
    return useMediaQuery('(max-width: 767px)')
}

/**
 * Convenience hook for tablet detection (< 1024px).
 */
export function useIsTablet(): boolean {
    return useMediaQuery('(max-width: 1023px)')
}

import * as React from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

// Berlangganan perubahan media query (resize yang melewati breakpoint mobile).
function subscribe(callback: () => void): () => void {
  const mql = window.matchMedia(MOBILE_QUERY)
  mql.addEventListener("change", callback)
  return () => mql.removeEventListener("change", callback)
}

// Snapshot lebar viewport saat ini terhadap breakpoint mobile.
function getSnapshot(): boolean {
  return window.innerWidth < MOBILE_BREAKPOINT
}

// Default aman ketika window tidak tersedia (SSR / non-browser).
function getServerSnapshot(): boolean {
  return false
}

/**
 * Mengembalikan true jika viewport berada pada lebar mobile (< 768px).
 *
 * Memakai useSyncExternalStore agar nilai selalu sinkron dengan ukuran layar
 * tanpa memanggil setState di dalam effect (menghindari cascading render).
 */
export function useIsMobile(): boolean {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

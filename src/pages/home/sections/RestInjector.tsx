/* RestInjector — Pass 1 bridge: injects the still-native-untouched
 * sections (rooms strip, FAQ, finale, footer/companion sheet, closing
 * </main>) as HTML so mountImmersive keeps finding their [data-*] hooks
 * during the one-turn hand-off. Deleted in Pass 2. */
import { useEffect, useRef } from 'react'
import { IMMERSIVE_REST_HTML } from '../immersiveTemplate'

export function RestInjector({ innerHTML }: { innerHTML?: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const html = innerHTML ?? IMMERSIVE_REST_HTML
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = html
    return () => { if (ref.current) ref.current.innerHTML = '' }
  }, [html])
  return <div ref={ref} data-immersive-rest="" />
}

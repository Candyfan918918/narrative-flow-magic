// Server-rendered joke-card share image.
//
// The image is authored here, on the server, from the stored card row — it is
// never a client screenshot of the DOM, and every image carries the SHUTAP
// mark. Returned as SVG so the Worker needs no native rasteriser; the client
// download path draws this exact document to a canvas to produce the PNG.
import { createFileRoute } from '@tanstack/react-router'
import { ANGLE_LABEL } from '@/lib/jokes/deck'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function wrap(text: string, perLine: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > perLine && line) { lines.push(line); line = w }
    else line = (line + ' ' + w).trim()
  }
  if (line) lines.push(line)
  return lines.slice(0, 6)
}

function render(cardText: string, angleLabel: string): string {
  const lines = wrap(cardText, 26)
  const size = lines.length > 4 ? 44 : lines.length > 3 ? 50 : 58
  const startY = 470 - ((lines.length - 1) * size * 1.28) / 2
  const body = lines
    .map((l, i) => `<text x="540" y="${startY + i * size * 1.28}" text-anchor="middle" font-family="Newsreader, Georgia, serif" font-style="italic" font-size="${size}" fill="#1b0f16">${esc(l)}</text>`)
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f4f1fb"/><stop offset="0.55" stop-color="#ffffff"/><stop offset="1" stop-color="#fdf6f9"/>
    </linearGradient>
    <linearGradient id="holo" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset="0.35" stop-color="#7F77DD"/><stop offset="0.65" stop-color="#c1216b"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#bg)"/>
  <rect x="40" y="40" width="1000" height="1000" rx="64" fill="#ffffff" stroke="rgba(11,8,15,0.10)" stroke-width="2"/>
  <rect x="64" y="64" width="952" height="952" rx="48" fill="none" stroke="rgba(11,8,15,0.07)"/>
  <rect x="170" y="42" width="740" height="4" fill="url(#holo)" opacity="0.65"/>
  <text x="540" y="200" text-anchor="middle" font-family="Sora, system-ui, sans-serif" font-weight="700" font-size="24" letter-spacing="6" fill="#7F77DD">${esc(angleLabel.toUpperCase())}</text>
  ${body}
  <text x="540" y="900" text-anchor="middle" font-family="Sora, system-ui, sans-serif" font-weight="700" font-size="40" letter-spacing="-1" fill="#1b0f16">shut<tspan fill="#e7548a">ap</tspan></text>
  <text x="540" y="948" text-anchor="middle" font-family="Sora, system-ui, sans-serif" font-size="22" letter-spacing="4" fill="#8a7a84">JOKE ABOUT IT.</text>
</svg>`
}

export const Route = createFileRoute('/api/public/joke-card')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const id = url.searchParams.get('id')
        if (!id) return new Response('missing id', { status: 400 })

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const { data } = await supabaseAdmin
          .from('joke_cards')
          .select('card_text, angle')
          .eq('id', id)
          .maybeSingle()
        if (!data) return new Response('not found', { status: 404 })

        const svg = render(
          String(data.card_text),
          ANGLE_LABEL[data.angle as string] ?? String(data.angle),
        )
        return new Response(svg, {
          headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=3600',
          },
        })
      },
    },
  },
})

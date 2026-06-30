/* Mirror share sheet — shows a live pre-share preview of the Mirror card
   plus an editable caption brief, then channel chips and a consistent
   [↻ re-read] [↗ share] [close] pill row that matches the Scan share card.
   The preview is a scaled-down copy of the MirrorCard rendered from the
   pattern data so the user sees exactly what will be exported. */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { MirrorCard, type MirrorPatternView } from './mirror/MirrorCard'
import { ShareChannels, type ShareChannelKey } from './ShareChannels'

function copyToClipboard(text: string): Promise<void> {
  try { return navigator.clipboard.writeText(text) } catch { return Promise.resolve() }
}

export function MirrorShareSheet({
  open, onClose, pattern, defaultCaption, fileName, url,
}: {
  open: boolean
  onClose: () => void
  pattern: MirrorPatternView
  defaultCaption: string
  fileName: string
  url?: string
}) {
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [caption, setCaption] = useState(defaultCaption)
  const [runId] = useState(0)
  const [scaledH, setScaledH] = useState<number>(420)
  const previewRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const SHARE_W = 340
  const PREVIEW_SCALE = 0.62

  useEffect(() => { setCaption(defaultCaption) }, [defaultCaption])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    const el = innerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setScaledH(Math.ceil(el.getBoundingClientRect().height * PREVIEW_SCALE))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [open, runId])

  const shareUrl = useMemo(
    () => url || (typeof window !== 'undefined' ? window.location.origin + '/mirror' : 'https://shutap.com/mirror'),
    [url],
  )

  if (!open) return null

  const toast = (m: string) => {
    setToastMsg(m)
    window.setTimeout(() => setToastMsg(null), 2200)
  }

  const enc = encodeURIComponent

  const exportPng = async (): Promise<string | null> => {
    const node = previewRef.current?.querySelector('article') as HTMLElement | null
    if (!node) return null
    try {
      return await toPng(node, { pixelRatio: 2, cacheBust: true, backgroundColor: '#100810' })
    } catch { return null }
  }

  const onPick = async (kind: ShareChannelKey) => {
    if (kind === 'share') { await onNativeShare(); return }
    const text = caption
    if (kind === 'sms') { window.open('sms:?&body=' + enc(text + '\n' + shareUrl), '_blank'); return }
    if (kind === 'x') { window.open('https://twitter.com/intent/tweet?text=' + enc(text) + '&url=' + enc(shareUrl), '_blank'); return }
    if (kind === 'whatsapp') { window.open('https://wa.me/?text=' + enc(text + '\n' + shareUrl), '_blank'); return }
    if (kind === 'instagram') {
      await copyToClipboard(text + '\n' + shareUrl)
      toast('caption copied — paste it on your story')
      window.open('https://instagram.com', '_blank')
      return
    }
    if (kind === 'tiktok') {
      await copyToClipboard(text + '\n' + shareUrl)
      toast('caption copied — paste it on your story')
      window.open('https://tiktok.com', '_blank')
      return
    }
    if (kind === 'copy') {
      await copyToClipboard(text + '\n' + shareUrl)
      toast('copied to clipboard')
      return
    }
    if (kind === 'download') {
      const png = await exportPng()
      if (!png) { toast('could not export image'); return }
      const a = document.createElement('a')
      a.href = png
      a.download = fileName
      a.click()
      toast('image saved')
    }
  }

  const onNativeShare = async () => {
    const text = caption + '\n' + shareUrl
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean; share?: (d: ShareData) => Promise<void> }
    const png = await exportPng()
    try {
      if (png && nav.canShare && nav.share) {
        const blob = await (await fetch(png)).blob()
        const file = new File([blob], fileName, { type: 'image/png' })
        if (nav.canShare({ files: [file], text, url: shareUrl })) {
          await nav.share({ files: [file], text, url: shareUrl })
          return
        }
      }
      if (nav.share) { await nav.share({ text, url: shareUrl }); return }
    } catch { /* fall through */ }
    await copyToClipboard(text)
    toast('copied — paste anywhere')
  }

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 220,
        background: 'rgba(8,4,10,.82)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: 0, animation: 'mss-fade .2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onWheelCapture={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 460,
          maxHeight: '94dvh',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          background: 'linear-gradient(180deg,#1a0e1c 0%, #120815 100%)',
          border: '.5px solid rgba(255,255,255,.12)',
          borderRadius: '22px 22px 0 0',
          padding: '14px 16px calc(18px + env(safe-area-inset-bottom,0px))',
          boxShadow: '0 -20px 60px rgba(0,0,0,.6)',
          display: 'flex', flexDirection: 'column', gap: 14,
          animation: 'mss-rise .26s cubic-bezier(.2,.9,.25,1)',
        }}
      >
        {/* drag handle */}
        <div aria-hidden style={{
          width: 38, height: 4, borderRadius: 4,
          background: 'rgba(255,255,255,.22)',
          alignSelf: 'center', marginBottom: 2,
        }} />

        {/* PREAMBLE — sparkle line at top */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          fontFamily: "'Newsreader',serif", fontStyle: 'italic',
          fontSize: 13, lineHeight: 1.45, color: '#b89bac',
          padding: '0 4px',
        }}>
          <span aria-hidden style={{ color: '#e7548a', fontSize: 11, letterSpacing: '-.1em', flex: '0 0 auto', lineHeight: 1.6 }}>✦✦</span>
          <span>your mirror named this one. share the whole card — never the signals behind it.</span>
        </div>

        {/* CARD PREVIEW — full MirrorCard rendered at share width then
            uniformly scaled, centered, and fully contained (no clipping). */}
        <div
          ref={previewRef}
          key={runId}
          style={{
            position: 'relative',
            width: SHARE_W * PREVIEW_SCALE,
            height: scaledH,
            margin: '0 auto',
            overflow: 'hidden',
          }}
        >
          <div
            ref={innerRef}
            style={{
              width: SHARE_W,
              transform: `scale(${PREVIEW_SCALE})`,
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <MirrorCard p={pattern} />
          </div>
        </div>



        {/* CAPTION — editable */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{
            fontFamily: 'Sora,sans-serif', fontSize: 9.5, fontWeight: 700,
            letterSpacing: '.28em', color: '#7d6a76', textTransform: 'uppercase',
          }}>your caption · edit freely</div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            spellCheck={false}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,.04)',
              border: '.5px solid rgba(255,255,255,.12)',
              borderRadius: 14,
              padding: '11px 13px',
              color: '#f7e8f0',
              fontFamily: 'Newsreader,serif',
              fontStyle: 'italic',
              fontSize: 14.5,
              lineHeight: 1.45,
              resize: 'none',
              outline: 'none',
            }}
          />
        </div>

        {/* CHANNELS — share pill first, then platform pills */}
        <ShareChannels
          onPick={onPick}
          channels={['share', 'sms', 'x', 'whatsapp', 'instagram', 'tiktok', 'copy']}
        />
        <div style={{
          textAlign: 'center', fontFamily: "'Newsreader',serif", fontStyle: 'italic',
          fontSize: 12.5, color: '#9b7d8c', marginTop: -4,
        }}>only the card leaves — never the signals behind it.</div>

        {toastMsg && (
          <div style={{
            position: 'fixed', left: '50%', bottom: 28, transform: 'translateX(-50%)',
            background: 'rgba(20,10,22,.96)', color: '#f7e8f0',
            padding: '10px 16px', borderRadius: 999,
            border: '.5px solid rgba(255,255,255,.16)',
            fontFamily: 'Sora,sans-serif', fontSize: 12, zIndex: 240,
          }}>{toastMsg}</div>
        )}
      </div>

      <style>{`
        @keyframes mss-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes mss-rise { from { transform: translateY(20px); opacity: 0 } to { transform: none; opacity: 1 } }
      `}</style>
    </div>
  )
}

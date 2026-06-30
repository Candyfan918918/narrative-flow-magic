/* Mirror share sheet — mirrors the Scan share card's channel pill UI so
   external sharing (SMS / X / Instagram / TikTok / WhatsApp / copy / save
   image) is consistent across surfaces. Renders the same logo SVGs, brand
   colors, and onShare flow used by ScanShareCard. */
import { useEffect, useState } from 'react'
import { toPng } from 'html-to-image'

const LOGOS: Record<string, string> = {
  sms: '<svg viewBox="0 0 24 24" fill="#fff" style="width:16px;height:16px"><path d="M12 2C6.5 2 2 5.8 2 10.5c0 2.5 1.3 4.7 3.3 6.2-.2 1.4-.9 2.8-1.9 3.9 1.7-.2 3.4-.8 4.8-1.7 1.2.3 2.5.5 3.8.5 5.5 0 10-3.8 10-8.5S17.5 2 12 2z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="#fff" style="width:14px;height:14px"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="#fff" style="width:16px;height:16px"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 01-1.38-.9 3.72 3.72 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 3.68A6.16 6.16 0 1018.16 12 6.16 6.16 0 0012 5.84zm0 10.16A4 4 0 1116 12a4 4 0 01-4 4zm6.4-10.4a1.44 1.44 0 11-1.44-1.44 1.44 1.44 0 011.44 1.44z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" fill="#fff" style="width:15px;height:15px"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.04-.1z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="#fff" style="width:16px;height:16px"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448zM6.597 20.13c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>',
}

const TARGETS: [string, string][] = [
  ['sms', 'Text'],
  ['x', 'X'],
  ['instagram', 'Instagram'],
  ['tiktok', 'TikTok'],
  ['whatsapp', 'WhatsApp'],
  ['copy', 'copy'],
  ['download', 'save image'],
]

function bg(k: string): string {
  if (k === 'instagram') return 'linear-gradient(135deg,#feda75,#d62976 45%,#962fbf 75%,#4f5bd5)'
  if (k === 'x' || k === 'tiktok') return '#0b080f'
  if (k === 'whatsapp') return '#25D366'
  if (k === 'sms') return '#34C759'
  return 'rgba(255,255,255,.12)'
}

function copyToClipboard(text: string): Promise<void> {
  try { return navigator.clipboard.writeText(text) } catch { return Promise.resolve() }
}

export function MirrorShareSheet({
  open, onClose, getNode, caption, fileName, url,
}: {
  open: boolean
  onClose: () => void
  getNode: () => HTMLElement | null
  caption: string
  fileName: string
  url?: string
}) {
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const toast = (m: string) => {
    setToastMsg(m)
    window.setTimeout(() => setToastMsg(null), 2200)
  }

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.origin + '/mirror' : 'https://shutap.com/mirror')
  const enc = encodeURIComponent

  const onShare = async (kind: string) => {
    const text = caption
    if (kind === 'sms') { window.open('sms:?&body=' + enc(text + '\n' + shareUrl), '_blank'); return }
    if (kind === 'x') { window.open('https://twitter.com/intent/tweet?text=' + enc(text) + '&url=' + enc(shareUrl), '_blank'); return }
    if (kind === 'whatsapp') { window.open('https://wa.me/?text=' + enc(text + '\n' + shareUrl), '_blank'); return }
    if (kind === 'instagram') {
      await copyToClipboard(text + '\n' + shareUrl)
      toast('caption copied — paste it on your story/post')
      window.open('https://instagram.com', '_blank')
      return
    }
    if (kind === 'tiktok') {
      await copyToClipboard(text + '\n' + shareUrl)
      toast('caption copied — paste it on your story/post')
      window.open('https://tiktok.com', '_blank')
      return
    }
    if (kind === 'copy') {
      await copyToClipboard(text + '\n' + shareUrl)
      toast('copied to clipboard')
      return
    }
    if (kind === 'download') {
      const node = getNode()
      if (!node) { toast('could not find card'); return }
      try {
        const png = await toPng(node, { pixelRatio: 2, cacheBust: true, backgroundColor: '#100810' })
        const a = document.createElement('a')
        a.href = png
        a.download = fileName
        a.click()
        toast('image saved')
      } catch {
        toast('could not export image')
      }
    }
  }

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 220,
        background: 'rgba(8,4,10,.78)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: 18, animation: 'mss-fade .2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(420px, 100%)',
          background: 'linear-gradient(180deg,#1a0e1c 0%, #120815 100%)',
          border: '.5px solid rgba(255,255,255,.12)',
          borderRadius: 20,
          padding: '18px 16px calc(18px + env(safe-area-inset-bottom,0px))',
          boxShadow: '0 24px 60px rgba(0,0,0,.55)',
          display: 'flex', flexDirection: 'column', gap: 14,
          animation: 'mss-rise .26s cubic-bezier(.2,.9,.25,1)',
        }}
      >
        <div style={{
          textAlign: 'center',
          fontFamily: "'Sora',sans-serif", fontSize: 10.5,
          letterSpacing: '.28em', color: '#9b8090', textTransform: 'uppercase',
        }}>share this card</div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {TARGETS.map(([k, label]) => (
            <button
              key={k}
              onClick={() => onShare(k)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '9px 14px', borderRadius: 999,
                border: '.5px solid rgba(255,255,255,.18)',
                background: bg(k),
                color: '#fff',
                fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <span dangerouslySetInnerHTML={{ __html: LOGOS[k] || '' }} />
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'none', border: 0,
            color: '#c9a3b6', fontFamily: 'Newsreader,serif', fontStyle: 'italic',
            fontSize: 13.5, cursor: 'pointer', alignSelf: 'center', padding: '4px 12px',
          }}
        >close</button>

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
        @keyframes mss-rise { from { transform: translateY(16px); opacity: 0 } to { transform: none; opacity: 1 } }
      `}</style>
    </div>
  )
}

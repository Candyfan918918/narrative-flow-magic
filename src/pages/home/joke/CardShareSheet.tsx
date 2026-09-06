// "send it somewhere" — the share sheet.
//
// No channel is ever gated: the tier decides what the FILE looks like, never
// where it is allowed to go. The caption arrives written and stays editable,
// and the save button says out loud what you are about to get.
import { useEffect, useState } from 'react'
import { ShareChannels, type ShareChannelKey } from '@/components/ShareChannels'
import type { JokeCard, JokeTier } from '@/lib/jokes/deck'
import { exportSpec } from '@/lib/jokes/deck'
import { defaultCaption, cardImageUrl } from './jokeClient'
import { Button, Sheet, SORA, NEWS, INK, MUTED, FAINT } from './ui'

const FREE_CHANNELS: ShareChannelKey[] = ['sms', 'whatsapp', 'instagram', 'tiktok', 'x', 'copy']
const MEMBER_CHANNELS: ShareChannelKey[] = ['share', 'sms', 'whatsapp', 'instagram', 'tiktok', 'x', 'copy']

export function CardShareSheet({
  open,
  card,
  tier,
  saving,
  onClose,
  onSave,
  onSaveSet,
  onNote,
}: {
  open: boolean
  card: JokeCard | null
  tier: JokeTier
  saving: boolean
  onClose: () => void
  onSave: () => void
  onSaveSet: () => void
  onNote: (message: string) => void
}) {
  const [caption, setCaption] = useState('')

  useEffect(() => {
    if (card) setCaption(defaultCaption(card))
  }, [card])

  if (!card) return null
  const spec = exportSpec(tier)
  const url = typeof window === 'undefined' || !card.id ? 'https://shutap.com' : window.location.origin + cardImageUrl(card.id)

  function post(channel: ShareChannelKey) {
    const body = `${caption}\n${url}`
    const enc = encodeURIComponent
    if (channel === 'share' && navigator.share) {
      void navigator.share({ text: caption, url }).catch(() => {})
      return
    }
    if (channel === 'x') { window.open(`https://twitter.com/intent/tweet?text=${enc(caption)}&url=${enc(url)}`, '_blank'); return }
    if (channel === 'whatsapp') { window.open(`https://wa.me/?text=${enc(body)}`, '_blank'); return }
    if (channel === 'sms') { window.open(`sms:?&body=${enc(body)}`, '_blank'); return }
    if (channel === 'instagram' || channel === 'tiktok') {
      void navigator.clipboard?.writeText(body).catch(() => {})
      onNote('caption copied. the image is in your camera roll once you save it.')
      window.open(channel === 'instagram' ? 'https://instagram.com' : 'https://tiktok.com', '_blank')
      return
    }
    void navigator.clipboard?.writeText(body).catch(() => {})
    onNote('copied. paste it wherever.')
  }

  return (
    <Sheet open={open} onClose={onClose} width={520}>
      <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 20, letterSpacing: '-.03em', color: INK }}>
        send it somewhere
      </div>

      <ShareChannels
        channels={tier === 'paying' ? MEMBER_CHANNELS : FREE_CHANNELS}
        onPick={post}
        surface="light"
        style={{ padding: '2px 0 4px' }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ fontFamily: SORA, fontWeight: 800, fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', color: FAINT }}>
          caption, ready to paste
        </div>
        <textarea
          rows={3}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          style={{
            width: '100%', resize: 'vertical', borderRadius: 14, padding: '12px 14px',
            border: '1px solid rgba(11,8,15,.14)', background: '#fff', color: INK,
            fontFamily: NEWS, fontStyle: 'italic', fontSize: 16, lineHeight: 1.45, outline: 'none',
          }}
        />
      </div>

      <Button onClick={onSave} disabled={saving} full>
        {saving ? 'rendering…' : '↓ save image'}
      </Button>
      {tier === 'paying' ? (
        <Button onClick={onSaveSet} disabled={saving} variant="secondary" full>
          ↓ save the set, clean
        </Button>
      ) : null}
      <div style={{ fontFamily: SORA, fontSize: 12.5, color: MUTED, textAlign: 'center' }}>
        {tier === 'paying' ? 'no mark · print-size · no watermark on any export' : spec.note}
      </div>
    </Sheet>
  )
}

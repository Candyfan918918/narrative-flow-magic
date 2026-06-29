import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ScanShareCard, type ScanRecord } from '@/components/ScanShareCard'

export const Route = createFileRoute('/dev/share-card')({
  component: Preview,
})

const SAMPLES: ScanRecord[] = [
  { score: 142, signature: 'quiet drift', read: 'settling — a soft hum in the background.', factors: ['low sleep', 'gentle loneliness'], pillar: 'self' },
  { score: 318, signature: 'low hum', read: 'sitting with it — present but not loud.', factors: ['unspoken worry', 'work pressure'], pillar: 'work' },
  { score: 512, signature: 'pulled thin', read: 'weighing — taking real attention now.', factors: ['recurring conflict', 'unmet need'], pillar: 'family' },
  { score: 728, signature: 'loud loop', read: 'heavy & loud — keeps replaying.', factors: ['broken trust', 'late nights'], pillar: 'love' },
  { score: 904, signature: 'all-consuming', read: 'consuming — running the whole show.', factors: ['fear of loss', 'identity wobble'], pillar: 'self' },
]

function Preview() {
  const [i, setI] = useState(2)
  const [open, setOpen] = useState(true)
  const [msg, setMsg] = useState('')
  return (
    <div style={{ minHeight: '100vh', background: '#0b0b14', color: '#fff', padding: 24, fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: 12 }}>Scan share card preview</h1>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {SAMPLES.map((s, idx) => (
          <button
            key={idx}
            onClick={() => { setI(idx); setOpen(true) }}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #333', background: idx === i ? '#e7548a' : '#1a1a24', color: '#fff', cursor: 'pointer' }}
          >
            {s.score} · {s.signature}
          </button>
        ))}
        {!open && (
          <button onClick={() => setOpen(true)} style={{ padding: '8px 12px', borderRadius: 8, background: '#7F77DD', color: '#fff', border: 0, cursor: 'pointer' }}>
            reopen
          </button>
        )}
      </div>
      {msg && <div style={{ marginTop: 8, opacity: 0.7 }}>{msg}</div>}
      {open && <ScanShareCard record={SAMPLES[i]} onClose={() => setOpen(false)} toast={setMsg} />}
    </div>
  )
}

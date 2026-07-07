/* Final "enter" step. Lazy-loaded — routes user to their pending intent
 * or the default stream. */
import { getRouterRef } from '@/lib/router-ref'
import { EyeMark, primaryBtn, SOFT, TEXT } from './shared'

export interface WelcomeEnterStepProps {
  displayName: string
}

export function WelcomeEnterStep({ displayName }: WelcomeEnterStepProps) {
  const enterRoom = () => {
    const router = getRouterRef()
    const goPath = (to: string) => { if (router) router.navigate({ to }); else window.location.replace(to) }
    const goHash = (hash: 'spill' | 'scan') => { if (router) router.navigate({ to: '/', hash }); else window.location.replace('/#' + hash) }
    const goRoom = (roomId: string) => {
      if (router) router.navigate({ to: '/room', search: { id: roomId } as never })
      else window.location.replace('/room?id=' + encodeURIComponent(roomId))
    }
    try {
      const raw = sessionStorage.getItem('shutap_pending_intent')
      if (raw) {
        sessionStorage.removeItem('shutap_pending_intent')
        const intent = JSON.parse(raw) as
          | { kind: 'spill' } | { kind: 'scan' } | { kind: 'subscribe' }
          | { kind: 'comment' | 'relate' | 'react'; roomId: string }
          | { kind: 'custom'; url: string }
        if (intent.kind === 'spill') { goHash('spill'); return }
        if (intent.kind === 'scan') { goHash('scan'); return }
        if (intent.kind === 'subscribe') { goPath('/subscribe'); return }
        if (intent.kind === 'custom') {
          const url = intent.url
          if (url.startsWith('/') && !url.startsWith('//') && router) router.history.push(url)
          else window.location.replace(url)
          return
        }
        if ('roomId' in intent && intent.roomId) { goRoom(intent.roomId); return }
      }
      const pc = sessionStorage.getItem('shutap_pending_comment')
      if (pc) {
        const parsed = JSON.parse(pc) as { roomId?: string }
        if (parsed?.roomId) { goRoom(parsed.roomId); return }
      }
      if (sessionStorage.getItem('shutap_pending_save')) { goHash('spill'); return }
      const ret = sessionStorage.getItem('shutap_returnTo')
      if (ret) {
        sessionStorage.removeItem('shutap_returnTo')
        if (ret.startsWith('/') && !ret.startsWith('//') && router) router.history.push(ret)
        else window.location.replace(ret)
        return
      }
    } catch { /* noop */ }
    goPath('/stream')
  }

  return (
    <div className="wstep" style={{ display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'center' }}>
      <EyeMark />
      <div>
        <div style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 26, color: '#f7b8d4', marginBottom: 10 }}>
          welcome, {displayName}
        </div>
        <div style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 16, lineHeight: 1.6, color: SOFT, maxWidth: '34ch', margin: '0 auto' }}>
          the room knows you now. whatever you're carrying, you can put it down here.
        </div>
      </div>
      <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.10)', borderRadius: 16, padding: '18px 20px', textAlign: 'left', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ flex: 'none', marginTop: 3 }}><EyeMark size={22} /></div>
        <div style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 15.5, lineHeight: 1.55, color: TEXT }}>
          when you're ready, tap the eye anytime. i'll be here.
        </div>
      </div>
      <button style={primaryBtn} onClick={enterRoom}>enter the room →</button>
    </div>
  )
}

export default WelcomeEnterStep

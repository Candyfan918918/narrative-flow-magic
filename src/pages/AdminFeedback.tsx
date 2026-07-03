/* Pixel-perfect iframe port of Shutap-Feedback-Admin.html (0627 handoff).
 * Rendered below the GlobalHeader — fills remaining viewport. */
import { NoIndex } from '@/components/NoIndex'

export function AdminFeedbackPage() {
  return (
    <>
      <NoIndex />
      <iframe
        src="/shutap/Shutap-Feedback-Admin.dc.html"
        title="Shutap — Feedback Admin"
        style={{ display: 'block', width: '100%', height: 'calc(100vh - 96px)', border: 0, background: '#faf9f5' }}
      />
    </>
  )
}

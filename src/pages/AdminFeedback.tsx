/* Pixel-perfect iframe port of Shutap-Feedback-Admin.html (0627 handoff). */
import { NoIndex } from '@/components/NoIndex'

export function AdminFeedbackPage() {
  return (
    <>
      <NoIndex />
      <iframe
        src="/shutap/Shutap-Feedback-Admin.dc.html"
        title="Shutap — Feedback Admin"
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0, background: '#faf9f5' }}
      />
    </>
  )
}

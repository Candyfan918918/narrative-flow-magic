/* Pixel-perfect iframe port of Shutap-Profile.html (0627 handoff). */
export function ProfilePage() {
  return (
    <iframe
      src="/shutap/Shutap-Profile.dc.html"
      title="Shutap — Profile"
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0, background: '#faf9f5' }}
    />
  )
}

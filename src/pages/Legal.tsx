/* Pixel-perfect port of handoff Legal.dc.html via iframe. */
export function LegalPage() {
  return (
    <iframe
      src="/shutap/Legal.dc.html"
      title="Shutap — Legal"
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0, margin: 0, padding: 0, background: '#fdf0f5' }}
    />
  )
}

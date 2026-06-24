/* Pixel-perfect port of project/Landing.dc.html.
   The prototype is a self-contained static page that depends on its own
   <x-dc>/<helmet>/support.js shell and seed-data.js. To preserve every
   pixel, font, animation, and inline script of the imported file verbatim,
   we serve it from /public/shutap/Landing.dc.html and mount it full-viewport
   here. The assets (support.js, seed-data.js, styles.css, tokens/, assets/)
   sit beside it under /shutap/, matching the import bundle's layout. */
export function LandingPage() {
  return (
    <iframe
      src="/shutap/Landing.dc.html"
      title="Shutap — Landing"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        border: 0,
        margin: 0,
        padding: 0,
        background: '#fdf0f5',
      }}
    />
  )
}
